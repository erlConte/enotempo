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
  'Cucina sudamericana e vini italiani',
  '2026-02-12 18:30:00+00'::timestamptz,
  'Ristorante Tullpukuna',
  'Piazza Dante 5, Roma',
  E'Ciao!\nSiamo lieti di invitarLa a una serata davvero speciale, concepita come un''esperienza di incontro, gusto e dialogo. Condivideremo la tavola in un ambiente caldo ed elegante, per intraprendere un viaggio attraverso i sapori più rappresentativi della cucina sudamericana, accuratamente abbinati a vini italiani di grande qualità.\nIl menù è stato ideato e preparato appositamente per l''occasione dal nostro chef, che ha pensato ogni piatto come un''esperienza sensoriale capace di unire tradizione, creatività e armonia.\nSarà una serata dedicata al gusto, alla conversazione e all''incontro tra la ricchezza gastronomica del Sud America e l''eleganza del vino italiano.\nSarà un vero onore poterLa avere con noi e condividere insieme questa esperienza che, ne siamo certi, rimarrà nella memoria e nel cuore.\nCon stima,',
  30,
  7000,
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
