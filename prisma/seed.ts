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

  // Calcola data futura (2 mesi da oggi)
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 2);

  // Upsert Event by slug "cena-di-benedizione"
  const event = await prisma.event.upsert({
    where: {
      slug: "cena-di-benedizione",
    },
    update: {
      title: "Cena di Benedizione",
      subtitle: "Serata speciale con degustazione di vini pregiati",
      date: futureDate,
      locationName: "Villa EnoTempo",
      locationAddress: "Via delle Vigne 42, 20121 Milano, Italia",
      description: "Una serata esclusiva dedicata alla degustazione di vini pregiati con abbinamenti gastronomici curati.",
    },
    create: {
      slug: "cena-di-benedizione",
      title: "Cena di Benedizione",
      subtitle: "Serata speciale con degustazione di vini pregiati",
      date: futureDate,
      locationName: "Villa EnoTempo",
      locationAddress: "Via delle Vigne 42, 20121 Milano, Italia",
      description: "Una serata esclusiva dedicata alla degustazione di vini pregiati con abbinamenti gastronomici curati.",
    },
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

