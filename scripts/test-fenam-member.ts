/**
 * Test: upsert FenamMember per externalFenamId (no duplicati).
 * - Primo login senza email: crea record con email placeholder.
 * - Login successivo con email: aggiorna lo stesso record, non ne crea un altro.
 *
 * Esegui: npx tsx scripts/test-fenam-member.ts
 */

import { upsertFenamMemberByExternalId } from "../lib/fenam-member";
import { isPlaceholderEmail, buildPlaceholderEmail } from "../lib/fenam-handoff";

type FenamMember = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  externalFenamId: string | null;
};

function makeMockPrisma(): {
  fenamMember: {
    findFirst: (args: { where: { externalFenamId: string } }) => Promise<FenamMember | null>;
    create: (args: { data: Partial<FenamMember> }) => Promise<FenamMember>;
    update: (args: { where: { id: string }; data: Partial<FenamMember> }) => Promise<FenamMember>;
  };
  _store: () => Map<string, FenamMember>;
} {
  const store = new Map<string, FenamMember>();
  let idCounter = 0;
  const nextId = () => `cuid-${++idCounter}`;

  return {
    fenamMember: {
      findFirst: async (args: { where: { externalFenamId: string } }) => {
        for (const m of store.values()) {
          if (m.externalFenamId === args.where.externalFenamId) return m;
        }
        return null;
      },
      create: async (args: { data: Partial<FenamMember> }) => {
        const id = nextId();
        const rec: FenamMember = {
          id,
          email: args.data.email!,
          firstName: args.data.firstName ?? "",
          lastName: args.data.lastName ?? "",
          externalFenamId: args.data.externalFenamId ?? null,
        };
        store.set(id, rec);
        return rec;
      },
      update: async (args: { where: { id: string }; data: Partial<FenamMember> }) => {
        const existing = store.get(args.where.id);
        if (!existing) throw new Error("P2025");
        const updated: FenamMember = {
          ...existing,
          ...args.data,
          id: existing.id,
        };
        store.set(existing.id, updated);
        return updated;
      },
    },
    _store: () => store,
  };
}

async function main() {
  const mock = makeMockPrisma();
  const prisma = mock as Parameters<typeof upsertFenamMemberByExternalId>[0];
  const externalId = "aff-123";
  const stableId = "stable-456";

  // 1) Primo login SENZA email → crea record con placeholder
  const first = await upsertFenamMemberByExternalId(prisma, {
    email: null,
    stableId,
    affiliationId: externalId,
    memberNumber: "M001",
  });

  const store = mock._store();
  const countAfterFirst = store.size;
  const isPlaceholder = isPlaceholderEmail(first.email);
  const expectedPlaceholder = buildPlaceholderEmail(stableId);

  console.log("1) Primo login senza email:");
  console.log("   Record creato:", first.id, first.email);
  console.log("   Email è placeholder?", isPlaceholder);
  console.log("   Numero record:", countAfterFirst);

  if (countAfterFirst !== 1) {
    console.error("FAIL: dopo primo login ci si aspetta 1 record, trovati", countAfterFirst);
    process.exit(1);
  }
  if (!isPlaceholder) {
    console.error("FAIL: email dovrebbe essere placeholder, trovata:", first.email);
    process.exit(1);
  }
  if (first.email !== expectedPlaceholder) {
    console.error("FAIL: placeholder atteso", expectedPlaceholder, "ottenuto", first.email);
    process.exit(1);
  }
  console.log("   OK\n");

  // 2) Login successivo CON email → aggiorna lo stesso record (stesso id), non crea un secondo
  const second = await upsertFenamMemberByExternalId(prisma, {
    email: "mario@example.com",
    stableId,
    affiliationId: externalId,
    memberNumber: "M001",
  });

  const countAfterSecond = store.size;
  const stillOneRecord = countAfterSecond === 1;
  const sameId = second.id === first.id;
  const emailUpdated = second.email === "mario@example.com";

  console.log("2) Login successivo con email:");
  console.log("   Record:", second.id, second.email);
  console.log("   Stesso id del primo?", sameId);
  console.log("   Email aggiornata?", emailUpdated);
  console.log("   Numero record (ancora 1)?", countAfterSecond);

  if (!stillOneRecord) {
    console.error("FAIL: dopo secondo login ci si aspetta ancora 1 record, trovati", countAfterSecond);
    process.exit(1);
  }
  if (!sameId) {
    console.error("FAIL: dovrebbe essere lo stesso record (stesso id), invece", first.id, "vs", second.id);
    process.exit(1);
  }
  if (!emailUpdated) {
    console.error("FAIL: email dovrebbe essere mario@example.com, trovata", second.email);
    process.exit(1);
  }
  console.log("   OK\n");

  console.log("Tutti i test passati: primo login senza email crea record; secondo con email aggiorna lo stesso record.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
