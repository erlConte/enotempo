/**
 * Utility per sanitizzazione input per prevenire XSS
 */

/**
 * Rimuove tag HTML e caratteri pericolosi da una stringa (sanitizzazione XSS migliorata)
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    // Rimuove tag HTML e caratteri pericolosi
    .replace(/<[^>]*>/g, "") // Rimuove tutti i tag HTML
    .replace(/[<>]/g, "") // Rimuove < e > residui
    // Rimuove protocolli pericolosi
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/on\w+\s*=/gi, "") // Rimuove event handlers (onclick=, onerror=, ecc.)
    .replace(/&#x?[0-9a-f]+;/gi, "") // Rimuove entità HTML codificate
    // Rimuove caratteri di controllo
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
}

/**
 * Sanitizza un oggetto ricorsivamente
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeString(sanitized[key] as string) as T[Extract<keyof T, string>];
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeObject(sanitized[key] as Record<string, unknown>) as T[Extract<keyof T, string>];
    }
  }

  return sanitized;
}

/**
 * Sanitizza solo i campi testo di un oggetto (non modifica numeri, booleani, ecc.)
 */
export function sanitizeTextFields<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeString(sanitized[key] as string) as T[Extract<keyof T, string>];
    }
  }

  return sanitized;
}
