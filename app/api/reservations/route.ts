// NOTE: Le prenotazioni vengono salvate nella tabella Reservation
// tramite Prisma. Richiede che l'utente sia membro FENAM.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventBySlug } from "@/lib/mockEvents";
import { reservationSchema, type ReservationInput } from "@/lib/validation";
import { handleApiError } from "@/lib/api-error";
import { sanitizeTextFields } from "@/lib/sanitize";
import { withRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    // Rate limiting
    const rateLimitCheck = withRateLimit(5, 60000); // 5 richieste al minuto
    const { allowed, retryAfter } = rateLimitCheck(req);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter || 60),
          },
        }
      );
    }

    const body = await req.json();

    // Validazione con Zod
    const validationResult = reservationSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(validationResult.error);
    }

    const data: ReservationInput = validationResult.data;

    // Verifica che l'evento esista nei mock events
    const mockEvent = getEventBySlug(data.eventSlug);
    if (!mockEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Sanitizzazione input
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
      hasDataConsent: data.dataConsent,
    });

    // Upsert evento nel database
    const event = await prisma.event.upsert({
      where: { slug: mockEvent.slug },
      update: {
        title: mockEvent.title,
        subtitle: mockEvent.shortDescription,
        date: mockEvent.date,
        locationName: mockEvent.locationName,
        locationAddress: mockEvent.locationAddress ?? null,
        description: mockEvent.fullDescription,
      },
      create: {
        slug: mockEvent.slug,
        title: mockEvent.title,
        subtitle: mockEvent.shortDescription,
        date: mockEvent.date,
        locationName: mockEvent.locationName,
        locationAddress: mockEvent.locationAddress ?? null,
        description: mockEvent.fullDescription,
      },
    });

    // Upsert membro FENAM
    const fenamMember = await prisma.fenamMember.upsert({
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

    // Crea la prenotazione
    const reservation = await prisma.reservation.create({
      data: {
        eventId: event.id,
        fenamMemberId: fenamMember.id,
        guests: data.participants,
        notes: sanitizedData.notes,
      },
    });

    logger.info("Reservation created", {
      reservationId: reservation.id,
      eventId: event.id,
      memberId: fenamMember.id,
      guests: reservation.guests,
    });

    return NextResponse.json(
      {
        success: true,
        reservationId: reservation.id,
        eventId: event.id,
        guests: reservation.guests,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
