import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, createSessionToken, shouldRefreshSession, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 giorni

export async function GET() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(FENAM_SESSION_COOKIE)?.value;
  const session = verifySessionToken(cookieValue);
  if (!session) {
    return NextResponse.json({ hasIdentity: false });
  }

  const member = await prisma.fenamMember.findUnique({
    where: { id: session.fenamMemberId },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true },
  });
  if (!member) {
    // Membro cancellato: invalida sessione
    cookieStore.delete(FENAM_SESSION_COOKIE);
    return NextResponse.json({ hasIdentity: false });
  }

  // Refresh sessione se necessario (entro 7 giorni dalla scadenza)
  const response = NextResponse.json({
    hasIdentity: true,
    member: {
      id: member.id,
      email: member.email,
      firstName: member.firstName ?? "",
      lastName: member.lastName ?? "",
      phone: member.phone ?? "",
    },
  });

  if (shouldRefreshSession(session)) {
    const newSessionToken = createSessionToken(member.id);
    cookieStore.set(FENAM_SESSION_COOKIE, newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }

  return response;
}
