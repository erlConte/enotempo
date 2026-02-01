# Checklist E2E – ENOTEMPO (Next App Router)

Flusso: **Login FENAM → Prenotazione → Pagamento PayPal → Conferma + email**.

---

## URL di riferimento

**Base**: `https://[dominio]` (produzione) oppure `http://localhost:3000` (locale).

**Locale**: `it` (default), `en`, `es` — tutte le pagine sono sotto `/[locale]/`.

| Pagina | URL | Note |
|--------|-----|------|
| Lista cene | `/{locale}/cene` | Elenco eventi pubblicati con posti rimanenti |
| Dettaglio cena | `/{locale}/cene/{slug}` | Es. `/it/cene/tullpukuna-gen-2026` — qui compare BookingGate / form prenotazione |
| Accedi FENAM | `/{locale}/accedi-fenam` | Query: `returnUrl` (opzionale) — redirect dopo login |
| Pagamento | `/{locale}/paga/{reservationId}` | Solo sessione valida + ownership + status `pending_payment` |
| Conferma | `/{locale}/conferma/{reservationId}` | Mostra codice conferma solo se status `confirmed` |

**API**:

| Endpoint | Metodo | Scopo |
|----------|--------|--------|
| `/api/auth/fenam/handoff` | POST | Riceve token FENAM, verifica HMAC, setta cookie `fenamToken`, redirect |
| `/api/auth/me` | GET | Ritorna `{ hasIdentity, member? }` — member: id, email, firstName, lastName, phone |
| `/api/reservations` | POST | Crea prenotazione (sessione obbligatoria); idempotente per (evento, membro) |
| `/api/payments/paypal/create-order` | POST | Body: `{ reservationId }` — ownership + pending_payment; idempotente (ritorna orderId esistente) |
| `/api/payments/paypal/capture` | POST | Body: `{ reservationId, orderId }` — ownership, capture, conferma + email; idempotente se già confirmed |

---

## 1) Handoff FENAM e cookie

- [ ] **1.1** `POST /api/auth/fenam/handoff` con body `{ "token": "<token_valido>" }` (Content-Type: application/json)
  - Token formato: `base64url(payload).base64url(hmac)`, payload con `iss: "fenam"`, `exp` futuro, `email`, `affiliationId`/`memberNumber`.
  - **Atteso**: 303 redirect a `redirect` o `returnUrl` (query), oppure default `/it/cene`; cookie `fenamToken` impostato (httpOnly, SameSite=Lax, path=/).
- [ ] **1.2** `POST /api/auth/fenam/handoff` senza token o token invalido/scaduto
  - **Atteso**: 401 JSON `{ "error": "..." }`, nessun cookie impostato.
- [ ] **1.3** Handoff con `?redirect=/it/cene/tullpukuna` (o returnUrl)
  - **Atteso**: redirect a tale URL dopo set cookie.

---

## 2) Sessione e /api/auth/me

- [ ] **2.1** `GET /api/auth/me` senza cookie
  - **Atteso**: 200 `{ "hasIdentity": false }`.
- [ ] **2.2** `GET /api/auth/me` con cookie `fenamToken` valido (dopo handoff)
  - **Atteso**: 200 `{ "hasIdentity": true, "member": { "id", "email", "firstName", "lastName", "phone" } }` (phone può essere "").

---

## 3) BookingGate (guest vs authed)

- [ ] **3.1** **Guest** (nessun cookie): apri `/{locale}/cene/{slug}` (es. `/it/cene/tullpukuna-gen-2026`)
  - **Atteso**: solo CTA “Accedi / Iscriviti con FENAM” che porta a `/{locale}/accedi-fenam?returnUrl=...`; nessun form prenotazione.
- [ ] **3.2** **Authed** (cookie `fenamToken` valido): stessa pagina
  - **Atteso**: form prenotazione (nome, cognome, email, telefono, note, regole, consenso); pulsante “Prenota”.
- [ ] **3.3** `POST /api/reservations` senza cookie
  - **Atteso**: 401 `{ "error": "Per prenotare è necessario accedere con FENAM." }`.

---

## 4) Prenotazione: idempotenza e guests

- [ ] **4.1** Authed: invio form prenotazione (eventSlug, notes opzionale, rulesAccepted, dataConsent, firstName/lastName se richiesti)
  - **Atteso**: 200 `{ "success": true, "reservationId", "eventId" }`; reservation in DB con `status: "pending_payment"`, `guests: 1`.
- [ ] **4.2** Seconda POST identica (stesso evento, stesso membro) prima di pagare
  - **Atteso**: 200 stesso `reservationId` (idempotenza); nessun doppione.
- [ ] **4.3** Se esiste già prenotazione `confirmed` per (evento, membro)
  - **Atteso**: 409 `{ "error": "Sei già prenotato per questo evento." }`.
- [ ] **4.4** Evento senza posti (sold out: capacity = prenotazioni confirmed)
  - **Atteso**: 409 `{ "error": "Non ci sono abbastanza posti disponibili per questa prenotazione." }`.

---

## 5) Pagamento PayPal: create-order e capture

- [ ] **5.1** `POST /api/payments/paypal/create-order` senza sessione
  - **Atteso**: 401.
- [ ] **5.2** create-order con `reservationId` di un altro membro
  - **Atteso**: 404 “Prenotazione non trovata o non autorizzata”.
- [ ] **5.3** create-order con prenotazione già `confirmed`
  - **Atteso**: 400 “Questa prenotazione non è in attesa di pagamento.”.
- [ ] **5.4** create-order valido (sessione + ownership + pending_payment)
  - **Atteso**: 200 `{ "orderId": "..." }`; reservation aggiornata con `paypalOrderId`.
- [ ] **5.5** Seconda create-order stessa prenotazione (idempotenza)
  - **Atteso**: 200 stesso `orderId` senza creare un secondo ordine PayPal.
- [ ] **5.6** `POST /api/payments/paypal/capture` senza sessione
  - **Atteso**: 401.
- [ ] **5.7** **Mismatch orderId**: capture con `orderId` diverso da `reservation.paypalOrderId`
  - **Atteso**: 400 “L'ordine PayPal non corrisponde a questa prenotazione.”; prenotazione non modificata.
- [ ] **5.8** capture valido (sessione + ownership + pending_payment + orderId corretto)
  - **Atteso**: 200 `{ "ok": true, "confirmationCode": "TULL-XXXXXX" }`; reservation `status: "confirmed"`, `paypalCaptureId` e `confirmationCode` impostati; email di conferma inviata (se RESEND configurato).
- [ ] **5.9** **Retry capture**: seconda capture stessa prenotazione (già confirmed + paypalCaptureId)
  - **Atteso**: 200 `{ "ok": true, "confirmationCode": "..." }` (idempotente, nessuna doppia cattura, nessuna seconda chiamata PayPal).

---

## 6) Pagine paga e conferma (ownership e stati)

- [ ] **6.1** **Guest** apre `/{locale}/paga/{reservationId}`
  - **Atteso**: messaggio “Per completare il pagamento devi accedere con FENAM” + CTA accedi con returnUrl a paga.
- [ ] **6.2** **Authed** apre paga con reservationId di un altro utente
  - **Atteso**: 404 (notFound).
- [ ] **6.3** **Authed** apre paga con prenotazione già `confirmed`
  - **Atteso**: messaggio “Pagamento già completato” + link a conferma.
- [ ] **6.4** **Authed** apre paga con prenotazione `pending_payment`
  - **Atteso**: pagina “Completa il pagamento” con pulsante PayPal; dopo capture → redirect a conferma.
- [ ] **6.5** **Guest** apre `/{locale}/conferma/{reservationId}`
  - **Atteso**: messaggio “Per vedere la conferma devi accedere con FENAM” + CTA accedi.
- [ ] **6.6** **Authed** apre conferma con reservation altrua
  - **Atteso**: 404.
- [ ] **6.7** **Authed** apre conferma con prenotazione `pending_payment`
  - **Atteso**: “Pagamento non completato” + link “Vai al pagamento”.
- [ ] **6.8** **Authed** apre conferma con prenotazione `confirmed`
  - **Atteso**: “Prenotazione confermata”, codice conferma (TULL-XXXXXX), dettagli evento e note.

---

## 7) Sold out (post-prenotazione)

- [ ] **7.1** Capienza esaurita tra create prenotazione e capture: un altro utente conferma l’ultimo posto
  - **Atteso**: alla capture del primo utente: 409 “Non ci sono più posti disponibili per questo evento (sold out). Contatta il supporto per assistenza.”; prenotazione resta `pending_payment`.

---

## Tabella Expected result (riepilogo)

| Caso | Condizione | Expected result |
|------|------------|-----------------|
| **Guest** | Nessun cookie | Cena: solo CTA Accedi FENAM. POST /api/reservations → 401. /paga, /conferma → CTA login. |
| **Authed** | Cookie fenamToken valido | Cena: form prenotazione. POST /api/reservations → 200 + reservationId. /paga (pending) → PayPal. /conferma (pending) → “Vai al pagamento”. |
| **Pending_payment** | Stesso evento/membro già prenotato (non pagato) | POST /api/reservations → 200 stesso reservationId (idempotenza). |
| **Confirmed** | Stesso evento/membro già confermato | POST /api/reservations → 409 “Sei già prenotato”. /paga → “Già completato” + link conferma. /conferma → codice + note. |
| **Sold out** | Capacity esaurita (solo confirmed) | POST /api/reservations → 409. Capture dopo sold out → 409 “Contatta il supporto”. |
| **Retry capture** | Stessa prenotazione già confirmed + paypalCaptureId | POST capture → 200 ok + confirmationCode (idempotente). |
| **Mismatch orderId** | capture con orderId ≠ paypalOrderId | POST capture → 400 “L'ordine PayPal non corrisponde”. |
| **PayPal non configurato** | NEXT_PUBLIC_PAYPAL_CLIENT_ID assente | /paga (pending) → messaggio “Pagamento temporaneamente non disponibile. Contatta il supporto.” (no bottone PayPal). |

---

## Smoke test PayPal Sandbox (end-to-end)

1. **Env**: imposta `PAYPAL_MODE=sandbox`, `PAYPAL_CLIENT_ID` e `PAYPAL_SECRET` da [developer.paypal.com](https://developer.paypal.com) (App Sandbox), `NEXT_PUBLIC_PAYPAL_CLIENT_ID` uguale a `PAYPAL_CLIENT_ID`.
2. **Utente sandbox**: in PayPal Developer crea un account Sandbox “Personal” (buyer); usa quelle credenziali solo nel popup PayPal (non per login Enotempo).
3. **Flusso**: accedi con FENAM → prenota evento → vai a /paga/{reservationId} → clic “PayPal” → nel popup sandbox accedi con l’account Personal → completa pagamento (usa carta di test se richiesta).
4. **Atteso**: redirect a /conferma/{reservationId}, codice TULL-XXXXXX, email conferma (se RESEND configurato).
5. **Idempotenza**: dalla stessa pagina /paga, clic di nuovo PayPal → stesso orderId; dopo capture, ricaricare e rifare “PayPal” non deve creare un secondo ordine. Seconda chiamata capture (es. doppio clic) → 200 con stesso confirmationCode.

---

## Variabili d’ambiente minime per E2E

- `FENAM_HANDOFF_SECRET` (≥16 caratteri) — handoff e cookie di sessione
- `DATABASE_URL` — Prisma
- `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_MODE` — create-order/capture
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` — pulsante PayPal in frontend
- (Opzionale) `RESEND_API_KEY`, `RESEND_FROM` — email conferma
- (Opzionale) `DEBUG_AUTH=1` — log handoff non-PII (hasCookie, sessionValid, redirectHost)

---

*Checklist da eseguire prima del go-live; adattare `{slug}` e `{reservationId}` ai dati di test (es. seed DB).*
