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

  const eventDate = new Date("2026-02-05T20:00:00.000Z");

  // Primo evento reale: Cena a Tullpukuna (posti limitati, no placeholder)
  const eventPayload = {
    slug: "cena-tullpukuna",
    title: "Cena a Tullpukuna",
    subtitle: "Cucina andina contemporanea e vini in abbinamento",
    date: eventDate,
    locationName: "Tullpukuna",
    locationAddress: "Piazza Dante 5, Roma",
    description:
      "Una serata di convivialità a Tullpukuna: piatti ispirati alle Ande reinterpretati in chiave contemporanea, racconti di viaggio e vini selezionati in abbinamento.",
    capacity: 30,
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

