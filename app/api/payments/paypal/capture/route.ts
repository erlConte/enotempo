/**
 * POST /api/payments/paypal/capture
 * body: { reservationId, orderId }
 * Verifica sessione, ownership, pending_payment; cattura ordine; conferma prenotazione; invia email.
 * Idempotente: se reservation già confirmed con captureId → ritorna ok.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getEventById } from "@/lib/events";
import { captureOrder } from "@/lib/paypal";
import { sendReservationConfirmation } from "@/lib/email";
import { verifySessionToken, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";
import { logger } from "@/lib/logger";

function generateConfirmationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TULL-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
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
      return NextResponse.json(
        { error: "reservationId e orderId richiesti" },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { event: true, fenamMember: true },
    });
    if (!reservation || reservation.fenamMemberId !== session.fenamMemberId) {
      return NextResponse.json(
        { error: "Prenotazione non trovata o non autorizzata" },
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
          { error: "Non ci sono più posti disponibili per questo evento (sold out). Contatta il supporto per assistenza." },
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

    sendReservationConfirmation({
      to: reservation.fenamMember.email,
      eventTitle,
      eventDate,
      confirmationCode,
      notes: reservation.notes,
    }).then((r) => {
      if (!r.ok) {
        logger.warn("Email conferma non inviata", { reservationId, error: r.error });
      }
    });

    return NextResponse.json({
      ok: true,
      confirmationCode,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore cattura pagamento";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
