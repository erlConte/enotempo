# Migrations SQL (Supabase)

Le modifiche allo schema si applicano **manualmente** su Supabase (Dashboard → SQL Editor). I file qui sono la **trail versionata** per il repo.

## Convenzione

- Nome file: `YYYY-MM-DD_descrizione_breve.sql`
- Contenuto: `BEGIN; ... COMMIT;`, uso di `IF EXISTS` / `IF NOT EXISTS` dove sensato, commento di rollback se possibile.

## Stato attuale

Lo schema iniziale e le modifiche successive sono già in `prisma/migrations/` (Prisma). Per **nuove** modifiche al DB:

1. Scrivi il file SQL in questa cartella (es. `2026-02-02_add_campo_xyz.sql`).
2. Applica il contenuto su Supabase SQL Editor.
3. Esegui `npx prisma db pull` da un ambiente connesso e committa `prisma/schema.prisma`.
