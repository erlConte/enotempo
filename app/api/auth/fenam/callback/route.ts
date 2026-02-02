/**
 * GET /api/auth/fenam/callback
 * Callback dopo login FENAM: FENAM redirige qui con token in query (fenamToken primario, token fallback).
 * Verifica JWT HS256 o HMAC (FENAM_HANDOFF_SECRET), crea sessione Enotempo, redirect a path allowlisted.
 * Log diagnostica SAFE: tokenPresent, tokenLen, secretPresent, verifyErrorCode (mai token/PII).
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifyFenamToken,
  createSessionToken,
  getVerifyErrorCode,
  safeJwtPeek,
  FENAM_SESSION_COOKIE,
  getAllowlistedRedirectUrl,
} from "@/lib/fenam-handoff";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const DEFAULT_REDIRECT = "/it/cene";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
} as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("fenamToken") ?? searchParams.get("token");
  const redirectParam = searchParams.get("redirect");
  const origin = req.nextUrl.origin;

  const tokenPresent = !!token && typeof token === "string";
  const tokenLen = tokenPresent ? (token as string).length : 0;
  const secretPresent = !!(process.env.FENAM_HANDOFF_SECRET && process.env.FENAM_HANDOFF_SECRET.trim());

  if (!tokenPresent) {
    if (process.env.DEBUG_AUTH === "1") {
      console.warn("[fenam/callback] 400", { tokenPresent: false, secretPresent });
    }
    return NextResponse.json({ error: "Token mancante" }, { status: 400, headers: NO_CACHE_HEADERS });
  }

  try {
    const payload = verifyFenamToken(token as string);

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

    const redirectUrl = getAllowlistedRedirectUrl(redirectParam, origin, DEFAULT_REDIRECT);
    const res = NextResponse.redirect(redirectUrl, 302);
    Object.entries(NO_CACHE_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (e) {
    const verifyErrorCode = getVerifyErrorCode(e);
    const peek = safeJwtPeek(token as string);
    console.warn("[fenam/callback] 401", {
      verifyErrorCode,
      alg: peek.alg,
      hasIss: peek.hasIss,
      issHash: peek.issHash,
      expDeltaSec: peek.expDeltaSec,
      tokenParts: peek.tokenParts,
      tokenLen: peek.tokenLen,
    });
    return NextResponse.json({ error: "Token non valido o scaduto" }, { status: 401, headers: NO_CACHE_HEADERS });
  }
}
