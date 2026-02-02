# Workflow Database (Supabase)

**Regola:** lo schema DB si aggiorna via **Supabase** (Dashboard / SQL Editor). In repo **non** si eseguono `prisma migrate` né `prisma db seed` in locale (connessione TLS da locale può fallire). Il repo resta coerente con il DB reale facendo **pull** dello schema.

## Schema changes via Supabase SQL Editor

- Le modifiche allo schema (nuove colonne, indici, tabelle) si applicano **direttamente su Supabase** tramite SQL Editor.
- **Non** usare `prisma migrate dev` in locale per applicare migrazioni.

## Versioniamo i SQL in `supabase/migrations/`

- Ogni modifica al DB va scritta in un file SQL datato, es. `supabase/migrations/2026-02-02_add_event_fields.sql`.
- Contenuto consigliato: `BEGIN; ... COMMIT;`, uso di `IF EXISTS` / `IF NOT EXISTS` dove sensato, note di rollback in commento se possibile.
- I file in `supabase/migrations/` sono la **trail versionata** delle modifiche (applicate manualmente su Supabase).

## Ogni volta che cambia il DB: `prisma db pull` + commit di `schema.prisma`

1. Dopo aver applicato una migration SQL su Supabase, da un ambiente che riesce a connettersi al DB (es. Vercel, o una macchina senza problemi TLS):
   ```bash
   npx prisma db pull
   ```
2. Verifica `prisma/schema.prisma`: modelli e campi coerenti con il codice.
3. Commit di `prisma/schema.prisma` (e eventuali adattamenti minimi nel codice, solo typing/naming).

Così il repo resta allineato allo stato reale di Supabase.

## Come applicare una migration SQL su Supabase

1. Apri il progetto su [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Copia il contenuto del file da `supabase/migrations/YYYY-MM-DD_descrizione.sql`.
3. Incolla ed esegui. Controlla che non ci siano errori.
4. Esegui `npx prisma db pull` (da ambiente connesso) e committa `schema.prisma`.

## Come aggiornare `schema.prisma` (db pull)

- Da ambiente con connessione DB funzionante (es. CI, Vercel, o macchina senza TLS rotto):
  ```bash
  npm run db:pull
  # oppure
  npx prisma db pull
  ```
- Controlla le differenze in `prisma/schema.prisma` e adatta il codice se serve (solo typing/naming).
- Commit di `schema.prisma`.

## Come inserire l’evento (seed SQL)

- **Non** usare `npm run db:seed` in locale se la connessione fallisce (TLS).
- Usa il file **`supabase/seed-events.sql`**: contiene UPSERT idempotente per l’evento Cena Tullpukuna.
- In Supabase: **SQL Editor** → apri/incolla il contenuto di `supabase/seed-events.sql` → Esegui.
- L’UPSERT è idempotente: puoi eseguirlo più volte senza duplicati (ON CONFLICT slug DO UPDATE).

## Riepilogo comandi

| Azione | Comando / Azione |
|--------|------------------|
| Generare client Prisma (postinstall / dopo pull) | `npm run prisma:generate` |
| Allineare schema al DB reale | `npm run db:pull` (da ambiente connesso) |
| Applicare migration | Supabase SQL Editor → incolla file da `supabase/migrations/` |
| Popolare evento Cena Tullpukuna | Supabase SQL Editor → incolla `supabase/seed-events.sql` |
| Migrate/seed in locale | **Non usare** (schema e dati via Supabase + SQL) |

## Vincoli

- **NON** cambiare `DATABASE_URL` per workaround TLS.
- **NON** introdurre workaround TLS insicuri nel codice.
- Nessun segreto/PII nei log.
