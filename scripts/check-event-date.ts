/**
 * Script di debug per verificare la data dell'evento nel DB
 * Esegui con: npx tsx scripts/check-event-date.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

config({ path: resolve(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL missing in .env");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔍 Checking event dates in DB...\n");

  const events = await prisma.event.findMany({
    where: { status: "published" },
    orderBy: { date: "asc" },
  });

  if (events.length === 0) {
    console.log("❌ No published events found");
    return;
  }

  for (const event of events) {
    console.log(`📅 Event: ${event.title} (${event.slug})`);
    console.log(`   ID: ${event.id}`);
    console.log(`   Status: ${event.status}`);
    console.log(`   Date (raw from DB): ${event.date}`);
    console.log(`   Date (ISO): ${event.date.toISOString()}`);
    console.log(`   Date (UTC): ${event.date.toUTCString()}`);
    console.log(`   Date (Local): ${event.date.toString()}`);
    console.log(
      `   Date (Europe/Rome): ${event.date.toLocaleString("it-IT", { timeZone: "Europe/Rome" })}`
    );
    console.log(`   Timestamp: ${event.date.getTime()}`);
    console.log("");
  }

  // Verifica il prossimo evento
  const now = new Date();
  const upcoming = events.filter((e) => e.date > now).sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextEvent = upcoming[0];

  if (nextEvent) {
    console.log("🎯 Next upcoming event:");
    console.log(`   Title: ${nextEvent.title}`);
    console.log(`   Slug: ${nextEvent.slug}`);
    console.log(`   Date ISO: ${nextEvent.date.toISOString()}`);
    console.log(
      `   Date Europe/Rome: ${nextEvent.date.toLocaleString("it-IT", { timeZone: "Europe/Rome" })}`
    );
    console.log(`   Expected: 19:30 Europe/Rome`);
    const romeTime = nextEvent.date.toLocaleString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Rome",
    });
    console.log(`   Actual hour in Rome: ${romeTime}`);
  } else {
    console.log("⚠️  No upcoming events found");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
