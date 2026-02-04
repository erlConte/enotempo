import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { getEventBySlug } from "@/lib/events";
import { getGallerySlice } from "@/lib/gallery";
import BookingGate from "@/components/events/BookingGate";
import EventVideo from "@/components/events/EventVideo";
import EventMenu from "@/components/events/EventMenu";
import EventMap from "@/components/events/EventMap";
import { hasValidSession, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const TULLPUKUNA_SLUG = "cena-tullpukuna";
const GALLERY_COUNT = 6;
const VIDEO_PATH = "/events/tullpukuna/video.mp4";

// Menu per Tullpukuna (hardcoded per ora, da estendere in futuro con DB)
const TULLPUKUNA_MENU = [
  {
    course: "Antipasto",
    dish: "Ceviche di pesce con avocado e mais",
    wine: "Selezione vini bianchi italiani",
  },
  {
    course: "Primo",
    dish: "Causa rellena con pollo e olive",
    wine: "Vini bianchi e rosati",
  },
  {
    course: "Secondo",
    dish: "Lomo saltado con riso e patate",
    wine: "Vini rossi italiani e sudamericani",
  },
  {
    course: "Pre-dolce",
    dish: "Formaggi andini con miele",
    wine: "Vini da dessert",
  },
  {
    course: "Dolce",
    dish: "Suspiro a la limeña",
  },
];

function buildBaseUrl(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (typeof site === "string" && site.trim()) return site.trim().replace(/\/$/, "");
  const v = process.env.VERCEL_URL;
  if (typeof v === "string" && v) return `https://${v}`;
  return "https://enotempo.it";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Cena" };

  const title = `${event.title} — ${formatDateShort(event.date, "it")} ${formatTime(event.date)}`;
  const description = [
    event.title,
    formatDateShort(event.date, locale),
    formatTime(event.date),
    event.price != null ? `${event.price} €` : "",
    "Pagamento online obbligatorio.",
  ]
    .filter(Boolean)
    .join(" · ");

  const baseUrl = buildBaseUrl();
  const pathname = `/${locale}/cene/${slug}`;
  const canonicalUrl = baseUrl ? `${baseUrl}${pathname}` : pathname;

  const gallery = getGallerySlice(1);
  const ogImageRaw = gallery[0]?.src ?? null;
  const ogImage =
    ogImageRaw && !ogImageRaw.startsWith("http")
      ? `${buildBaseUrl()}${ogImageRaw.startsWith("/") ? "" : "/"}${ogImageRaw}`
      : ogImageRaw;

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "ENOTEMPO",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: event.title }] : undefined,
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: { canonical: canonicalUrl },
  };

  return metadata;
}

function formatDateShort(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : locale === "en" ? "en-US" : "es-ES", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Rome", // Timezone esplicito per coerenza
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome", // Timezone esplicito per coerenza
  }).format(date);
}

function formatDateWithTime(date: Date, loc: string): string {
  return new Intl.DateTimeFormat(loc === "it" ? "it-IT" : loc === "en" ? "en-US" : "es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome", // Timezone esplicito per coerenza
  })
    .format(date)
    .replace(/, (\d{1,2}:\d{2})/, " — $1");
}

export default async function CenaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("events");
  const tRegole = await getTranslations("regole");
  const tAuth = await getTranslations("auth.fenam");
  const event = await getEventBySlug(slug);
  const cookieStore = await cookies();
  const hasIdentity = hasValidSession(cookieStore.get(FENAM_SESSION_COOKIE)?.value);

  if (!event) {
    notFound();
  }

  const isTullpukuna = slug === TULLPUKUNA_SLUG;
  const eventGallery = isTullpukuna ? getGallerySlice(GALLERY_COUNT) : [];
  const heroImage = event.image ?? (eventGallery[0]?.src ?? null);
  const videoPoster = eventGallery[0]?.src ?? null;
  const menuItems = isTullpukuna ? TULLPUKUNA_MENU : [];

  return (
    <div className="min-h-screen bg-bianco-caldo">
      {/* JSON-LD Event */}
      {isTullpukuna && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              name: event.title,
              description: event.description ?? event.subtitle ?? undefined,
              startDate: event.date.toISOString(),
              ...(event.price != null && {
                offers: { "@type": "Offer", price: event.price, priceCurrency: "EUR" },
              }),
              ...(event.locationAddress
                ? {
                    location: {
                      "@type": "Place",
                      name: event.locationName,
                      address: event.locationAddress,
                    },
                  }
                : {}),
            }),
          }}
        />
      )}

      {/* 1) HERO - Immagine full-width + titolo + info */}
      <section className="w-full">
        {/* Immagine hero */}
        {heroImage && (
          <div className="relative w-full aspect-[4/5] md:aspect-[21/9] overflow-hidden bg-marrone-scuro/10">
            <Image
              src={heroImage}
              alt={event.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
        )}

        {/* Titolo e info - container centrale */}
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-borgogna mb-6">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-base md:text-lg text-marrone-scuro/80">
            {/* Data + ora */}
            <span className="flex items-center gap-2">
              <span>📅</span>
              <span>{formatDateWithTime(event.date, locale)}</span>
            </span>

            {/* Luogo */}
            <span className="flex items-center gap-2">
              <span>📍</span>
              <span>
                {event.locationName}
                {event.locationAddress ? `, ${event.locationAddress}` : ""}
              </span>
            </span>

            {/* Prezzo */}
            {event.price != null && (
              <span className="flex items-center gap-2 font-semibold text-borgogna">
                <span>💰</span>
                <span>{event.price} €</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Container centrale per tutto il contenuto */}
      <div className="container mx-auto max-w-6xl px-4 pb-16 md:pb-24 space-y-16 md:space-y-20">
        {/* 2) BLOCCO PRENOTAZIONE */}
        {event.remainingSeats > 0 && (
              <section className="space-y-4">
                <div className="bg-white/80 border border-borgogna/20 rounded-2xl p-6 md:p-8 shadow-sm">
                  <p className="text-sm md:text-base text-marrone-scuro/80 mb-6">
                    PRENOTAZIONE 
                  </p>
                  <BookingGate
                    hasIdentity={hasIdentity}
                    eventSlug={slug}
                    locale={locale}
                    simple={true}
                  />
                </div>
              </section>
            )}

         
          {/* 3) DESCRIZIONE */}
          {(event.description ?? event.subtitle) && (
            <section>
              <div className="prose prose-lg max-w-none">
                <p className="text-marrone-scuro/90 leading-relaxed text-base md:text-lg whitespace-pre-line">
                  {event.description ?? event.subtitle ?? ""}
                </p>
              </div>
            </section>
          )}
            

          {/* 4) MENU - Sezione dedicata */}
          {menuItems.length > 0 && (
            <section>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-borgogna mb-8">
                Menu
              </h2>
              <EventMenu items={menuItems} />
            </section>
          )}

          {/* 5) REGOLE - Elenco breve, senza box */}
          <section>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-borgogna mb-6">
              {tRegole("title")}
            </h2>
            <ul className="space-y-3 text-marrone-scuro/90 text-base md:text-lg">
              <li className="flex items-start gap-3">
                <span className="text-borgogna mt-1">•</span>
                <span>{tRegole("punctuality")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-borgogna mt-1">•</span>
                <span>{tRegole("allergies")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-borgogna mt-1">•</span>
                <span>{tRegole("extraPaid")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-borgogna mt-1">•</span>
                <span>{tRegole("limitedSeats")}</span>
              </li>
            </ul>
            <Link
              href={`/${locale}/regole`}
              className="inline-block text-borgogna font-medium hover:underline mt-4"
            >
              {tRegole("readMore")} →
            </Link>
          </section>

          {/* 6) MAPPA - Embed Google Maps */}
          {event.locationAddress && (
            <section>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-borgogna mb-6">
                Dove
              </h2>
              <div className="space-y-4">
                <p className="text-marrone-scuro/90 text-base md:text-lg">
                  {event.locationName}, {event.locationAddress}
                </p>
                <EventMap locationName={event.locationName} locationAddress={event.locationAddress} />
              </div>
            </section>
          )}



          {/* TOP BLOCK: Grid desktop 2 colonne (Video sinistra, Prenotazione+Descrizione destra); mobile stack verticale */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
            {/* Colonna sinistra: Video (9:16, max-width controllata) */}
            {isTullpukuna && (
              <section className="w-full max-w-sm lg:max-w-md">
                <EventVideo
                  src={VIDEO_PATH}
                  poster={videoPoster ?? undefined}
                  alt={event.title}
                  vertical={true}
                />
              </section>
            )}

            {/* Colonna destra */}
            {/* 8) GALLERY - Griglia immagini finale */}
            {isTullpukuna && eventGallery.length > 0 && (
              <section>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-borgogna mb-8">
                  Gallery
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {eventGallery.map((item) => (
                    <div
                      key={item.src}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl bg-marrone-scuro/5"
                    >
                      <Image
                        src={item.src}
                        alt={`${event.title} - ${item.name}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
        </div>
      </div>
    </div>
  );
}
