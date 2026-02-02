import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEventBySlug } from "@/lib/events";
import { getGalleryItems, getGallerySlice } from "@/lib/gallery";
import BookingGate from "@/components/events/BookingGate";
import EventVideo from "@/components/events/EventVideo";
import { hasValidSession, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const TULLPUKUNA_SLUG = "cena-tullpukuna";
const GALLERY_COUNT = 6;
const VIDEO_PATH = "/events/tullpukuna/video.mp4";

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

  const gallery = getGalleryItems();
  const ogImageRaw = gallery[0]?.src ?? null;
  const ogImage = ogImageRaw && !ogImageRaw.startsWith("http") ? `${buildBaseUrl()}${ogImageRaw.startsWith("/") ? "" : "/"}${ogImageRaw}` : ogImageRaw;

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
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatDateWithTime(date: Date, loc: string): string {
  return new Intl.DateTimeFormat(
    loc === "it" ? "it-IT" : loc === "en" ? "en-US" : "es-ES",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  )
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
  const mapsQuery =
    event.locationAddress
      ? `${event.locationName}, ${event.locationAddress}`
      : event.locationName;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

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

      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        {/* Hero: immagine grande */}
        <section className="mb-10">
          {heroImage ? (
            <div className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-2xl overflow-hidden bg-marrone-scuro/10">
              <Image
                src={heroImage}
                alt={event.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 1024px"
              />
            </div>
          ) : null}
        </section>

        {/* Titolo + info chips */}
        <header className="mb-8">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-borgogna mb-6">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-base md:text-lg text-marrone-scuro/80">
            <span className="flex items-center gap-2">
              <span>📅</span>
              <span>{formatDateWithTime(event.date, locale)}</span>
            </span>
            <span className="flex items-center gap-2">
              <span>📍</span>
              <span>
                {event.locationName}
                {event.locationAddress ? `, ${event.locationAddress}` : ""}
              </span>
            </span>
            {event.price != null && (
              <span className="flex items-center gap-2 font-semibold">
                <span>💰</span>
                <span>{event.price} €</span>
              </span>
            )}
            {event.remainingSeats > 0 ? (
              <Badge className="bg-verde text-bianco-caldo text-sm">
                {t("availableSeats")}: {event.remainingSeats}
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-sm">
                {t("soldOut")}
              </Badge>
            )}
          </div>
        </header>

        {/* CTA box integrato: prezzo, regole pagamento, CTA (un solo blocco visivo) */}
        {event.remainingSeats > 0 && (
          <section className="mb-12 rounded-2xl border border-border bg-white/80 shadow-md p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                {event.price != null && (
                  <p className="text-xl font-semibold text-marrone-scuro">
                    {event.price} € a persona
                  </p>
                )}
                <p className="text-sm text-marrone-scuro/80">
                  Pagamento online obbligatorio prima della conferma. 1 persona = 1 prenotazione.
                </p>
              </div>
              <div className="shrink-0 md:min-w-[280px]">
                <BookingGate hasIdentity={hasIdentity} eventSlug={slug} locale={locale} />
              </div>
            </div>
          </section>
        )}

        {/* Corpo: sezioni in ordine */}
        <div className="space-y-10">
          {/* Descrizione */}
          {(event.description ?? event.subtitle) && (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-borgogna">Descrizione</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-marrone-scuro/90 leading-relaxed text-lg whitespace-pre-line">
                  {event.description ?? event.subtitle ?? ""}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Video (solo Tullpukuna; fallback "Video in arrivo" + hero se non carica) */}
          {isTullpukuna && (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-borgogna">Video</CardTitle>
              </CardHeader>
              <CardContent>
                <EventVideo
                  src={VIDEO_PATH}
                  poster={videoPoster ?? undefined}
                  alt={event.title}
                />
              </CardContent>
            </Card>
          )}

          {/* Gallery */}
          {isTullpukuna && eventGallery.length > 0 && (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-borgogna">Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {eventGallery.map((item) => (
                    <div
                      key={item.src}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl bg-marrone-scuro/5"
                    >
                      <Image
                        src={item.src}
                        alt={`${event.title} - ${item.name}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dove: indirizzo + Apri in Maps */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-borgogna">Dove</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.locationAddress ? (
                <>
                  <p className="text-marrone-scuro/90">
                    {event.locationName}, {event.locationAddress}
                  </p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-borgogna font-semibold hover:underline"
                  >
                    Apri in Maps
                    <span aria-hidden>↗</span>
                  </a>
                </>
              ) : (
                <p className="text-marrone-scuro/80 italic">Luogo: DA CONFERMARE</p>
              )}
            </CardContent>
          </Card>

          {/* Seguici: solo testo neutro, nessun link fake */}
          {isTullpukuna && (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-borgogna">Seguici</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-marrone-scuro/80 text-sm">
                  Link in aggiornamento.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Regole e dichiarazioni */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-borgogna">
                {tRegole("title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc list-inside text-marrone-scuro/90 space-y-2">
                <li>{tRegole("punctuality")}</li>
                <li>{tRegole("allergies")}</li>
                <li>{tRegole("extraPaid")}</li>
                <li>{tRegole("limitedSeats")}</li>
              </ul>
              <Link
                href={`/${locale}/regole`}
                className="inline-block text-borgogna font-medium hover:underline mt-2"
              >
                {tRegole("readMore")} →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
