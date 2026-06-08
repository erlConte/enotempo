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

export const partners: Partner[] = [
  {
    slug: "tullpukuna",
    name: "Ristorante Tullpukuna",
    type: "restaurant",
    city: "Roma",
    country: "Italia",
    whyEnotempo: "Sede delle cene Enotempo a Roma: cucina andina contemporanea che dialoga con i vini italiani.",
    about: "Ristorante di cucina peruviana e andina contemporanea nel cuore di Roma (Piazza Dante 5). Cura colori, sapori e presentazione in ogni piatto. È la casa delle esperienze Enotempo, dove lo chef Gherson Melgarejo firma i menu.",
  },
];

export function getPartners() {
  return partners;
}

export function getPartnerBySlug(slug: string) {
  return partners.find((p) => p.slug === slug) ?? null;
}

