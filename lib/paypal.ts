/**
 * PayPal REST API: OAuth2 + Create Order + Capture.
 * Env: PAYPAL_MODE (sandbox|live), PAYPAL_CLIENT_ID, PAYPAL_SECRET, NEXT_PUBLIC_PAYPAL_CLIENT_ID (frontend).
 */

export type PayPalConfigStatus = {
  configured: boolean;
  missing: string[];
};

/** Verifica env PayPal senza lanciare. Ritorna { configured, missing } (solo nomi env, mai valori). */
export function getPayPalConfigStatus(): PayPalConfigStatus {
  const missing: string[] = [];
  const mode = process.env.PAYPAL_MODE;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const publicClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!mode || (mode !== "sandbox" && mode !== "live")) missing.push("PAYPAL_MODE");
  if (!clientId || typeof clientId !== "string" || !clientId.trim()) missing.push("PAYPAL_CLIENT_ID");
  if (!secret || typeof secret !== "string" || !secret.trim()) missing.push("PAYPAL_SECRET");
  if (!publicClientId || typeof publicClientId !== "string" || !publicClientId.trim()) {
    missing.push("NEXT_PUBLIC_PAYPAL_CLIENT_ID");
  }
  if (clientId && publicClientId && clientId.trim() !== publicClientId.trim()) {
    missing.push("PAYPAL_CLIENT_ID/NEXT_PUBLIC_PAYPAL_CLIENT_ID (incoerenti)");
  }
  return {
    configured: missing.length === 0,
    missing,
  };
}

function getPayPalBaseUrl(): string {
  const mode = process.env.PAYPAL_MODE;
  if (!mode || (mode !== "sandbox" && mode !== "live")) {
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "test") {
      console.warn("[PayPal] PAYPAL_MODE missing or invalid; use sandbox|live");
    }
    return "https://api-m.sandbox.paypal.com";
  }
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

let cachedToken: { access_token: string; expires_at: number } | null = null;

function getCredentials(): { clientId: string; secret: string } {
  const status = getPayPalConfigStatus();
  if (!status.configured) {
    throw new Error(`PayPal: env mancanti o incoerenti: ${status.missing.join(", ")}`);
  }
  const mode = process.env.PAYPAL_MODE;
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_SECRET!;
  return { clientId, secret };
}

/**
 * Ottiene un access token OAuth2 (cached). Lancia se env PayPal mancanti.
 */
export async function getPayPalAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken.access_token;
  }
  let credentials: { clientId: string; secret: string };
  try {
    credentials = getCredentials();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "PayPal configuration error";
    throw new Error(msg);
  }
  const { clientId, secret } = credentials;
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const base = getPayPalBaseUrl();
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal OAuth failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.access_token;
}

export type CreateOrderParams = {
  amount: string; // "75.00"
  currency?: string; // default EUR
};

/**
 * Crea un ordine PayPal (intent CAPTURE). Ritorna l'orderId.
 */
export async function createOrder(params: CreateOrderParams): Promise<string> {
  const token = await getPayPalAccessToken();
  const base = getPayPalBaseUrl();
  const currency = params.currency ?? "EUR";
  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: params.amount,
          },
        },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal create order failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

export type CaptureResult = {
  captureId: string;
  status: string;
};

/**
 * Cattura un ordine già approvato dal payer. Idempotente: se già catturato ritorna 200 con i dati.
 */
export async function captureOrder(orderId: string): Promise<CaptureResult> {
  const token = await getPayPalAccessToken();
  const base = getPayPalBaseUrl();
  const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal capture failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    status: string;
    purchase_units?: Array<{
      payments?: { captures?: Array<{ id: string; status: string }> };
    }>;
  };
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  const captureId = capture?.id ?? "";
  const status = capture?.status ?? data.status ?? "";
  return { captureId, status };
}
