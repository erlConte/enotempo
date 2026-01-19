  // NOTE: Le prenotazioni vengono salvate nella tabella Reservation
// tramite Prisma. Richiede che l'utente sia membro FENAM.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      participants,
      notes,
      eventSlug,
      fenamConfirmed,
      dataConsent,
    } = body;

    // Validazione campi obbligatori
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!eventSlug) {
      return NextResponse.json(
        { message: "Event slug is required" },
        { status: 400 }
      );
    }

    if (!fenamConfirmed) {
      return NextResponse.json(
        { message: "FENAM membership confirmation is required" },
        { status: 400 }
      );
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validazione numero partecipanti
    const guests = parseInt(participants, 10);
    if (isNaN(guests) || guests < 1 || guests > 20) {
      return NextResponse.json(
        { message: "Invalid number of participants (1-20)" },
        { status: 400 }
      );
    }

    // Verifica che l'evento esista
    const event = await prisma.event.findUnique({
      where: { slug: eventSlug },
    });

    if (!event) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      );
    }

    // Upsert membro FENAM (crea se non esiste, aggiorna se esiste)
    const fenamMember = await prisma.fenamMember.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        phone,
      },
      create: {
        email,
        firstName,
        lastName,
        phone,
      },
    });

    // Log dataConsent per debugging (non salviamo nel DB)
    console.log("Reservation dataConsent", dataConsent);

    // Crea la prenotazione
    const reservation = await prisma.reservation.create({
      data: {
        eventId: event.id,
        fenamMemberId: fenamMember.id,
        guests,
        notes: notes || null,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        reservationId: reservation.id,
        eventId: event.id,
        guests,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Reservation error:", error);
    
    // Log dettagliato dell'errore per debugging
    if (error.code) {
      console.error("Prisma error code:", error.code);
    }
    if (error.meta) {
      console.error("Prisma error meta:", error.meta);
    }
    if (error.message) {
      console.error("Error message:", error.message);
    }

    // Messaggio di errore più specifico
    let errorMessage = "Internal server error";
    if (error.code === "P2002") {
      errorMessage = "Reservation already exists";
    } else if (error.code === "P2003") {
      errorMessage = "Invalid event or member reference";
    } else if (error.code === "P1001") {
      errorMessage = "Database connection error";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        message: errorMessage, 
        details: process.env.NODE_ENV === "development" ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

