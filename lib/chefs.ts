export type Chef = {
  slug: string;
  name: string;
  role: string; // es. "Chef", "Sommelier", "Cultural curator"
  photoPath: string; // es. "/chefs/filippo-rossi.jpg"
  shortBio: string; // 2–3 righe per card
  fullBio: string; // versione più lunga, usata in dettaglio/sezione about
};

export const chefs: Chef[] = [
  {
    slug: "gherson-melgarejo",
    name: "Gherson Melgarejo",
    role: "Executive Chef – Ristorante Tullpukuna (Roma)",
    photoPath: "/chefs/gherson-melgarejo.jpg",
    shortBio:
      "Chef peruviano con esperienze in ristoranti come Central e Mayta di Lima. Porta a Roma una cucina andina contemporanea, curata nei colori, nei sapori e nella presentazione.",
    fullBio:
      "Cresciuto tra le montagne del Perù, Gherson ha affinato le sue tecniche in ristoranti premiati come Central e Mayta. È oggi il volto culinario del ristorante Tullpukuna di Roma, dove unisce gastronomia peruviana, sperimentazione, mixology e narrazione sensoriale in ogni piatto.",
  },
];

export function getChefs() {
  return chefs;
}

export function getChefBySlug(slug: string) {
  return chefs.find((c) => c.slug === slug) ?? null;
}

