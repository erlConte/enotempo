/**
 * Eventi da DB (Prisma). Sostituisce mockEvents per list/detail/posti rimanenti.
 */

import { prisma } from "@/lib/prisma";

export type EventWithRemaining = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  date: Date;
  locationName: string;
  locationAddress: string | null;
  description: string | null;
  capacity: number;
  status: string;
  createdAt: Date;
  remainingSeats: number;
  /** Campi opzionali per UI (price, chef, image) - da estendere in schema se servono */
  price?: number;
  chef?: string;
  image?: string;
};

/** Lista eventi pubblicati con posti rimasti (solo prenotazioni status=confirmed contano) */
export async function getEvents(): Promise<EventWithRemaining[]> {
  const events = await prisma.event.findMany({
    where: { status: "published" },
    orderBy: { date: "asc" },
    include: {
      reservations: {
        where: { status: "confirmed" },
        select: { guests: true },
      },
    },
  });
  return events.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    subtitle: e.subtitle,
    date: e.date,
    locationName: e.locationName,
    locationAddress: e.locationAddress,
    description: e.description,
    capacity: e.capacity,
    status: e.status,
    createdAt: e.createdAt,
    remainingSeats: Math.max(0, e.capacity - e.reservations.reduce((s, r) => s + r.guests, 0)),
  }));
}

/** Evento per slug con posti rimanenti; null se non trovato o non published */
export async function getEventBySlug(slug: string): Promise<EventWithRemaining | null> {
  const event = await prisma.event.findUnique({
    where: { slug, status: "published" },
    include: {
      reservations: {
        where: { status: "confirmed" },
        select: { guests: true },
      },
    },
  });
  if (!event) return null;
  const booked = event.reservations.reduce((s, r) => s + r.guests, 0);
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    subtitle: event.subtitle,
    date: event.date,
    locationName: event.locationName,
    locationAddress: event.locationAddress,
    description: event.description,
    capacity: event.capacity,
    status: event.status,
    createdAt: event.createdAt,
    remainingSeats: Math.max(0, event.capacity - booked),
  };
}

/** Prossimo evento in programma (per popup home); null se nessuno */
export async function getNextUpcomingEvent(): Promise<EventWithRemaining | null> {
  const now = new Date();
  const events = await getEvents();
  const upcoming = events.filter((e) => e.date > now).sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcoming[0] ?? null;
}
