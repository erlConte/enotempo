# Audit Enotempo – Codebase e patch P0

## 1. Stato attuale (architettura)

### Stack
- **Next.js** (App Router), **Vercel**-ready
- **Prisma** (PostgreSQL), **i18n** (next-intl, locale `it` / `en` / `es`)

### Pagine / Route (App Router)
| Path | Descrizione |
|------|-------------|
| `/[locale]` | Home (hero, come funziona, chi è Enotempo, donazioni, newsletter, popup prossima cena) |
| `/[locale]/about` | Chi siamo |
| `/[locale]/cene` | Lista eventi (cene) |
| `/[locale]/cene/[slug]` | Dettaglio evento + form prenotazione |
| `/[locale]/donazione/cena/[slug]` | Post-prenotazione: invito donazione volontaria |
| `/[locale]/donazione/fenam` | Donazione FENAM |
| `/[locale]/contact` | Contatti |
| `/[locale]/gallery` | Galleria |
| `/[locale]/privacy` | Privacy |
| `/[locale]/partners`, `/[locale]/partners/[slug]` | Partners |
| `/[locale]/chefs`, `/[locale]/chefs/[slug]` | Chef |
| `/[locale]/(fenam)/fenam`, `/[locale]/fenam/iscrizione` | FENAM / iscrizione |

### API Endpoints
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/reservations` | Crea prenotazione (evento da slug, check capienza in transazione, no overbooking) |
| POST | `/api/fenam/register` | Iscrizione membro FENAM |
| POST | `/api/fenam/check` | Verifica se email è membro FENAM |
| POST | `/api/contact` | Form contatti |

### DB (Prisma)
- **Schema**: `prisma/schema.prisma`
- **Migrazioni**: `prisma/migrations/` (iniziale `20251203160154_negro`, P0 `20260131000000_add_capacity_status`)
- **ORM**: Prisma Client (`lib/prisma.ts`)
- **Seed**: `prisma/seed.ts` – crea/aggiorna evento "Cena a Tullpukuna" (capacity 30, status published)

**Modelli dopo P0:**
- **FenamMember**: id, email, firstName, lastName, phone?, externalFenamId?, createdAt
- **Event**: id, slug, title, subtitle?, date, locationName, locationAddress?, description?, **capacity**, **status** (draft|published|cancelled), createdAt
- **Reservation**: id, eventId, fenamMemberId (customerRef), guests (seats), **status** (confirmed|cancelled), notes?, createdAt

### Email / Integrazioni
- Nessun invio email in codebase (nessun SendGrid/Mailgun/etc.).
- Form contatti e prenotazioni non inviano conferme via email (candidato P1).

---

## 2. Placeholder trovati (prima della patch P0)

| File | Linee / Descrizione |
|------|----------------------|
| `lib/mockEvents.ts` | **RIMOSSO** – Array hardcoded di eventi (getMockEvents, getEventBySlug, getNextUpcomingEvent), disponibilità posti fissa (es. 30), nessun legame con DB. |
| `app/api/reservations/route.ts` | 39–46: evento preso da `getEventBySlug` (mock); 64–84: upsert evento da mock invece di usare evento da DB; **nessun check capienza** → rischio overbooking. |
| `app/[locale]/cene/page.tsx` | 7, 18: `getMockEvents()` – lista eventi da mock. |
| `app/[locale]/cene/[slug]/page.tsx` | 9, 16, 31: `getMockEvents` / `getEventBySlug` – dettaglio da mock; `availableSeats` da mock. |
| `app/[locale]/donazione/cena/[slug]/page.tsx` | 5, 12, 27: `getMockEvents` / `getEventBySlug` – evento da mock. |
| `components/home/NextDinnerPopup.tsx` | 7, 19: `getNextUpcomingEvent()` da mock (sync, client-side). |
| `prisma/seed.ts` | Evento senza `capacity`/`status` (schema pre-P0); unico “evento” reale solo via upsert slug. |

Dati hardcoded / UI dummy:
- Lista e dettaglio cene: titolo, data, luogo, descrizione, “posti disponibili” e “sold out” derivavano da mock (non da DB).
- Nessun altro placeholder evidente in chefs/partners (dati da `lib/chefs.ts`, `lib/partners.ts` – non analizzati in dettaglio per P0).

---

## 3. Patch P0 implementata

### 3.1 Modello dati (minimo)
- **Event**: aggiunti `capacity` (Int), `status` (String, default `published`). Resto invariato (id, title, date come startAt, locationName/Address, createdAt).
- **Reservation**: aggiunto `status` (String, default `confirmed`). customerRef = `fenamMemberId`; seats = `guests`.

### 3.2 Migration
- `prisma/migrations/20260131000000_add_capacity_status/migration.sql`: ADD COLUMN `capacity` (default 30), `status` (default 'published') su Event; ADD COLUMN `status` (default 'confirmed') su Reservation.

### 3.3 Logica eventi da DB
- **`lib/events.ts`** (nuovo): `getEvents()`, `getEventBySlug(slug)`, `getNextUpcomingEvent()`. Tutti leggono da Prisma, calcolano i posti rimanenti (capacity − somma `guests` di reservation con status `confirmed`). Restituiscono tipo `EventWithRemaining` (include `remainingSeats`).

### 3.4 API prenotazione (no overbooking)
- **`app/api/reservations/route.ts`**:
  - Evento da **DB** tramite `getEventBySlug(data.eventSlug)`; 404 se assente.
  - In **transazione Prisma**: lettura evento + somma posti prenotati (solo `status = confirmed`); se `booked + participants > capacity` → risposta **409** con messaggio chiaro ("Non ci sono abbastanza posti disponibili per questa prenotazione.").
  - Creazione prenotazione con `status: "confirmed"` nella stessa transazione (evita race tra due richieste concorrenti).
- **Scelta**: conferma immediata (no hold con scadenza). Motivo: implementazione più semplice, meno stati (pending/hold), nessun job di cleanup; per eventi a posti limitati e bassa concorrenza è sufficiente.

### 3.5 UI
- **Lista cene** (`app/[locale]/cene/page.tsx`): dati da `await getEvents()`; badge e CTA usano `remainingSeats`; testo da `subtitle ?? description`.
- **Dettaglio evento** (`app/[locale]/cene/[slug]/page.tsx`): evento da `await getEventBySlug(slug)`; form prenotazione mostrato solo se `remainingSeats > 0`; `generateStaticParams` async da `getEvents()`.
- **Donazione cena** (`app/[locale]/donazione/cena/[slug]/page.tsx`): evento da `await getEventBySlug(slug)`; `generateStaticParams` da `getEvents()`.
- **Home + popup**: `getNextUpcomingEvent()` in server; risultato serializzato (title, slug, date ISO, locationName, locationAddress) e passato a `<NextDinnerPopup nextEvent={…} />` (client). Nessuna chiamata mock lato client.
- **ReservationForm**: in caso di **409** viene mostrato solo il messaggio API (es. "Non ci sono abbastanza posti disponibili...") senza prefisso "(409)"; altri errori con messaggio chiaro.

### 3.6 Seed
- **`prisma/seed.ts`**: upsert evento "Cena a Tullpukuna" con `capacity: 30`, `status: "published"` (primo evento reale funzionante).

### 3.7 Rimozione placeholder
- **Eliminato** `lib/mockEvents.ts`.
- Tutti i riferimenti a mockEvents sostituiti con `lib/events.ts` (pagine, API, NextDinnerPopup tramite prop da server).
- **README**: aggiornato per descrivere eventi da DB e prenotazioni con capienza.

---

## 4. TODO P1 (dopo P0)

- **Email**: conferma prenotazione / reminder (es. SendGrid o Resend) dopo POST `/api/reservations`.
- **GET /api/events**: endpoint opzionale per listare eventi (es. per client esterni o SSR alternativo); al momento la lista è solo server-side nelle pagine.
- **Event**: campi opzionali `price`, `chef`, `image` in DB se si vogliono mostrare in modo persistente (ora non in schema; UI già pronta con `event.price`/`event.chef`/`event.image` se presenti).
- **Hold con scadenza**: se in futuro servirà “prenota e paga entro N minuti”, introdurre stato `pending` su Reservation e job che cancella le pending scadute per liberare posti.
- **Admin**: backoffice per creare/modificare eventi e vedere prenotazioni (es. altro progetto o route protette).

---

## 5. Come verificare la patch P0

1. Applicare la migrazione (se non già applicata):  
   `npx prisma migrate deploy`  
   (o `npx prisma migrate dev` in sviluppo).
2. Eseguire il seed:  
   `npx prisma db seed`
3. Avviare l’app:  
   `npm run dev`
4. Controllare: lista cene con “Cena a Tullpukuna” e posti rimanenti; dettaglio con form prenotazione; dopo N prenotazioni (somma guests = 30) la prenotazione successiva deve restituire 409 e in UI il messaggio “Non ci sono abbastanza posti disponibili...”.
