# Report: Progetto Enotempo pronto al commit

Pulizia, hardening e coerenza senza cambiare il flusso funzionale (prenota → paga → conferma + email).

---

## 1) ROUTES & URL COERENTI (P0)

- **Verifica**: Nessun riferimento a `/api/fenam/handoff` (path errato) nel codebase. Tutti i riferimenti usano il path reale `/api/auth/fenam/handoff`.
- **accedi-fenam**: La pagina costruisce correttamente `handoffUrl = ${origin}/api/auth/fenam/handoff?redirect=${encodeURIComponent(returnUrl)}`. Il client passa a FENAM `returnUrl` = questo handoff URL (FENAM reindirizza l’utente qui dopo il login).
- **Coerenza query param**: Handoff route accetta sia `redirect` che `returnUrl` per robustezza:
  - `redirectTo = searchParams.get("redirect") || searchParams.get("returnUrl") || "/it/cene"`

**File modificato**: `app/api/auth/fenam/handoff/route.ts`

```diff
- const redirectTo = searchParams.get("redirect") || "/it/cene";
+ const redirectTo = searchParams.get("redirect") || searchParams.get("returnUrl") || "/it/cene";
```

---

## 2) ENV GUARD-RAILS (P0)

### lib/paypal.ts
- Se mancano `PAYPAL_MODE` / `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET`: errore esplicito (senza PII).
- Se manca `NEXT_PUBLIC_PAYPAL_CLIENT_ID`: solo `console.warn` (frontend button può fallire).
- `getPayPalBaseUrl()`: se MODE non valido, warning e fallback a sandbox.

### lib/email.ts
- Se mancano `RESEND_API_KEY` o `RESEND_FROM`: `console.warn` + ritorno `{ ok: false, error: "..." }` senza lanciare. Il capture non fallisce per email.

### lib/fenam-handoff.ts
- `FENAM_HANDOFF_SECRET` mancante: messaggio "FENAM_HANDOFF_SECRET is required (missing)".
- Lunghezza < 16: messaggio "FENAM_HANDOFF_SECRET must be at least 16 characters".

**File modificati**: `lib/paypal.ts`, `lib/email.ts`, `lib/fenam-handoff.ts`

---

## 3) PAYPAL HARDENING (P1)

- **Idempotenza capture**: Se `reservation.status === "confirmed"` e `reservation.paypalCaptureId` → ritorno 200 OK senza rifare capture. Già presente, confermato.
- **orderId vs paypalOrderId**: Se la reservation ha già `paypalOrderId` e il client invia un `orderId` diverso → 400 "L'ordine PayPal non corrisponde a questa prenotazione." + log (senza PII: solo `reservationId`).
- **Amount**: Create-order **non** accetta amount dal client; body solo `{ reservationId }`. L’importo è calcolato server-side da `event.priceCents` o fallback 75€.
- **Ownership e status**: Create-order e capture verificano sessione, ownership (`fenamMemberId`), e create-order richiede `status === "pending_payment"`.

**File modificato**: `app/api/payments/paypal/capture/route.ts`

```diff
+ if (reservation.paypalOrderId && reservation.paypalOrderId !== orderId) {
+   logger.warn("Capture orderId mismatch for reservation", { reservationId });
+   return NextResponse.json(
+     { error: "L'ordine PayPal non corrisponde a questa prenotazione." },
+     { status: 400 }
+   );
+ }
```

---

## 4) RESERVATIONS HARDENING (P1)

- **Idempotenza**: Se esiste già prenotazione `pending_payment` per (evento, membro) → ritorno 200 con lo stesso `reservationId` (nessun doppione). Verificato.
- **guests**: Sempre 1; nessun campo `participants` in UI né in `reservationSchema`. Verificato.
- **notes**: Sanitizzazione con `sanitizeTextFields` prima del salvataggio. Verificato.
- **firstName/lastName**: Opzionali nello schema; accettati solo per aggiornare FenamMember quando i campi sono vuoti (form li rende editabili). Validazione coerente con `nameSchema` quando presenti.

**Nessuna modifica** (comportamento già corretto).

---

## 5) BUILD / NEXT (P0)

- Nessuna pagina che usa `getEvents` / `getEventBySlug` / `getNextUpcomingEvent` ha `generateStaticParams` che legge dal DB.
- `cene/[slug]`: `generateStaticParams` rimosso in precedenza; `force-dynamic` presente.
- `cene`, home: `force-dynamic` presenti.
- `partners/[slug]`, `chefs/[slug]`, `layout`: `generateStaticParams` usano solo dati statici (locales, slug da config), non DB.

**Nessuna modifica** in questo step.

---

## 6) CODE CLEANUP (P2)

- **Log senza PII**: Rimossi email e nome dai log di contact; rimosso `fenamMemberId` dal log "Reservation attempt" (resta solo `eventSlug`).
- **lib/paypal.ts**: Rimossa costante inutilizzata `PAYPAL_API_BASE` dopo introduzione di `getPayPalBaseUrl()`.

**File modificati**: `app/api/reservations/route.ts`, `app/api/contact/route.ts`, `lib/paypal.ts`

---

## 7) LINT / TYPECHECK / FORMAT

- `npm run lint`: **OK** (no ESLint warnings or errors).
- `npm run build`: **OK** (compilazione e generazione pagine completate).

Nessun warning da documentare; nessuna modifica richiesta.

---

## 8) OUTPUT FINALE

### Lista file modificati

| File | Modifica |
|------|----------|
| `app/api/auth/fenam/handoff/route.ts` | Redirect: accetta anche query `returnUrl` oltre a `redirect` |
| `lib/paypal.ts` | Guard-rails ENV (PAYPAL_MODE, CLIENT_ID, SECRET, NEXT_PUBLIC); warning; rimossa costante inutilizzata |
| `lib/email.ts` | Se RESEND non configurato: warning + return { ok: false } senza throw |
| `lib/fenam-handoff.ts` | Messaggi di errore espliciti per secret mancante/corto |
| `app/api/payments/paypal/capture/route.ts` | Controllo orderId vs paypalOrderId; 400 + log senza PII |
| `app/api/reservations/route.ts` | Log "Reservation attempt" senza fenamMemberId |
| `app/api/contact/route.ts` | Log contact senza email/nome |
| `REPORT_PRONTO_AL_COMMIT.md` | Questo report |

### Snippet principali

**Handoff URL (coerenza redirect/returnUrl)**  
`app/api/auth/fenam/handoff/route.ts`:  
`const redirectTo = searchParams.get("redirect") || searchParams.get("returnUrl") || "/it/cene";`

**Guard-rails PayPal**  
`lib/paypal.ts`: `getCredentials()` lancia se PAYPAL_MODE/CLIENT_ID/SECRET mancanti; `console.warn` se manca NEXT_PUBLIC_PAYPAL_CLIENT_ID.

**Guard-rails Resend**  
`lib/email.ts`: Se mancano RESEND_API_KEY o RESEND_FROM → `console.warn` + `return { ok: false, error: "..." }`.

**Capture idempotenza + orderId**  
`app/api/payments/paypal/capture/route.ts`:  
- Già confirmed + paypalCaptureId → 200 OK.  
- Se paypalOrderId presente e orderId !== paypalOrderId → 400 + logger.warn(reservationId).

**Reservation schema (nessun participants)**  
`lib/validation.ts`: `reservationSchema` con `eventSlug`, `notes`, `firstName`/`lastName` opzionali, `rulesAccepted`, `dataConsent`. Nessun `participants`.

---

### Checklist “pronto al commit”

| # | Voce | Stato |
|---|------|--------|
| 1 | Nessun riferimento a /api/fenam/handoff (solo /api/auth/fenam/handoff) | OK |
| 2 | accedi-fenam costruisce returnUrl/handoff correttamente | OK |
| 3 | Handoff accetta redirect e returnUrl | OK |
| 4 | PayPal: guard-rails ENV (MODE, CLIENT_ID, SECRET, NEXT_PUBLIC) | OK |
| 5 | Resend: mancanza config non fa crashare capture | OK |
| 6 | FENAM_HANDOFF_SECRET: errore chiaro se mancante/corto | OK |
| 7 | Capture idempotente (confirmed + captureId → 200) | OK |
| 8 | Capture: orderId diverso da paypalOrderId → 400 | OK |
| 9 | Amount solo server-side (create-order) | OK |
| 10 | Reservations: idempotenza pending_payment, guests=1, no participants | OK |
| 11 | Nessuna pagina DB in build (force-dynamic / no generateStaticParams su eventi) | OK |
| 12 | Log senza PII (no email/nome in chiaro; no orderId in log) | OK |
| 13 | `npm run lint` | OK |
| 14 | `npm run build` | OK |

---

### ENV da settare su Vercel (Preview / Prod)

**Da impostare in Vercel (Environment Variables):**

- **FENAM**: `FENAM_LOGIN_URL`, `FENAM_HANDOFF_SECRET`
- **DB**: `DATABASE_URL`
- **PayPal**: `PAYPAL_MODE` (sandbox | live), `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (stesso valore di `PAYPAL_CLIENT_ID` per l’ambiente usato)
- **Resend**: `RESEND_API_KEY`, `RESEND_FROM`

**Valori che NON devono mai essere committati (né in .env né in repo):**

- `FENAM_HANDOFF_SECRET`
- `DATABASE_URL` (credenziali DB)
- `PAYPAL_SECRET`
- `PAYPAL_CLIENT_ID` e `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (pubblici ma da configurare per ambiente)
- `RESEND_API_KEY`

Usare solo `.env.example` (senza valori sensibili) e variabili d’ambiente Vercel/local.
