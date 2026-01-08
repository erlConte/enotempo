export interface MockEvent {
  slug: string;
  title: string;
  date: Date;
  location: string;
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
      slug: "cena-andina-contemporanea",
      title: "Cena Andina Contemporanea",
      date: new Date("2026-02-25T20:00:00"),
      location: "Ristorante Tullpukuna, Piazza Dante 5, Roma",
      shortDescription: "Un viaggio sensoriale tra le Ande e Roma con piatti creativi, storytelling e vini in abbinamento.",
      fullDescription: "Un viaggio sensoriale tra le Ande e Roma con piatti creativi, storytelling e vini in abbinamento. Un'esperienza multisensoriale che celebra la cucina andina contemporanea attraverso sapori autentici, presentazioni innovative e la narrazione di storie che uniscono culture lontane.",
      availableSeats: 30,
      price: 45,
      chef: "Gherson Melgarejo",
      image: "/events/cena-andina-contemporanea.jpg",
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

