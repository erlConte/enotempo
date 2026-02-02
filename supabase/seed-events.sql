-- Seed idempotente: evento Cena a Tullpukuna.
-- Eseguire da Supabase SQL Editor (non da locale se TLS fallisce).
-- Può essere eseguito più volte: ON CONFLICT (slug) DO UPDATE.

BEGIN;

INSERT INTO "Event" (
  "id",
  "slug",
  "title",
  "subtitle",
  "date",
  "locationName",
  "locationAddress",
  "description",
  "capacity",
  "priceCents",
  "status",
  "createdAt"
)
VALUES (
  gen_random_uuid()::text,
  'cena-tullpukuna',
  'Cena a Tullpukuna',
  'Cucina andina contemporanea e vini in abbinamento',
  '2026-02-12 18:30:00+00'::timestamptz,
  'Tullpukuna',
  'Piazza Dante 5, Roma',
  'Pagamento online obbligatorio prima della conferma. 1 persona = 1 prenotazione.' || E'\n\n' || 'Esperienza conviviale con cucina andina contemporanea, vini in abbinamento e atmosfera unica. Posti limitati.',
  30,
  7500,
  'published',
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "subtitle" = EXCLUDED."subtitle",
  "date" = EXCLUDED."date",
  "locationName" = EXCLUDED."locationName",
  "locationAddress" = EXCLUDED."locationAddress",
  "description" = EXCLUDED."description",
  "capacity" = EXCLUDED."capacity",
  "priceCents" = EXCLUDED."priceCents",
  "status" = EXCLUDED."status";

COMMIT;

-- Rollback (solo se serve annullare manualmente): DELETE FROM "Event" WHERE "slug" = 'cena-tullpukuna';
