/**
 * Verifica token HMAC FeNAM e gestione sessione Enotempo (cookie httpOnly, sameSite Lax).
 * Nessun token in query, nessun cookie cross-domain.
 */

import { createHmac, timingSafeEqual } from "crypto";

const ISS_FENAM = "fenam";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year

/** Nome del cookie di sessione Enotempo (httpOnly, sameSite Lax) */
export const FENAM_SESSION_COOKIE = "fenamToken";

export type FenamHandoffPayload = {
  affiliationId: string;
  memberNumber: string;
  email: string;
  exp: number;
  iss: string;
};

export type SessionPayload = {
  fenamMemberId: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.FENAM_HANDOFF_SECRET;
  if (!secret || typeof secret !== "string") {
    throw new Error("FENAM_HANDOFF_SECRET is required (missing)");
  }
  if (secret.length < 16) {
    throw new Error("FENAM_HANDOFF_SECRET must be at least 16 characters");
  }
  return secret;
}

/**
 * Token FeNAM: base64url(payload).base64url(hmac)
 * payload = { affiliationId, memberNumber, email, exp, iss }
 */
export function verifyFenamToken(token: string): FenamHandoffPayload {
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");
  const [payloadB64, sigB64] = parts;
  const payloadJson = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64url").toString("utf8");
  const payload = JSON.parse(payloadJson) as FenamHandoffPayload;
  if (payload.iss !== ISS_FENAM) throw new Error("Invalid iss");
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) throw new Error("Token expired");
  const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  if (expectedSig.length !== sigB64.length || !timingSafeEqual(Buffer.from(expectedSig, "utf8"), Buffer.from(sigB64, "utf8"))) {
    throw new Error("Invalid signature");
  }
  return payload;
}

export function createSessionToken(fenamMemberId: string): string {
  const secret = getSecret();
  const payload: SessionPayload = {
    fenamMemberId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(cookieValue: string | undefined): SessionPayload | null {
  if (!cookieValue || !cookieValue.includes(".")) return null;
  try {
    const secret = getSecret();
    const parts = cookieValue.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;
    const payloadJson = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
    if (expectedSig.length !== sigB64.length || !timingSafeEqual(Buffer.from(expectedSig, "utf8"), Buffer.from(sigB64, "utf8"))) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** Per uso in pagine server: restituisce true solo se la sessione è valida (non lancia se secret mancante). */
export function hasValidSession(cookieValue: string | undefined): boolean {
  try {
    return verifySessionToken(cookieValue) !== null;
  } catch {
    return false;
  }
}

/** Host allowlisted per redirect dopo login (evita open redirect). www normalizzato a enotempo.it. */
const ALLOWED_HOSTS = ["enotempo.it", "www.enotempo.it"];

/**
 * Restituisce l'URL di redirect completo solo se sicuro. Fallback silenzioso su input invalido.
 * - redirectParam falsy → ${origin}${defaultPath}
 * - Path relativo: deve iniziare con /, non con // (// → fallback)
 * - URL assoluta: host allowlisted (enotempo.it, www.enotempo.it), protocollo forzato https, www → enotempo.it
 */
export function getAllowlistedRedirectUrl(
  redirectParam: string | null,
  origin: string,
  defaultPath: string
): string {
  const defaultFull = `${origin}${defaultPath.startsWith("/") ? "" : "/"}${defaultPath}`;
  if (!redirectParam || typeof redirectParam !== "string") return defaultFull;
  const trimmed = redirectParam.trim();
  if (!trimmed) return defaultFull;
  // Path relativo: / ok, // evil → fallback
  if (trimmed.startsWith("//")) return defaultFull;
  if (trimmed.startsWith("/")) return `${origin}${trimmed}`;
  try {
    const u = new URL(trimmed);
    const hostLower = u.host.toLowerCase();
    if (!ALLOWED_HOSTS.includes(hostLower)) return defaultFull;
    // Forza https; normalizza www.enotempo.it → enotempo.it
    u.protocol = "https:";
    if (hostLower === "www.enotempo.it") u.hostname = "enotempo.it";
    return u.origin + u.pathname + u.search;
  } catch {
    return defaultFull;
  }
}
