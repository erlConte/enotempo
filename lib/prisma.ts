import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Singleton pattern per Prisma Client
// Previene la creazione di multiple istanze in ambiente serverless (Vercel)
// Lazy initialization: crea il client solo quando necessario (runtime, non build-time)
function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Durante build, se DATABASE_URL non è presente, non istanziare il client
  // Questo permette al build di completarsi anche senza DB configurato
  // In build-time, le API routes non vengono eseguite, quindi non serve il client
  if (!process.env.DATABASE_URL) {
    // In build-time senza DATABASE_URL, restituiamo un client "dummy" che non verrà usato
    // Le API routes (che richiedono DB) non vengono eseguite durante build
    if (process.env.NEXT_PHASE === "phase-production-build") {
      // Durante il build, restituiamo un client dummy che non verrà mai usato
      return {} as PrismaClient;
    }
    throw new Error(
      "Prisma Client requires DATABASE_URL. This should only be called at runtime, not during build."
    );
  }

  // Prisma 7: usa adapter pg per PostgreSQL
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

// Export lazy: il client viene creato solo quando viene effettivamente usato
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
