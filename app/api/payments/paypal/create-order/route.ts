/**
 * POST /api/payments/paypal/create-order
 * body: { reservationId }
 * Verifica sessione, ownership, status pending_payment; crea ordine PayPal; salva paypalOrderId; ritorna { orderId }.
 * Se env PayPal mancanti: 503 { error: "PAYPAL_NOT_CONFIGURED", missing }. Prenotazione altrui: 404 (stessa risposta di non esistente).
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getEventById } from "@/lib/events";
import { createOrder, getPayPalConfigStatus } from "@/lib/paypal";
import { verifySessionToken, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";

const DEFAULT_EVENT_PRICE_EUR = "70.00"; // Cena Tullpukuna

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

export async function POST(req: NextRequest) {
  const paypalStatus = getPayPalConfigStatus();
  if (!paypalStatus.configured) {
    safePayPalLog("create-order", { errorCode: "PAYPAL_NOT_CONFIGURED" });
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

    const body = (await req.json()) as { reservationId?: string };
    const reservationId = body?.reservationId;
    if (!reservationId || typeof reservationId !== "string") {
      safePayPalLog("create-order", { errorCode: "MISSING_RESERVATION_ID" });
      return NextResponse.json(
        { error: "reservationId richiesto" },
        { status: 400 }
      );
    }
    safePayPalLog("create-order", { reservationId });

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { event: true },
    });
    if (!reservation || reservation.fenamMemberId !== session.fenamMemberId) {
      return NextResponse.json(
        { error: "Prenotazione non trovata" },
        { status: 404 }
      );
    }
    if (reservation.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Questa prenotazione non è in attesa di pagamento." },
        { status: 400 }
      );
    }

    // Idempotenza: se esiste già un ordine PayPal per questa prenotazione, ritorna lo stesso orderId
    if (reservation.paypalOrderId) {
      return NextResponse.json({ orderId: reservation.paypalOrderId });
    }

    const event = await getEventById(reservation.eventId);
    const amount =
      event?.price != null
        ? event.price.toFixed(2)
        : (reservation.event as { priceCents?: number })?.priceCents != null
          ? ((reservation.event as { priceCents: number }).priceCents / 100).toFixed(2)
          : DEFAULT_EVENT_PRICE_EUR;

    const orderId = await createOrder({ amount, currency: "EUR" });

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { paypalOrderId: orderId },
    });

    safePayPalLog("create-order", { reservationId, orderIdPrefix: orderId.slice(0, 8) });
    return NextResponse.json({ orderId });
  } catch (err) {
    safePayPalLog("create-order", {
      errorCode: err instanceof Error ? err.name : "Unknown",
    });
    const status = getPayPalConfigStatus();
    if (!status.configured) {
      return NextResponse.json(
        { error: "PAYPAL_NOT_CONFIGURED", missing: status.missing },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : "Errore creazione ordine PayPal";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
