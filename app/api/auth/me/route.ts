import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";

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
    return NextResponse.json({ hasIdentity: false });
  }

  return NextResponse.json({
    hasIdentity: true,
    member: {
      id: member.id,
      email: member.email,
      firstName: member.firstName ?? "",
      lastName: member.lastName ?? "",
      phone: member.phone ?? "",
    },
  });
}
