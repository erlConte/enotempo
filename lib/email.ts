/**
 * Invio email tramite Resend.
 * Env: RESEND_API_KEY, RESEND_FROM
 * Se mancano: logga warning, ritorna { ok: false } senza lanciare (capture non deve fallire per email).
 */

export type SendReservationConfirmationParams = {
  to: string;
  eventTitle: string;
  eventDate: string;
  confirmationCode: string;
  notes?: string | null;
  locale?: string;
};

export async function sendReservationConfirmation(
  params: SendReservationConfirmationParams
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "test") {
      console.warn("[Resend] RESEND_API_KEY or RESEND_FROM not set; skipping confirmation email");
    }
    return { ok: false, error: "RESEND_API_KEY or RESEND_FROM not configured" };
  }

  const subject =
    params.locale === "en"
      ? `Booking confirmed – ${params.eventTitle}`
      : params.locale === "es"
        ? `Reserva confirmada – ${params.eventTitle}`
        : `Prenotazione confermata – ${params.eventTitle}`;

  const body = [
    `Ciao,`,
    ``,
    `La tua prenotazione per "${params.eventTitle}" è stata confermata.`,
    ``,
    `Data e ora: ${params.eventDate}`,
    `Codice di conferma: ${params.confirmationCode}`,
    ``,
    params.notes ? `Note/allergie: ${params.notes}` : null,
    params.notes ? `` : null,
    `Conserva questo codice per riferimento.`,
    ``,
    `A presto,`,
    `Enotempo`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject,
        text: body,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
