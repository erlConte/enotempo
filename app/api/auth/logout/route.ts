import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(FENAM_SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
