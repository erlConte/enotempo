/**
 * Lookup/upsert FenamMember per externalFenamId (affiliationId/memberNumber/stableId).
 * Evita duplicati: primo login senza email crea record con placeholder; login successivo con email aggiorna lo stesso record.
 */

import type { PrismaClient } from "@prisma/client";
import { isPlaceholderEmail, buildPlaceholderEmail } from "@/lib/fenam-handoff";

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
 * Cerca/crea FenamMember per externalFenamId. Se esiste già e arriva email valida (e l'attuale è placeholder), aggiorna email.
 * Compat: se non esiste e c'è email valida, crea con externalFenamId + email.
 */
export async function upsertFenamMemberByExternalId(
  prisma: PrismaClient,
  payload: FenamMemberUpsertPayload
) {
  const externalId =
    payload.affiliationId || payload.memberNumber || payload.stableId || undefined;
  const validEmail =
    payload.email && payload.email.trim() && looksLikeEmail(payload.email)
      ? payload.email.toLowerCase().trim()
      : null;
  const placeholderEmail = buildPlaceholderEmail(payload.stableId);

  const existing =
    externalId != null
      ? await prisma.fenamMember.findFirst({
          where: { externalFenamId: externalId },
        })
      : null;

  if (existing) {
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
      const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : null;
      if (code === "P2002") {
        // Unique constraint su email: altro member ha già questa email, non aggiornare email
        return await prisma.fenamMember.update({
          where: { id: existing.id },
          data: { externalFenamId: externalId },
        });
      }
      throw e;
    }
  }

  return await prisma.fenamMember.create({
    data: {
      email: validEmail ?? placeholderEmail,
      firstName: "",
      lastName: "",
      externalFenamId: externalId ?? null,
    },
  });
}
