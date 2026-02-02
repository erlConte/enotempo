/**
 * Verifica token FeNAM (JWT HS256 o HMAC custom) e gestione sessione Enotempo (cookie httpOnly, sameSite Lax).
 * Nessun token in query, nessun cookie cross-domain.
 */

import { createHmac, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";

const ISS_FENAM = "fenam";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year
const CLOCK_TOLERANCE_SEC = 60;

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

/** Codice errore per diagnostica (no PII). */
export type FenamVerifyErrorCode =
  | "InvalidFormat"
  | "InvalidIss"
  | "TokenExpired"
  | "InvalidSignature"
  | "SecretMissing"
  | "JwtExpired"
  | "JsonWebTokenError";

function errWithCode(message: string, code: FenamVerifyErrorCode): Error {
  const e = new Error(message) as Error & { code: FenamVerifyErrorCode };
  e.code = code;
  return e;
}

function getSecret(): string {
  const secret = process.env.FENAM_HANDOFF_SECRET;
  if (!secret || typeof secret !== "string") {
    throw errWithCode("FENAM_HANDOFF_SECRET is required (missing)", "SecretMissing");
  }
  if (secret.length < 16) {
    throw errWithCode("FENAM_HANDOFF_SECRET must be at least 16 characters", "SecretMissing");
  }
  return secret;
}

/** Estrae verifyErrorCode da un errore (per log safe). */
export function getVerifyErrorCode(e: unknown): FenamVerifyErrorCode | string {
  if (e && typeof e === "object" && "code" in e && typeof (e as { code: unknown }).code === "string") {
    return (e as { code: FenamVerifyErrorCode }).code;
  }
  if (e instanceof Error) {
    if (e.message.includes("expired") || e.name === "TokenExpiredError") return "JwtExpired";
    if (e.name === "JsonWebTokenError") return "JsonWebTokenError";
  }
  return "Unknown";
}

type JwtPayload = { iss?: string; exp?: number; email?: string; sub?: string; affiliationId?: string; memberNumber?: string; affiliation_id?: string; member_number?: string };

/**
 * Verifica token FeNAM: JWT HS256 (3 parti, eyJ...) oppure HMAC custom (2 parti).
 * JWT: jsonwebtoken.verify con algorithms ['HS256'], clockTolerance 60s.
 * HMAC custom: base64url(payload).base64url(hmac), exp con tolleranza 60s.
 */
export function verifyFenamToken(token: string): FenamHandoffPayload {
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length === 3) {
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ["HS256"],
        clockTolerance: CLOCK_TOLERANCE_SEC,
      }) as JwtPayload;
      if (decoded.iss !== ISS_FENAM) throw errWithCode("Invalid iss", "InvalidIss");
      const email = decoded.email ?? decoded.sub;
      if (!email || typeof email !== "string") throw errWithCode("Missing email/sub", "InvalidFormat");
      return {
        iss: decoded.iss ?? ISS_FENAM,
        exp: typeof decoded.exp === "number" ? decoded.exp : 0,
        email,
        affiliationId: decoded.affiliationId ?? decoded.affiliation_id ?? "",
        memberNumber: decoded.memberNumber ?? decoded.member_number ?? "",
      };
    } catch (e) {
      if (e && typeof e === "object" && "code" in e) throw e;
      if (e instanceof Error) {
        if (e.name === "TokenExpiredError") throw errWithCode("Token expired", "JwtExpired");
        throw errWithCode(e.message, "JsonWebTokenError");
      }
      throw errWithCode("JWT verification failed", "JsonWebTokenError");
    }
  }
  if (parts.length !== 2) throw errWithCode("Invalid token format", "InvalidFormat");
  const [payloadB64, sigB64] = parts;
  let payload: FenamHandoffPayload;
  try {
    const payloadJson = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64url").toString("utf8");
    payload = JSON.parse(payloadJson) as FenamHandoffPayload;
  } catch {
    throw errWithCode("Invalid token format", "InvalidFormat");
  }
  if (payload.iss !== ISS_FENAM) throw errWithCode("Invalid iss", "InvalidIss");
  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp + CLOCK_TOLERANCE_SEC < nowSec) {
    throw errWithCode("Token expired", "TokenExpired");
  }
  const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  if (expectedSig.length !== sigB64.length || !timingSafeEqual(Buffer.from(expectedSig, "utf8"), Buffer.from(sigB64, "utf8"))) {
    throw errWithCode("Invalid signature", "InvalidSignature");
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
