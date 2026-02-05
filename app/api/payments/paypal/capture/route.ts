/**
 * POST /api/payments/paypal/capture
 * body: { reservationId, orderId }
 * Verifica sessione, ownership, pending_payment; cattura ordine; conferma prenotazione in transazione (anti-overbooking); invia email.
 * Idempotente: se reservation già confirmed con captureId → ritorna ok.
 * Se env PayPal mancanti: 503 { error: "PAYPAL_NOT_CONFIGURED", missing }. Prenotazione altrui: 404. Capienza superata: 409 { error: "SOLD_OUT" }.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getEventById } from "@/lib/events";
import { captureOrder, getPayPalConfigStatus } from "@/lib/paypal";
import { sendReservationConfirmation } from "@/lib/email";
import { verifySessionToken, FENAM_SESSION_COOKIE, isPlaceholderEmail } from "@/lib/fenam-handoff";
import { logger } from "@/lib/logger";

function safePayPalLog(
  stage: "create-order" | "capture",
  data: {
    mode?: string | null;
    intent?: string;
    hasClientId?: boolean;
    clientIdLen?: number;
    hasSecret?: boolean;
    reservationId?: string;
    orderIdPrefix?: string;
    errorCode?: string;
  }
) {
  if (process.env.NODE_ENV === "test") return;
  console.warn(`[PayPal ${stage}]`, {
    mode: data.mode ?? process.env.PAYPAL_MODE ?? null,
    intent: data.intent ?? "capture",
    hasClientId: data.hasClientId ?? !!process.env.PAYPAL_CLIENT_ID,
    clientIdLen: data.clientIdLen ?? (process.env.PAYPAL_CLIENT_ID?.length ?? 0),
    hasSecret: data.hasSecret ?? !!process.env.PAYPAL_SECRET,
    reservationId: data.reservationId,
    orderIdPrefix: data.orderIdPrefix,
    errorCode: data.errorCode,
  });
}

function generateConfirmationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TULL-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  const paypalStatus = getPayPalConfigStatus();
  if (!paypalStatus.configured) {
    safePayPalLog("capture", { errorCode: "PAYPAL_NOT_CONFIGURED" });
    return NextResponse.json(
      { error: "PAYPAL_NOT_CONFIGURED", missing: paypalStatus.missing },
      { status: 503 }
    );
  }

  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(FENAM_SESSION_COOKIE)?.value;
    const session = verifySessionToken(cookieValue);
    if (!session) {
      return NextResponse.json(
        { error: "Sessione non valida. Accedi con FENAM." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as { reservationId?: string; orderId?: string };
    const reservationId = body?.reservationId;
    const orderId = body?.orderId;
    if (!reservationId || !orderId || typeof reservationId !== "string" || typeof orderId !== "string") {
      safePayPalLog("capture", { errorCode: "MISSING_PARAMS" });
      return NextResponse.json(
        { error: "reservationId e orderId richiesti" },
        { status: 400 }
      );
    }
    safePayPalLog("capture", { reservationId, orderIdPrefix: orderId.slice(0, 8) });

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { event: true, fenamMember: true },
    });
    if (!reservation || reservation.fenamMemberId !== session.fenamMemberId) {
      return NextResponse.json(
        { error: "Prenotazione non trovata" },
        { status: 404 }
      );
    }

    if (reservation.status === "confirmed" && reservation.paypalCaptureId) {
      return NextResponse.json({
        ok: true,
        confirmationCode: reservation.confirmationCode ?? undefined,
      });
    }

    if (reservation.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Questa prenotazione non è in attesa di pagamento." },
        { status: 400 }
      );
    }

    if (reservation.paypalOrderId && reservation.paypalOrderId !== orderId) {
      logger.warn("Capture orderId mismatch for reservation", { reservationId });
      return NextResponse.json(
        { error: "L'ordine PayPal non corrisponde a questa prenotazione." },
        { status: 400 }
      );
    }

    const { captureId, status } = await captureOrder(orderId);
    if (status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Cattura pagamento non completata." },
        { status: 402 }
      );
    }

    let confirmationCode = reservation.confirmationCode;
    if (!confirmationCode) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateConfirmationCode();
        const existing = await prisma.reservation.findUnique({
          where: { confirmationCode: candidate },
        });
        if (!existing) {
          confirmationCode = candidate;
          break;
        }
      }
      if (!confirmationCode) {
        confirmationCode = `TULL-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      }
    }

    const now = new Date();

    // Transazione: ricontrollo capienza prima di confermare (anti-overbooking)
    try {
      await prisma.$transaction(async (tx) => {
        const eventWithCount = await tx.event.findUnique({
          where: { id: reservation.eventId },
          include: {
            reservations: {
              where: { status: "confirmed" },
              select: { guests: true },
            },
          },
        });
        if (!eventWithCount) {
          const err = new Error("EVENT_NOT_FOUND") as Error & { code?: string };
          err.code = "EVENT_NOT_FOUND";
          throw err;
        }
        const booked = eventWithCount.reservations.reduce((s, r) => s + r.guests, 0);
        const remaining = eventWithCount.capacity - booked;
        if (remaining < 1) {
          const err = new Error("SOLD_OUT") as Error & { code?: string };
          err.code = "SOLD_OUT";
          throw err;
        }
        await tx.reservation.update({
          where: { id: reservationId },
          data: {
            status: "confirmed",
            paidAt: now,
            paypalCaptureId: captureId,
            confirmationCode,
          },
        });
      });
    } catch (txErr) {
      if (txErr instanceof Error && (txErr as Error & { code?: string }).code === "SOLD_OUT") {
        return NextResponse.json(
          { error: "SOLD_OUT" },
          { status: 409 }
        );
      }
      if (txErr instanceof Error && (txErr as Error & { code?: string }).code === "EVENT_NOT_FOUND") {
        return NextResponse.json(
          { error: "Evento non trovato." },
          { status: 404 }
        );
      }
      throw txErr;
    }

    const event = await getEventById(reservation.eventId);
    const eventTitle = event?.title ?? (reservation.event as { title?: string })?.title ?? "Cena";
    const eventDate =
      event?.date != null
        ? new Intl.DateTimeFormat("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(event.date))
        : "";

    const reservationForEmail = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { fenamMember: true },
    });
    const toEmail = reservationForEmail?.fenamMember?.email ?? reservation.fenamMember.email;
    const notesForEmail = reservationForEmail?.notes ?? reservation.notes;

    if (!toEmail || !toEmail.trim() || isPlaceholderEmail(toEmail)) {
      if (process.env.NODE_ENV !== "test") {
        logger.warn("Email conferma non inviata (destinatario non reale)", {
          reservationId,
          reason: "missing_real_email",
        });
      }
    } else {
      sendReservationConfirmation({
        to: toEmail,
        eventTitle,
        eventDate,
        confirmationCode,
        notes: notesForEmail,
      }).then((r) => {
        if (!r.ok) {
          logger.warn("Email conferma non inviata", { reservationId, error: r.error });
        }
      });
    }

    return NextResponse.json({
      ok: true,
      confirmationCode,
    });
  } catch (err) {
    safePayPalLog("capture", {
      errorCode: err instanceof Error ? err.name : "Unknown",
    });
    const status = getPayPalConfigStatus();
    if (!status.configured) {
      return NextResponse.json(
        { error: "PAYPAL_NOT_CONFIGURED", missing: status.missing },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : "Errore cattura pagamento";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
