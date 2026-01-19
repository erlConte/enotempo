export interface MockEvent {
  slug: string;
  title: string;
  date: Date;
  locationName: string;
  locationAddress?: string;
  shortDescription: string;
  fullDescription: string;
  availableSeats: number;
  price: number; // Prezzo in euro
  chef?: string; // Nome dello chef associato
  image?: string; // Percorso immagine evento
}

export function getMockEvents(): MockEvent[] {
  return [
    {
      slug: "cena-tullpukuna",
      title: "Cena a Tullpukuna",
      date: new Date("2026-02-05T20:00:00.000Z"),
      locationName: "Tullpukuna",
      locationAddress: "Piazza Dante 5, Roma",
      shortDescription:
        "Una cena interculturale tra cucina andina contemporanea e vini in abbinamento, nel cuore di Roma.",
      fullDescription:
        "Una serata di convivialità a Tullpukuna: piatti ispirati alle Ande reinterpretati in chiave contemporanea, racconti di viaggio e vini selezionati in abbinamento. Un’esperienza pensata per unire culture e sapori in un’unica tavola.",
      availableSeats: 30,
      price: 45,
      chef: "Gherson Melgarejo",
      image: "https://8ud5gz3z3ejgzjpg.public.blob.vercel-storage.com/gallery/cena-andina-contemporanea-wYzg71VPofSz99v2KIjJJ9E3bKwWJR.jpg",
    },
  ];
}

export function getEventBySlug(slug: string): MockEvent | undefined {
  return getMockEvents().find((event) => event.slug === slug);
}

export function getNextUpcomingEvent(): MockEvent | null {
  const now = new Date();
  const events = getMockEvents();
  const upcoming = events
    .filter((e) => e.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcoming[0] ?? null;
}

