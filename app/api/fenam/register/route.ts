// NOTE: I dati FENAM vengono salvati nella tabella FenamMember
// tramite Prisma. Non usiamo sessioni o cookie: la membership
// viene verificata di volta in volta via API partendo dall'email.

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
      taxCode,
      locale,
      dataConsent
    } = body;

    // Log dataConsent per debugging (non salviamo nel DB)
    console.log("FENAM dataConsent", dataConsent);

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const member = await prisma.fenamMember.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        phone: phone || null, // phone è opzionale nello schema
        // taxCode e locale non sono nello schema, li ignoriamo per ora
      },
      create: {
        firstName,
        lastName,
        email,
        phone: phone || null, // phone è opzionale nello schema
        // taxCode e locale non sono nello schema, li ignoriamo per ora
      },
    });

    return NextResponse.json(
      { success: true, memberId: member.id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("FENAM register error:", error);
    
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
      errorMessage = "Email già registrata";
    } else if (error.code === "P1001") {
      errorMessage = "Errore di connessione al database";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === "development" ? error.message : undefined },
      { status: 500 }
    );
  }
}

