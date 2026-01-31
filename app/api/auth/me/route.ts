import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";

export async function GET() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(FENAM_SESSION_COOKIE)?.value;
  const session = verifySessionToken(cookieValue);
  return NextResponse.json({ hasIdentity: !!session });
}
