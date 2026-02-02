/**
 * Verifica token FeNAM (JWT HS256 o HMAC custom) e gestione sessione Enotempo (cookie httpOnly, sameSite Lax).
 * Nessun token in query, nessun cookie cross-domain.
 */

import { createHmac, createHash, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";

const ISS_FENAM = "fenam";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year
const CLOCK_TOLERANCE_SEC = 60;
const JWT_CLOCK_TOLERANCE_SEC = 300; // 5 min per login redirect

/** Nome del cookie di sessione Enotempo (httpOnly, sameSite Lax) */
export const FENAM_SESSION_COOKIE = "fenamToken";

export type FenamHandoffPayload = {
  affiliationId: string;
  memberNumber: string;
  /** Se presente e valida usata per lookup; se assente (token 2-part) si usa identificativo stabile come placeholder. */
  email: string | null;
  exp: number;
  iss: string;
  /** Identificativo stabile per lookup quando email manca: sub | memberNumber | affiliationId | id | jti. */
  stableId: string;
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
  | "JsonWebTokenError"
  | "MissingClaims"
  | "MissingExp";

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
    if (e.message.includes("Missing exp") || (e as Error & { code?: string }).code === "MissingExp") return "MissingExp";
    if (e.message.includes("expired") || e.name === "TokenExpiredError") return "JwtExpired";
    if (e.name === "JsonWebTokenError") return "JsonWebTokenError";
  }
  return "Unknown";
}

export type SafeJwtPeekResult = {
  alg: string | null;
  hasIss: boolean;
  issHash: string | null;
  expDeltaSec: number | null;
  tokenParts: number;
  tokenLen: number;
};

/** Decode JWT senza verificare; ritorna solo metadata safe (no token/PII). */
export function safeJwtPeek(token: string): SafeJwtPeekResult {
  const parts = token.split(".");
  const tokenParts = parts.length;
  const tokenLen = token.length;
  let alg: string | null = null;
  let hasIss = false;
  let issHash: string | null = null;
  let expDeltaSec: number | null = null;
  if (parts.length === 3) {
    try {
      const decoded = jwt.decode(token, { complete: true }) as { header?: { alg?: string }; payload?: { iss?: string; exp?: number } } | null;
      if (decoded?.header?.alg) alg = decoded.header.alg;
      if (decoded?.payload) {
        if (decoded.payload.iss != null && decoded.payload.iss !== "") {
          hasIss = true;
          issHash = createHash("sha256").update(String(decoded.payload.iss)).digest("hex").slice(0, 8);
        }
        const exp = decoded.payload.exp;
        if (typeof exp === "number") {
          const nowSec = Math.floor(Date.now() / 1000);
          const expSec = exp > 1e12 ? Math.floor(exp / 1000) : exp;
          expDeltaSec = expSec - nowSec;
        }
      }
    } catch {
      // ignore decode errors
    }
  }
  return { alg, hasIss, issHash, expDeltaSec, tokenParts, tokenLen };
}

function looksLikeEmail(s: string): boolean {
  return typeof s === "string" && s.includes("@") && s.length >= 5;
}

type JwtPayload = {
  iss?: string;
  exp?: number;
  email?: string;
  sub?: string;
  affiliationId?: string;
  memberNumber?: string;
  affiliation_id?: string;
  member_number?: string;
  fenamMemberId?: string;
  id?: string;
  user?: { email?: string };
  claims?: { email?: string };
};

function normalizeExpToSec(exp: unknown): number | null {
  if (typeof exp !== "number") return null;
  return exp > 1e12 ? Math.floor(exp / 1000) : exp;
}

/**
 * Verifica token FeNAM: JWT HS256 (3 parti, eyJ...) oppure HMAC custom (2 parti).
 * JWT: algorithms ['HS256'], clockTolerance 300s. ISS soft-check (log warning se diverso). Exp in sec o ms normalizzato.
 * HMAC custom: base64url(payload).base64url(hmac), exp con tolleranza 60s.
 */
export function verifyFenamToken(token: string): FenamHandoffPayload {
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length === 3) {
    let decoded: JwtPayload;
    try {
      const raw = jwt.decode(token) as JwtPayload | null;
      if (!raw || typeof raw !== "object") throw errWithCode("Invalid JWT payload", "InvalidFormat");
      decoded = raw;
      const nowSec = Math.floor(Date.now() / 1000);
      const expSec = normalizeExpToSec(decoded.exp);
      if (expSec == null) {
        throw errWithCode("Missing exp", "MissingExp");
      }
      if (expSec + JWT_CLOCK_TOLERANCE_SEC < nowSec) {
        throw errWithCode("Token expired", "JwtExpired");
      }
      jwt.verify(token, secret, {
        algorithms: ["HS256"],
        ignoreExpiration: true,
      });
    } catch (e) {
      if (e && typeof e === "object" && "code" in e) throw e;
      if (e instanceof Error) {
        if (e.name === "TokenExpiredError") throw errWithCode("Token expired", "JwtExpired");
        if (e.message.includes("expired")) throw errWithCode("Token expired", "JwtExpired");
        throw errWithCode(e.message, "JsonWebTokenError");
      }
      throw errWithCode("JWT verification failed", "JsonWebTokenError");
    }
    if (decoded.iss != null && decoded.iss !== ISS_FENAM) {
      const issHash = createHash("sha256").update(String(decoded.iss)).digest("hex").slice(0, 8);
      console.warn("[fenam] unexpected iss", { unexpectedIss: true, issHash });
    }
    const email =
      (typeof decoded.email === "string" && decoded.email.trim() ? decoded.email : null) ??
      (typeof decoded.sub === "string" && looksLikeEmail(decoded.sub) ? decoded.sub : null) ??
      (decoded.user && typeof decoded.user.email === "string" ? decoded.user.email : null) ??
      (decoded.claims && typeof decoded.claims.email === "string" ? decoded.claims.email : null);
    if (!email || !email.trim()) throw errWithCode("Missing email/sub", "MissingClaims");
    const affiliationId =
      decoded.affiliationId ??
      decoded.memberNumber ??
      decoded.member_number ??
      decoded.fenamMemberId ??
      decoded.id ??
      "";
    const memberNumber =
      typeof decoded.memberNumber === "string"
        ? decoded.memberNumber
        : typeof decoded.member_number === "string"
          ? decoded.member_number
          : typeof affiliationId === "string"
            ? affiliationId
            : "";
    const stableId = String(decoded.sub ?? affiliationId ?? memberNumber ?? decoded.id ?? "").trim();
    return {
      iss: decoded.iss ?? ISS_FENAM,
      exp: typeof decoded.exp === "number" ? decoded.exp : 0,
      email: email.trim(),
      affiliationId: String(affiliationId),
      memberNumber: String(memberNumber),
      stableId: stableId || String(affiliationId || memberNumber),
    };
  }
  if (parts.length !== 2) throw errWithCode("Invalid token format", "InvalidFormat");
  const [payloadB64, sigB64] = parts;
  type HmacRawPayload = {
    iss?: string;
    exp?: number;
    email?: string;
    sub?: string;
    memberNumber?: string;
    member_number?: string;
    affiliationId?: string;
    affiliation_id?: string;
    fenamMemberId?: string;
    id?: string;
    jti?: string;
  };
  let raw: HmacRawPayload;
  try {
    const payloadJson = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64url").toString("utf8");
    raw = JSON.parse(payloadJson) as HmacRawPayload;
  } catch {
    throw errWithCode("Invalid token format", "InvalidFormat");
  }
  if (raw.iss !== ISS_FENAM) {
    const issHash = createHash("sha256").update(String(raw.iss ?? "")).digest("hex").slice(0, 8);
    console.warn("[fenam] HMAC token unexpected iss", { unexpectedIss: true, issHash });
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = normalizeExpToSec(raw.exp);
  if (expSec != null && expSec + CLOCK_TOLERANCE_SEC < nowSec) {
    throw errWithCode("Token expired", "TokenExpired");
  }
  const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  if (expectedSig.length !== sigB64.length || !timingSafeEqual(Buffer.from(expectedSig, "utf8"), Buffer.from(sigB64, "utf8"))) {
    throw errWithCode("Invalid signature", "InvalidSignature");
  }
  const stableId = String(
    raw.sub ?? raw.memberNumber ?? raw.member_number ?? raw.affiliationId ?? raw.affiliation_id ?? raw.fenamMemberId ?? raw.id ?? raw.jti ?? ""
  ).trim();
  if (!stableId) {
    throw errWithCode("Missing stable identifier (sub/memberNumber/affiliationId/id/jti)", "MissingClaims");
  }
  const email =
    typeof raw.email === "string" && raw.email.trim() && looksLikeEmail(raw.email) ? raw.email.trim() : null;
  const affiliationId =
    raw.affiliationId ?? raw.affiliation_id ?? raw.memberNumber ?? raw.member_number ?? raw.fenamMemberId ?? raw.id ?? stableId;
  const memberNumber =
    typeof raw.memberNumber === "string"
      ? raw.memberNumber
      : typeof raw.member_number === "string"
        ? raw.member_number
        : affiliationId;
  return {
    iss: raw.iss ?? ISS_FENAM,
    exp: typeof raw.exp === "number" ? raw.exp : 0,
    email,
    affiliationId: String(affiliationId),
    memberNumber: String(memberNumber),
    stableId,
  };
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

/** Email placeholder usata quando il token FENAM non fornisce email (evita duplicati per externalFenamId). */
const PLACEHOLDER_EMAIL_SUFFIX = "@placeholder.enotempo";
const PLACEHOLDER_EMAIL_PREFIX = "fenam-";

/** Restituisce true se l'email è un placeholder generato (fenam-...@placeholder.enotempo). */
export function isPlaceholderEmail(email: string): boolean {
  if (typeof email !== "string" || !email) return false;
  return (
    email.endsWith(PLACEHOLDER_EMAIL_SUFFIX) &&
    email.startsWith(PLACEHOLDER_EMAIL_PREFIX) &&
    email.length > (PLACEHOLDER_EMAIL_PREFIX.length + PLACEHOLDER_EMAIL_SUFFIX.length)
  );
}

/** Genera email placeholder deterministica da stableId (stesso formato usato in callback/handoff). */
export function buildPlaceholderEmail(stableId: string): string {
  const safe = String(stableId).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 128);
  return `${PLACEHOLDER_EMAIL_PREFIX}${safe}${PLACEHOLDER_EMAIL_SUFFIX}`;
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
