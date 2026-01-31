/**
 * Rate limiting semplice in-memory per le API routes
 * Nota: Per produzione, considerare soluzioni più robuste come Upstash Redis
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Rate limiter semplice in-memory
 * @param identifier - Identificatore univoco (es. IP address)
 * @param maxRequests - Numero massimo di richieste
 * @param windowMs - Finestra temporale in millisecondi
 * @returns true se la richiesta è permessa, false se limitata
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minuto di default
): boolean {
  const now = Date.now();
  const record = store[identifier];

  // Se non esiste record o è scaduto, crea nuovo
  if (!record || now > record.resetTime) {
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return true;
  }

  // Se ha superato il limite
  if (record.count >= maxRequests) {
    return false;
  }

  // Incrementa contatore
  record.count++;
  return true;
}

/**
 * Ottiene l'IP address dalla richiesta
 */
export function getClientIp(req: Request): string {
  // Prova a ottenere l'IP da header X-Forwarded-For (Vercel, proxy)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Fallback a header X-Real-IP
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback generico
  return "unknown";
}

/**
 * Middleware per rate limiting
 */
export function withRateLimit(
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  return (req: Request): { allowed: boolean; retryAfter?: number } => {
    const ip = getClientIp(req);
    const allowed = rateLimit(ip, maxRequests, windowMs);

    if (!allowed) {
      const record = store[ip];
      const retryAfter = record ? Math.ceil((record.resetTime - Date.now()) / 1000) : 60;
      return { allowed: false, retryAfter };
    }

    return { allowed: true };
  };
}
