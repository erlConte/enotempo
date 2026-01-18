// NOTE: I dati FENAM vengono salvati nella tabella FenamMember
// tramite Prisma. Non usiamo sessioni o cookie: la membership
// viene verificata di volta in volta via API partendo dall'email.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
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

    const member = await prisma.fenamMember.findUnique({
      where: { email },
    });

    return NextResponse.json(
      { isMember: !!member },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("FENAM check error:", error);
    
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
    if (error.code === "P1001") {
      errorMessage = "Database connection error";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

