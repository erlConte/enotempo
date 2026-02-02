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

  // 12 febbraio 2026 ore 19:30 Europe/Rome → 18:30 UTC
  const eventDate = new Date("2026-02-12T18:30:00.000Z");

  // Cena a Tullpukuna – 12 febbraio 2026 ore 19:30, 75€, 30 posti, pagamento online obbligatorio
  const eventPayload = {
    slug: "cena-tullpukuna",
    title: "Cena a Tullpukuna",
    subtitle: "Cucina andina contemporanea e vini in abbinamento",
    date: eventDate,
    locationName: "Tullpukuna",
    locationAddress: "Piazza Dante 5, Roma",
    description:
      "Pagamento online obbligatorio prima della conferma. 1 persona = 1 prenotazione.\n\nEsperienza conviviale con cucina andina contemporanea, vini in abbinamento e atmosfera unica. Posti limitati.",
    capacity: 30,
    priceCents: 7500,
    status: "published",
  };
  const event = await prisma.event.upsert({
    where: { slug: "cena-tullpukuna" },
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

