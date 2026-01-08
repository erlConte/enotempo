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

    const member = await prisma.fenamMember.findUnique({
      where: { email },
    });

    return NextResponse.json(
      { isMember: !!member },
      { status: 200 }
    );
  } catch (error) {
    console.error("FENAM check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

