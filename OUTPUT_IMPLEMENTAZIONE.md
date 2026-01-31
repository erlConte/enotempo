# Output implementazione – modifiche Enotempo

## 1. Elenco file rimossi / creati / modificati

### File rimossi
- `app/[locale]/auth/fenam/ritorno/page.tsx` – callback con token in query (sostituito da POST handoff)

### File creati
- `lib/fenam-handoff.ts` – verifica token HMAC FeNAM, creazione/verifica sessione Enotempo (cookie)
- `app/api/auth/fenam/handoff/route.ts` – POST handoff: riceve token nel body, verifica HMAC, crea sessione, redirect 303

### File modificati
- `.env.example` – aggiunto `FENAM_HANDOFF_SECRET`, aggiornata documentazione (nessun token in query)
- `app/[locale]/accedi-fenam/page.tsx` – callbackUrl punta a handoff API (`/api/auth/fenam/handoff?redirect=...`)
- `app/api/auth/me/route.ts` – verifica sessione con `verifySessionToken` (cookie firmato)
- `app/api/reservations/route.ts` – hard gate: sessione FeNAM obbligatoria (401 "Per prenotare è necessario accedere con FENAM."), `fenamMemberId` da sessione, email body deve coincidere con sessione
- `app/[locale]/cene/[slug]/page.tsx` – `hasIdentity` tramite `hasValidSession` (stesso cookie)
- `app/[locale]/regole/page.tsx` – aggiunta sezione "Posti limitati"
- `app/[locale]/cene/[slug]/page.tsx` – sezione Regole: aggiunto punto "Posti limitati"
- `messages/it.json`, `messages/en.json`, `messages/es.json` – regole: `limitedSeatsTitle`, `limitedSeats`; home: step1/donationBox/donation.dinner senza FENAM interno; formazione: intro "Spiegazione progetto", pillole "Pillole del mestiere"; home `formatText` (degustazione fissa/itinerante)
- `app/[locale]/page.tsx` – testo editoriale `formatText` in "Cosa facciamo"
- `prisma/seed.ts` – evento reale: slug `cena-tullpukuna-15-febbraio-2026`, titolo "Cena a Tullpukuna", data 15 feb 2026, location "Tullpukuna", capienza 40, descrizione con 80€ e menu 5 portate (4 salate + 1 dolce)

---

## 2. Configurazione variabili d’ambiente

- **FENAM_LOGIN_URL**  
  - Dove: `.env` e `.env.example`  
  - Uso: URL esterno FeNAM per login/iscrizione. La pagina `/[locale]/accedi-fenam` reindirizza qui con `returnUrl` = URL handoff Enotempo (POST `/api/auth/fenam/handoff?redirect=...`). Nessun token in query.

- **FENAM_HANDOFF_SECRET**  
  - Dove: `.env` e `.env.example`  
  - Uso: segreto condiviso con FeNAM per (1) verificare la firma HMAC del token inviato nel body della POST handoff, (2) firmare la sessione Enotempo (cookie). Deve coincidere con il valore usato da FeNAM per firmare il payload (`affiliationId`, `memberNumber`, `email`, `exp`, `iss`).

---

## 3. Conferme richieste

- **Senza sessione FeNAM non si può prenotare**  
  - **UI:** in `cene/[slug]` se `hasValidSession` è false non viene mostrato il form ma la card con CTA "Accedi / Iscriviti con FENAM" → `/[locale]/accedi-fenam?returnUrl=...`.  
  - **API:** `POST /api/reservations` verifica la sessione (cookie firmato con `verifySessionToken`); se assente risponde **401** con messaggio "Per prenotare è necessario accedere con FENAM.".

- **Le regole compaiono in tutti i punti richiesti**  
  - **A)** Pagina dedicata: `/[locale]/regole` – puntualità, allergie/intolleranze, cibo e bevande extra a parte, posti limitati.  
  - **B)** Pagina evento: sezione "Regole e dichiarazioni" (riassunto) con link "Leggi il testo completo" → `/regole`.  
  - **C)** Form prenotazione: checkbox obbligatoria "Ho letto e accetto le Regole e dichiarazioni" con link a `/regole`; senza check submit disabilitato + errore i18n.

- **Handoff FeNAM → Enotempo**  
  - FeNAM invia HTML autosubmit POST a `POST /api/auth/fenam/handoff` (body: token HMAC, redirect in query).  
  - Enotempo verifica firma HMAC (`FENAM_HANDOFF_SECRET`), `exp`, `iss === "fenam"`; estrae `affiliationId`, `memberNumber`, `email`; crea/aggiorna FenamMember; crea sessione (cookie httpOnly, sameSite Lax); redirect 303 alla pagina di ritorno.  
  - Vietato: token in query, cookie cross-domain, lettura token lato client.

---

## 4. Stato finale

- Enotempo pulito (nessun FENAM interno: nessuna pagina/API iscrizione/registro FENAM; link/step solo redirect esterno).
- Prenotazione blindata dietro SSO FeNAM (gate UI + 401 API).
- Evento reale "Cena a Tullpukuna" (15 feb 2026, Tullpukuna, 40 posti, 80€, menu 5 portate) con slug `cena-tullpukuna-15-febbraio-2026`.
- Regole e dichiarazioni: pagina `/regole`, sezione in pagina evento, checkbox obbligatoria nel form.
- Formazione: voce menu + pagina `/[locale]/formazione` con spiegazione progetto e placeholder "Pillole del mestiere".
- Comunicazione format: testo editoriale in Home ("Cosa facciamo"): degustazione fissa al mese da Tullpukuna, degustazione itinerante in città.
