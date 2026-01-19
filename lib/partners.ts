export type Partner = {
  slug: string;
  name: string;
  type: "restaurant" | "winery" | "other";
  city: string;
  country: string;
  logoPath?: string; // opzionale: URL logo (se disponibile)
  whyEnotempo?: string;
  about?: string;
  expectations?: string;
};

// IMPORTANT: per evitare contenuti fittizi, lasciamo l'elenco vuoto
// finché non sono disponibili partner reali verificati.
export const partners: Partner[] = [];

export function getPartners() {
  return partners;
}

export function getPartnerBySlug(slug: string) {
  return partners.find((p) => p.slug === slug) ?? null;
}

