/**
 * Lookup/upsert FenamMember per externalFenamId (affiliationId/memberNumber/stableId).
 * Evita duplicati: primo login senza email crea record con placeholder; login successivo con email aggiorna lo stesso record.
 */

import type { PrismaClient } from "@prisma/client";
import { buildPlaceholderEmail, isPlaceholderEmail } from "@/lib/fenam-handoff";

function looksLikeEmail(s: string): boolean {
  return typeof s === "string" && s.includes("@") && s.length >= 5;
}

export type FenamMemberUpsertPayload = {
  email: string | null;
  stableId: string;
  affiliationId?: string;
  memberNumber?: string;
};

/**
 * Cerca/crea FenamMember per externalFenamId.
 * - Chiave primaria: externalFenamId = affiliationId || memberNumber || stableId (stableId sempre presente)
 * - Email: opzionale. Se arriva email valida e l'attuale è placeholder → sostituisce (gestendo P2002).
 */
export async function upsertFenamMemberByExternalId(
  prisma: PrismaClient,
  payload: FenamMemberUpsertPayload
) {
  // externalId deve essere sempre definito perché stableId è required
  const externalId = payload.affiliationId ?? payload.memberNumber ?? payload.stableId;

  if (!externalId) {
    // Non dovrebbe mai accadere: stableId è required. Manteniamo errore coerente.
    throw Object.assign(new Error("Missing externalFenamId"), { code: "MissingClaims" });
  }

  const validEmail =
    payload.email && looksLikeEmail(payload.email)
      ? payload.email.toLowerCase().trim()
      : null;

  const placeholderEmail = buildPlaceholderEmail(payload.stableId);

  // Lookup per externalFenamId (mai per email) per evitare duplicati
  const existing = await prisma.fenamMember.findFirst({
    where: { externalFenamId: externalId },
  });

  if (existing) {
    // Aggiorna sempre externalFenamId (in caso cambino affiliationId/memberNumber)
    // Aggiorna email solo se:
    // - arriva email valida
    // - email attuale è placeholder
    const updateData: { externalFenamId: string; email?: string } = {
      externalFenamId: externalId,
    };

    if (validEmail && isPlaceholderEmail(existing.email)) {
      updateData.email = validEmail;
    }

    try {
      return await prisma.fenamMember.update({
        where: { id: existing.id },
        data: updateData,
      });
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e
          ? (e as { code?: string }).code ?? null
          : null;

      if (code === "P2002") {
        // Unique constraint su email: l'email valida è già associata a un altro record.
        // In questo caso NON sovrascriviamo l'email, ma aggiorniamo comunque externalFenamId.
        return await prisma.fenamMember.update({
          where: { id: existing.id },
          data: { externalFenamId: externalId },
        });
      }

      throw e;
    }
  }

  // Non esiste ancora: crea record con email reale se disponibile, altrimenti placeholder
  return await prisma.fenamMember.create({
    data: {
      email: validEmail ?? placeholderEmail,
      firstName: "",
      lastName: "",
      externalFenamId: externalId,
    },
  });
}
