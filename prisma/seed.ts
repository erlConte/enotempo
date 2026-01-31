import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL missing in .env");
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  const eventDate = new Date("2026-02-15T20:00:00.000Z");

  // Evento reale: Cena a Tullpukuna – 15 febbraio 2026, Tullpukuna, 40 posti, 80€ a persona (solo cena), menu 5 portate
  const eventPayload = {
    slug: "cena-tullpukuna-15-febbraio-2026",
    title: "Cena a Tullpukuna",
    subtitle: "Cucina andina contemporanea e vini in abbinamento",
    date: eventDate,
    locationName: "Tullpukuna",
    locationAddress: null,
    description:
      "Prezzo: 80€ a persona (solo cena).\n\nUna serata di convivialità a Tullpukuna: piatti ispirati alle Ande reinterpretati in chiave contemporanea, racconti di viaggio e vini selezionati in abbinamento.\n\nMenu 5 portate (4 salate + 1 dolce):\n• Antipasto – Ceviche di pesce con avocado e mais\n• Primo – Causa rellena con pollo e olive\n• Secondo – Lomo saltado con riso e patate\n• Pre-dolce – Formaggi andini con miele\n• Dolce – Suspiro a la limeña\n\nAbbinamento vini: selezione di etichette italiane e sudamericane in abbinamento alle portate.",
    capacity: 40,
    status: "published",
  };
  const event = await prisma.event.upsert({
    where: { slug: "cena-tullpukuna-15-febbraio-2026" },
    update: eventPayload,
    create: eventPayload,
  });

  console.log("✅ Created/Updated Event:", {
    id: event.id,
    slug: event.slug,
    title: event.title,
    date: event.date.toISOString(),
    location: event.locationName,
  });

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

