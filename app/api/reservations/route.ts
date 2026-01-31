// Prenotazioni: evento da DB, check capienza in transazione (no overbooking).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventBySlug } from "@/lib/events";
import { reservationSchema, type ReservationInput } from "@/lib/validation";
import { handleApiError } from "@/lib/api-error";
import { sanitizeTextFields } from "@/lib/sanitize";
import { withRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const NO_CAPACITY = "NO_CAPACITY";
const EVENT_NOT_FOUND = "EVENT_NOT_FOUND";

export async function POST(req: Request) {
  try {
    const rateLimitCheck = withRateLimit(5, 60000);
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

    // Evento da DB (published, con capienza)
    const eventFromDb = await getEventBySlug(data.eventSlug);
    if (!eventFromDb) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const sanitizedData = sanitizeTextFields({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      notes: data.notes || null,
    });

    logger.info("Reservation attempt", {
      email: sanitizedData.email,
      eventSlug: data.eventSlug,
      guests: data.participants,
    });

    // Transazione: check capienza + crea prenotazione (evita overbooking)
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventFromDb.id },
        include: {
          reservations: {
            where: { status: "confirmed" },
            select: { guests: true },
          },
        },
      });
      if (!event) throw new Error(EVENT_NOT_FOUND);
      const booked = event.reservations.reduce((s, r) => s + r.guests, 0);
      const remaining = event.capacity - booked;
      if (data.participants > remaining) {
        const err = new Error(NO_CAPACITY) as Error & { code?: string };
        err.code = NO_CAPACITY;
        throw err;
      }
      const fenamMember = await tx.fenamMember.upsert({
        where: { email: sanitizedData.email },
        update: {
          firstName: sanitizedData.firstName,
          lastName: sanitizedData.lastName,
          phone: sanitizedData.phone,
        },
        create: {
          email: sanitizedData.email,
          firstName: sanitizedData.firstName,
          lastName: sanitizedData.lastName,
          phone: sanitizedData.phone,
        },
      });
      const reservation = await tx.reservation.create({
        data: {
          eventId: event.id,
          fenamMemberId: fenamMember.id,
          guests: data.participants,
          notes: sanitizedData.notes,
          status: "confirmed",
        },
      });
      return { reservation, event, fenamMember };
    });

    logger.info("Reservation created", {
      reservationId: result.reservation.id,
      eventId: result.event.id,
      guests: result.reservation.guests,
    });

    return NextResponse.json(
      {
        success: true,
        reservationId: result.reservation.id,
        eventId: result.event.id,
        guests: result.reservation.guests,
      },
      { status: 200 }
    );
  } catch (error) {
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
