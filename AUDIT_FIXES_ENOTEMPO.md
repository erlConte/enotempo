# Audit + Fixes ENOTEMPO – Riepilogo

**Stato**: `npm run lint` e `npm run build` OK.

---

## File modificati (solo ENOTEMPO)

| File | Modifica |
|------|----------|
| `.env.example` | Aggiunto commento opzionale `DEBUG_AUTH` |
| `app/api/auth/fenam/handoff/route.ts` | Micro-debug non-PII se `DEBUG_AUTH=1` (hasCookie, sessionValid, redirectHost) |
| `app/[locale]/paga/[reservationId]/page.tsx` | Messaggio user-friendly se PayPal non configurato (`NEXT_PUBLIC_PAYPAL_CLIENT_ID` assente) |
| `app/api/payments/paypal/capture/route.ts` | 409 sold out: aggiunto " Contatta il supporto per assistenza." |
| `E2E_CHECKLIST_ENOTEMPO.md` | Tabella Expected result, casi retry capture / mismatch orderId, smoke test PayPal Sandbox |

---

## Patch / snippet

### 1) .env.example
```diff
 # =============================================================================
 # OPZIONALI
 # =============================================================================
+# Debug auth: se 1, handoff logga (solo) hasCookie, sessionValid, redirectHost (no PII)
+# DEBUG_AUTH=0
 # Vercel Blob Storage (solo se usi upload immagini)
```

### 2) app/api/auth/fenam/handoff/route.ts
- Import: aggiunto `verifySessionToken`.
- Dopo `redirectTo`:
```ts
if (process.env.DEBUG_AUTH === "1") {
  const cookieStore = await cookies();
  const incomingCookie = cookieStore.get(FENAM_SESSION_COOKIE)?.value;
  const sessionValid = !!verifySessionToken(incomingCookie);
  const base = req.nextUrl.origin;
  const redirectUrl = redirectTo.startsWith("http") ? redirectTo : `${base}${redirectTo.startsWith("/") ? "" : "/"}${redirectTo}`;
  const redirectHost = (() => { try { return new URL(redirectUrl).host; } catch { return "(invalid)"; } })();
  console.warn("[DEBUG_AUTH] handoff", { hasCookie: !!incomingCookie, sessionValid, redirectHost });
}
```

### 3) app/[locale]/paga/[reservationId]/page.tsx
- Calcolo `paypalConfigured = !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
- In CardContent: se `!paypalConfigured` → box messaggio "Pagamento temporaneamente non disponibile. Contatta il supporto per completare la prenotazione."; altrimenti `<PayPalButtonWrapper ... />`.

### 4) app/api/payments/paypal/capture/route.ts
```diff
- { error: "Non ci sono più posti disponibili per questo evento (sold out)." },
+ { error: "Non ci sono più posti disponibili per questo evento (sold out). Contatta il supporto per assistenza." },
```

### 5) E2E_CHECKLIST_ENOTEMPO.md
- Sezione **Tabella Expected result**: aggiunta tabella con casi guest, authed, pending, confirmed, sold out, retry capture, mismatch orderId, PayPal non configurato.
- Casi **5.7** (mismatch orderId) e **5.9** (retry capture) esplicitati.
- Nuova sezione **Smoke test PayPal Sandbox (end-to-end)** con passi e attesi.
- Variabili env: aggiunto `DEBUG_AUTH=1` opzionale.

---

## Verifiche audit (nessun fix necessario)

- **ENV**: `.env.example` elenca già DATABASE_URL, FENAM_LOGIN_URL, FENAM_HANDOFF_SECRET, PAYPAL_*, RESEND_*.
- **lib/paypal.ts**: fallisce con throw lato server (no client); nessun PII nei log.
- **lib/email.ts**: ritorna `{ ok: false }` senza throw; warning senza email.
- **accedi-fenam**: costruisce `handoffUrl = ${origin}/api/auth/fenam/handoff?redirect=...`; handoff accetta POST form/JSON e `redirect` + `returnUrl`.
- **BookingGate**: guest solo CTA; POST /api/reservations senza cookie → 401; /paga e /conferma: no session o not owner → notFound() o CTA login.
- **reservationSchema**: eventSlug, notes, rulesAccepted, dataConsent, firstName/lastName opzionali; guests=1 fisso in create; idempotenza e 409 confirmed; capacity in transaction; Reservation mai creata "confirmed" senza pagamento.
- **create-order**: body solo { reservationId }; ownership e pending_payment; amount server-side; idempotenza se paypalOrderId presente; nessun log con orderId/email.
- **capture**: ownership; idempotent 200 se confirmed + paypalCaptureId; mismatch orderId → 400; transaction con capacity check; sold out → 409; email non blocca (log warn).
- **UI /paga e /conferma**: comportamenti già corretti (confirmed → link conferma; pending → PayPal; errori 401/409 gestiti; conferma con codice e note).

---

## Note go-live

- **PayPal**: in produzione impostare `PAYPAL_MODE=live` e credenziali Live; `NEXT_PUBLIC_PAYPAL_CLIENT_ID` deve coincidere con l’app Live.
- **FENAM**: verificare che `FENAM_LOGIN_URL` punti all’ambiente di produzione e che il handoff riceva il token con lo stesso `FENAM_HANDOFF_SECRET`.
- **DEBUG_AUTH**: lasciare disattivato in produzione; usare solo per debug handoff (log senza PII).
- **Resend**: se non configurato, la conferma prenotazione va a buon fine ma l’email non parte (log warn); accettabile per go-live con follow-up manuale.

---

*Repo pronto al commit.*
