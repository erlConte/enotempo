/**
 * Helper unificato per gestione autenticazione FENAM
 * Usato da entrambi gli endpoint /callback (GET) e /handoff (POST) per evitare duplicazione
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
  shouldRefreshSession,
} from "@/lib/fenam-handoff";
import { upsertFenamMemberByExternalId } from "@/lib/fenam-member";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 giorni
const DEFAULT_REDIRECT = "/it/cene";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
} as const;

export type FenamAuthResult =
  | { success: true; redirectUrl: string; response: NextResponse }
  | { success: false; error: string; status: number; response: NextResponse };

/**
 * Processa autenticazione FENAM unificata
 * @param token - Token FENAM da verificare
 * @param req - Request object per ottenere origin e redirect params
 * @param method - Metodo HTTP ("GET" o "POST") per logging
 */
export async function processFenamAuth(
  token: string,
  req: NextRequest,
  method: "GET" | "POST"
): Promise<FenamAuthResult> {
  const { searchParams } = new URL(req.url);
  const redirectParam = searchParams.get("redirect") || searchParams.get("returnUrl");
  const origin = req.nextUrl.origin;

  // Validazione redirect interno
  const internalRedirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : DEFAULT_REDIRECT;

  try {
    const payload = verifyFenamToken(token);

    const fenamMember = await upsertFenamMemberByExternalId(prisma, {
      email: payload.email ?? null,
      stableId: payload.stableId,
      affiliationId: payload.affiliationId,
      memberNumber: payload.memberNumber,
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

    const redirectUrl = getAllowlistedRedirectUrl(internalRedirect, origin, DEFAULT_REDIRECT);
    const res = NextResponse.redirect(redirectUrl, method === "POST" ? 303 : 302);
    Object.entries(NO_CACHE_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return { success: true, redirectUrl, response: res };
  } catch (e) {
    const verifyErrorCode = getVerifyErrorCode(e);
    const peek = safeJwtPeek(token);
    console.warn(`[fenam/${method === "GET" ? "callback" : "handoff"}] 401`, {
      verifyErrorCode,
      alg: peek.alg,
      hasIss: peek.hasIss,
      issHash: peek.issHash,
      expDeltaSec: peek.expDeltaSec,
      tokenParts: peek.tokenParts,
      tokenLen: peek.tokenLen,
    });
    const errorResponse = NextResponse.json(
      { error: "Token non valido o scaduto" },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
    return { success: false, error: "Token non valido o scaduto", status: 401, response: errorResponse };
  }
}
