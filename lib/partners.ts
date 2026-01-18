export type Partner = {
  slug: string;
  name: string;
  type: "restaurant" | "winery" | "other";
  city: string;
  country: string;
  logoPath: string; // URL Vercel Blob o stringa vuota per placeholder
  whyEnotempo: string;
  about: string;
  expectations: string;
};

export const partners: Partner[] = [
  {
    slug: "osteria-del-centro",
    name: "Osteria del Centro",
    type: "restaurant",
    city: "Bologna",
    country: "Italia",
    logoPath: "", // Placeholder - logo non disponibile su Vercel Blob
    whyEnotempo:
      "Abbiamo scelto Enotempo per portare nel nostro locale un dialogo autentico tra cucina italiana e tradizioni latinoamericane.",
    about:
      "Siamo un'osteria contemporanea che valorizza i prodotti del territorio con un approccio creativo ma fedele alle radici.",
    expectations:
      "Ci aspettiamo di creare insieme eventi che diano visibilità al locale e attraggano una clientela curiosa e attenta alla qualità.",
  },
  {
    slug: "bodega-los-andes",
    name: "Bodega Los Andes",
    type: "winery",
    city: "Mendoza",
    country: "Argentina",
    logoPath: "", // Placeholder - logo non disponibile su Vercel Blob
    whyEnotempo:
      "Enotempo è il partner ideale per raccontare la nostra storia enologica al pubblico italiano.",
    about:
      "Siamo una cantina familiare che produce vini di altitudine, ispirati ai paesaggi andini.",
    expectations:
      "Vorremmo far conoscere i nostri vini in contesti intimi e narrativi, creando legami duraturi con appassionati ed operatori.",
  },
  {
    slug: "trattoria-romana",
    name: "Trattoria Romana",
    type: "restaurant",
    city: "Roma",
    country: "Italia",
    logoPath: "", // Placeholder - logo non disponibile su Vercel Blob
    whyEnotempo:
      "Crediamo nel valore dell'incontro tra culture diverse attraverso il cibo. Enotempo ci permette di condividere la nostra passione per la cucina romana autentica.",
    about:
      "Una trattoria storica nel cuore di Roma, dove la tradizione culinaria si incontra con l'innovazione.",
    expectations:
      "Speriamo di partecipare a eventi che valorizzino la nostra identità culinaria e ci permettano di raggiungere nuovi pubblici interessati alla qualità e all'autenticità.",
  },
];

export function getPartners() {
  return partners;
}

export function getPartnerBySlug(slug: string) {
  return partners.find((p) => p.slug === slug) ?? null;
}

