// Prenotazioni: evento da DB, check capienza in transazione (solo confirmed).
// Auth obbligatoria. Stato iniziale pending_payment; idempotenza: 1 prenotazione per (evento, membro).
// guests sempre 1.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getEventBySlug } from "@/lib/events";
import { reservationSchema, type ReservationInput } from "@/lib/validation";
import { handleApiError } from "@/lib/api-error";
import { sanitizeTextFields } from "@/lib/sanitize";
import { withRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { verifySessionToken, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";

const NO_CAPACITY = "NO_CAPACITY";
const EVENT_NOT_FOUND = "EVENT_NOT_FOUND";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(FENAM_SESSION_COOKIE)?.value;
    const session = verifySessionToken(cookieValue);
    if (!session) {
      return NextResponse.json(
        { error: "Per prenotare è necessario accedere con FENAM." },
        { status: 401 }
      );
    }

    const rateLimitCheck = withRateLimit(2, 60000); // 2 richieste/minuto per prevenire abusi
    const { allowed, retryAfter } = rateLimitCheck(req);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter || 60) } }
      );
    }

    const body = await req.json();
    const validationResult = reservationSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(validationResult.error);
    }
    const data: ReservationInput = validationResult.data;

    const eventFromDb = await getEventBySlug(data.eventSlug);
    if (!eventFromDb) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const notes = data.notes ? sanitizeTextFields({ notes: data.notes }).notes : null;
    type MemberUpdateFields = { firstName: string; lastName: string; phone: string };
    const memberUpdate: MemberUpdateFields | null =
      data.firstName != null || data.lastName != null || data.phone != null
        ? sanitizeTextFields({
            firstName: data.firstName ?? "",
            lastName: data.lastName ?? "",
            phone: data.phone ?? "",
          } as MemberUpdateFields)
        : null;

    logger.info("Reservation attempt", { eventSlug: data.eventSlug });

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.reservation.findFirst({
        where: {
          eventId: eventFromDb.id,
          fenamMemberId: session.fenamMemberId,
        },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        if (existing.status === "confirmed") {
          const err = new Error("ALREADY_CONFIRMED") as Error & { code?: string };
          err.code = "ALREADY_CONFIRMED";
          throw err;
        }
        if (existing.status === "pending_payment") {
          // Aggiorna la prenotazione esistente con nuovi dati invece di ritornarla così com'è
          const updatedReservation = await tx.reservation.update({
            where: { id: existing.id },
            data: {
              ...(notes !== null && { notes }),
            },
          });
          return { reservation: updatedReservation, event: eventFromDb, existing: true };
        }
      }

      // Controllo capienza atomico: include sia confirmed che pending_payment
      const event = await tx.event.findUnique({
        where: { id: eventFromDb.id },
        include: {
          reservations: {
            where: {
              status: {
                in: ["confirmed", "pending_payment"], // Include entrambi per evitare overbooking
              },
            },
            select: { guests: true },
          },
        },
      });
      if (!event) throw new Error(EVENT_NOT_FOUND);
      const booked = event.reservations.reduce((s, r) => s + r.guests, 0);
      const remaining = event.capacity - booked;
      // Bug fix: corretto da "1 > remaining" a "remaining < 1"
      if (remaining < 1) {
        const err = new Error(NO_CAPACITY) as Error & { code?: string };
        err.code = NO_CAPACITY;
        throw err;
      }

      const fenamMember = await tx.fenamMember.findUniqueOrThrow({
        where: { id: session.fenamMemberId },
      });
      if (
        memberUpdate &&
        (memberUpdate.firstName || memberUpdate.lastName || memberUpdate.phone !== undefined)
      ) {
        await tx.fenamMember.update({
          where: { id: fenamMember.id },
          data: {
            ...(memberUpdate.firstName && { firstName: memberUpdate.firstName }),
            ...(memberUpdate.lastName && { lastName: memberUpdate.lastName }),
            ...(memberUpdate.phone !== undefined && { phone: memberUpdate.phone || null }),
          },
        });
      }
      const reservation = await tx.reservation.create({
        data: {
          eventId: event.id,
          fenamMemberId: fenamMember.id,
          guests: 1,
          notes,
          status: "pending_payment",
        },
      });
      return { reservation, event, existing: false };
    });

    logger.info("Reservation created or existing", {
      reservationId: result.reservation.id,
      eventId: eventFromDb.id,
      existing: result.existing,
    });

    return NextResponse.json(
      {
        success: true,
        reservationId: result.reservation.id,
        eventId: eventFromDb.id,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && (error as Error & { code?: string }).code === "ALREADY_CONFIRMED") {
      return NextResponse.json(
        { error: "Sei già prenotato per questo evento." },
        { status: 409 }
      );
    }
    if (error instanceof Error && (error as Error & { code?: string }).code === NO_CAPACITY) {
      return NextResponse.json(
        { error: "Non ci sono abbastanza posti disponibili per questa prenotazione." },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === EVENT_NOT_FOUND) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    return handleApiError(error);
  }
}
