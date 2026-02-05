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

  // Cena a Tullpukuna – 12 febbraio 2026 ore 19:30, 70€, 30 posti, pagamento online obbligatorio
  const eventPayload = {
    slug: "cena-tullpukuna",
    title: "Cena a Tullpukuna",
    subtitle: "Cucina sudamericana e vini italiani",
    date: eventDate,
    locationName: "Ristorante Tullpukuna",
    locationAddress: "Piazza Dante 5, Roma",
    description: `Ciao!
Siamo lieti di invitarLa a una serata davvero speciale, concepita come un'esperienza di incontro, gusto e dialogo. Condivideremo la tavola in un ambiente caldo ed elegante, per intraprendere un viaggio attraverso i sapori più rappresentativi della cucina sudamericana, accuratamente abbinati a vini italiani di grande qualità.
Il menù è stato ideato e preparato appositamente per l'occasione dal nostro chef, che ha pensato ogni piatto come un'esperienza sensoriale capace di unire tradizione, creatività e armonia.
Sarà una serata dedicata al gusto, alla conversazione e all'incontro tra la ricchezza gastronomica del Sud America e l'eleganza del vino italiano.
Sarà un vero onore poterLa avere con noi e condividere insieme questa esperienza che, ne siamo certi, rimarrà nella memoria e nel cuore.
Con stima,`,
    capacity: 30,
    priceCents: 7000,
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

