# Report: Deploy e hardening flusso prenotazione → pagamento → conferma

## STEP 1 — SSG/DB in build disinnescato (P0)

### File toccati

| File | Modifica |
|------|----------|
| `app/[locale]/cene/[slug]/page.tsx` | **Rimosso** `generateStaticParams` (che chiamava `getEvents()`) e import di `getEvents` / `locales`. La pagina legge dal DB solo a runtime. |
| `app/[locale]/cene/page.tsx` | **Aggiunto** `export const dynamic = "force-dynamic";` (oltre a `revalidate = 0`). La pagina chiama `getEvents()` solo a richiesta. |
| `app/[locale]/page.tsx` | **Aggiunto** `export const dynamic = "force-dynamic";` (oltre a `revalidate = 0`). La pagina chiama `getNextUpcomingEvent()` solo a richiesta. |

### Cosa è stato fatto

- **cene/[slug]**: eliminato `generateStaticParams` che in build eseguiva `getEvents()` e toccava il DB. La route è ora fully dynamic (`force-dynamic` già presente).
- **cene** e **home**: aggiunto `dynamic = "force-dynamic"` così Next non pre-renderizza queste pagine in build; i dati evento vengono letti dal DB solo a runtime.

### Verifica build

- `npm run build` completato con successo.
- Nessuna chiamata al DB in fase di build (nessun errore TLS/connection o "Failed to collect page data").
- Le pagine che usano `getEvents` / `getEventBySlug` / `getNextUpcomingEvent` sono tutte `force-dynamic`, quindi non vengono eseguite in build.

---

## STEP 2 — .env.example e ENV obbligatori

### File toccato

- `.env.example`: riscritto con sezione **REQUIRED ENV** in cima e variabili opzionali in fondo.

### Cosa settare su Vercel (Preview + Production)

| Gruppo | Variabile | Note |
|--------|-----------|------|
| **FENAM** | `FENAM_LOGIN_URL` | URL esterno login/iscrizione FENAM (redirect con returnUrl). |
| | `FENAM_HANDOFF_SECRET` | Segreto HMAC condiviso con FENAM; deve coincidere con quello usato da FENAM per firmare il token. |
| **DB** | `DATABASE_URL` | Connection string PostgreSQL (Supabase: usare pooler **Transaction**, porta 6543). |
| **PAYPAL** | `PAYPAL_MODE` | `sandbox` (test) o `live` (produzione). |
| | `PAYPAL_CLIENT_ID` | Client ID app PayPal (sandbox o live a seconda di `PAYPAL_MODE`). |
| | `PAYPAL_SECRET` | Secret app PayPal. |
| | `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | **Stesso valore** di `PAYPAL_CLIENT_ID` (usato dal bottone JS nel browser). Coerenza: stesso ambiente sandbox/live tra front e back. |
| **RESEND** | `RESEND_API_KEY` | API key Resend. |
| | `RESEND_FROM` | Indirizzo mittente (es. `onboarding@resend.dev` per test, oppure dominio verificato). |

- **Sandbox vs live**: in Preview si può usare `PAYPAL_MODE=sandbox` e credenziali sandbox; in Production usare `PAYPAL_MODE=live` e credenziali live.
- **Client ID**: `NEXT_PUBLIC_PAYPAL_CLIENT_ID` deve essere uguale a `PAYPAL_CLIENT_ID` (stesso ambiente).

---

## STEP 3 — Hardening capture PayPal (capienza + idempotenza)

### File toccato

- `app/api/payments/paypal/capture/route.ts`

### Modifiche

**A) Idempotenza capture (già presente, verificata)**  
- Se la reservation è già `confirmed` e ha `paypalCaptureId`, la route ritorna **200 OK** con `{ ok: true, confirmationCode }` senza chiamare di nuovo PayPal né aggiornare il DB.

**B) Ricontrollo capienza prima di confermare (P0 anti-overbooking)**  
- **Prima** di impostare `status: "confirmed"`, la logica è stata messa **dentro una transazione Prisma** che:
  1. Carica l’evento con le reservation `status: "confirmed"` e somma i `guests`.
  2. Verifica `capacity - booked >= 1` (posto disponibile per questa prenotazione).
  3. Se non c’è posto (`remaining < 1`), lancia errore con codice `SOLD_OUT` → la route risponde **409** con messaggio: *"Non ci sono più posti disponibili per questo evento (sold out)."* e **non** conferma la prenotazione.
  4. Se c’è posto, esegue `reservation.update` con `status: "confirmed"`, `paidAt`, `paypalCaptureId`, `confirmationCode`.
- In caso di `EVENT_NOT_FOUND` nella transazione → **404**.

---

## STEP 4 — First/Last name vuoti: campi editabili

### File toccati

- `components/events/ReservationForm.tsx`
- `lib/validation.ts`
- `app/api/reservations/route.ts`

### Comportamento

- **Condizione readOnly**:  
  - Se `member.firstName` è valorizzato (non vuoto dopo trim) → campo Nome è **readOnly/disabled** e mostra il valore dal profilo.  
  - Se `member.firstName` è vuoto → campo Nome è **editabile**; il valore è in `formData.firstName`.
- Stessa logica per **Cognome** (`member.lastName` / `formData.lastName`).
- Alla ricezione di `/api/auth/me`, il form inizializza `formData.firstName` e `formData.lastName` con i valori di `member` (anche vuoti).
- **Submit**: se il nome o il cognome sono editabili e lasciati vuoti, il form mostra errore ("Il nome è obbligatorio." / "Il cognome è obbligatorio.") e non invia. Se compilati, invia `firstName` e/o `lastName` nel body (solo quando valorizzati).
- **API**: lo schema di validazione accetta `firstName` e `lastName` **opzionali** (con `nameSchema` se presenti). Nella route reservations, se il body contiene `firstName` o `lastName`, vengono sanitizzati e usati per aggiornare `FenamMember` (solo i campi forniti) nella stessa transazione in cui si crea la prenotazione.

---

## STEP 5 — Protezioni paga/conferma (ownership)

### File verificati

- `app/[locale]/paga/[reservationId]/page.tsx`
- `app/[locale]/conferma/[reservationId]/page.tsx`

### Controlli

- **Sessione**: si usa `verifySessionToken(cookieValue)`; se assente o invalida si mostra CTA "Accedi / Iscriviti con FENAM" (senza esporre dati di altre prenotazioni).
- **Ownership**: dopo aver caricato la reservation da DB, si verifica  
  `reservation.fenamMemberId === session.fenamMemberId`.  
  Se **falso** → `notFound()` (404, nessun dettaglio sulla prenotazione).
- **Conferma**: non si mostrano mai dati di prenotazioni di altri utenti; in assenza di sessione o ownership si va in 404 o CTA login.

---

## STEP 6 — Smoke test (checklist manuale)

1. **Guest su evento** (`/[locale]/cene/[slug]`) → viene mostrata solo la CTA "Accedi / Iscriviti con FENAM", non il form di prenotazione.
2. **Login FENAM** (handoff) → cookie impostato; sulla pagina evento si vede il form prenotazione con prefilled (nome/cognome/email se presenti; nome/cognome editabili se vuoti).
3. **Submit prenotazione** → risposta 200 con `reservationId`; redirect a **`/[locale]/paga/[reservationId]`**.
4. **PayPal create-order** → bottone PayPal funziona; chiamata a `/api/payments/paypal/create-order` ritorna `orderId`.
5. **PayPal capture** → dopo approvazione nel popup PayPal, chiamata a `/api/payments/paypal/capture` ritorna `ok: true` e `confirmationCode`.
6. **Redirect conferma** → redirect a **`/[locale]/conferma/[reservationId]`**; pagina mostra codice conferma, riepilogo evento, contatti, note.
7. **Email** → arrivo email di conferma (Resend) con codice e dettagli evento.
8. **Secondo submit stesso evento** (stesso utente) → idempotenza: se esiste già prenotazione **confirmed** → **409** "Sei già prenotato"; se esiste **pending_payment** → **200** con lo stesso `reservationId` (nessun doppione).

---

## STEP 7 — Altre pagine e DB in build

- Nessun’altra pagina in `app/` oltre a quelle già trattate (cene, cene/[slug], home) chiama `getEvents` / `getEventBySlug` / `getEventById` / `getNextUpcomingEvent` in modo eseguito in build.
- Le pagine **paga** e **conferma** usano `prisma` ma hanno già `force-dynamic` e vengono renderizzate solo a richiesta.
- **Donazione** (`donazione/cena/[slug]`) fa solo redirect, nessuna query DB.

---

## OUTPUT FINALE

### Lista file modificati

| File | Tipo modifica |
|------|----------------|
| `app/[locale]/cene/[slug]/page.tsx` | Rimosso `generateStaticParams` e import non usati |
| `app/[locale]/cene/page.tsx` | Aggiunto `dynamic = "force-dynamic"` |
| `app/[locale]/page.tsx` | Aggiunto `dynamic = "force-dynamic"` |
| `.env.example` | Riscritto con REQUIRED ENV in cima |
| `app/api/payments/paypal/capture/route.ts` | Transazione con ricontrollo capienza; 409 sold out |
| `lib/validation.ts` | Aggiunti `firstName`, `lastName` opzionali allo schema prenotazione |
| `app/api/reservations/route.ts` | Aggiornamento FenamMember con firstName/lastName se inviati |
| `components/events/ReservationForm.tsx` | Nome/cognome editabili quando vuoti; prefilled; invio opzionale firstName/lastName |
| `REPORT_DEPLOY_E_HARDENING.md` | Questo report |

### Patch / snippet principali

- **Capture – transazione capienza** (in `capture/route.ts`): prima di `reservation.update` a `confirmed`, in `prisma.$transaction` si fa `event.findUnique` con `reservations` confirmed, si calcola `booked` e `remaining = capacity - booked`; se `remaining < 1` si lancia `SOLD_OUT` → 409.
- **Form – readOnly condizionale** (in `ReservationForm.tsx`):  
  `readOnly={!!(member?.firstName ?? "").trim()}` e `value` da `member` se valorizzato, altrimenti da `formData.firstName`; stesso schema per lastName.  
  Submit: si inviano `firstName`/`lastName` solo se il campo è editabile e valorizzato.

### ENV da settare su Vercel (Preview / Production)

- **FENAM**: `FENAM_LOGIN_URL`, `FENAM_HANDOFF_SECRET`
- **DB**: `DATABASE_URL`
- **PAYPAL**: `PAYPAL_MODE`, `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (stesso valore di `PAYPAL_CLIENT_ID`, stesso ambiente)
- **RESEND**: `RESEND_API_KEY`, `RESEND_FROM`

### Checklist smoke test

- [ ] Guest su evento → CTA login
- [ ] Login FENAM → form prefill (nome/cognome editabili se vuoti)
- [ ] Submit → redirect /paga/:id
- [ ] PayPal create-order → ok
- [ ] PayPal capture → ok
- [ ] Redirect /conferma/:id con confirmationCode
- [ ] Email ricevuta (Resend)
- [ ] Secondo submit stesso evento → idempotenza (409 o riuso pending)

### Rischio residuo e go-live

- **Rischio**: se in futuro si reintroduce `generateStaticParams` (o altre API che leggono dal DB) su route che usano `getEvents` / `getEventBySlug` / simili senza `force-dynamic`, la build potrebbe di nuovo contattare il DB e fallire in ambienti senza DB o con TLS strict.
- **Workaround go-live**: (1) non usare `generateStaticParams` per route che dipendono dal DB; (2) mantenere `export const dynamic = "force-dynamic"` su tutte le pagine che chiamano `getEvents`, `getEventBySlug`, `getEventById`, `getNextUpcomingEvent`; (3) in Vercel, se necessario, usare build senza "Collecting page data" per quelle route (o lasciare le pagine dynamic come ora).
