/**
 * POST /api/auth/fenam/handoff
 * Riceve POST da FeNAM (HTML autosubmit). Body: token (HMAC firmato), redirect in query.
 * Verifica firma HMAC (FENAM_HANDOFF_SECRET), exp, iss === "fenam".
 * Estrae affiliationId, memberNumber, email; crea/aggiorna FenamMember; crea sessione Enotempo; redirect.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyFenamToken, createSessionToken, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const redirectTo = searchParams.get("redirect") || "/it/cene";

    let body: { token?: string };
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const token = formData.get("token");
      body = { token: typeof token === "string" ? token : undefined };
    } else {
      return NextResponse.json(
        { error: "Content-Type non supportato. Usa application/json o form." },
        { status: 400 }
      );
    }

    const token = body?.token;
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token mancante" },
        { status: 400 }
      );
    }

    const payload = verifyFenamToken(token);

    const fenamMember = await prisma.fenamMember.upsert({
      where: { email: payload.email.toLowerCase().trim() },
      update: {
        externalFenamId: payload.affiliationId || payload.memberNumber || undefined,
      },
      create: {
        email: payload.email.toLowerCase().trim(),
        firstName: "",
        lastName: "",
        externalFenamId: payload.affiliationId || payload.memberNumber || undefined,
      },
    });

    const sessionToken = createSessionToken(fenamMember.id);
    const cookieStore = await cookies();
    cookieStore.set(FENAM_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    const base = req.nextUrl.origin;
    const redirectUrl = redirectTo.startsWith("http") ? redirectTo : `${base}${redirectTo.startsWith("/") ? "" : "/"}${redirectTo}`;
    return NextResponse.redirect(redirectUrl, 303);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handoff fallito";
    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}
