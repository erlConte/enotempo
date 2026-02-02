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
import { hasValidSession, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const TULLPUKUNA_SLUG = "cena-tullpukuna";
const GALLERY_COUNT = 6;
const VIDEO_PATH = "/events/tullpukuna/video.mp4";

function buildBaseUrl(): string {
  const v = process.env.VERCEL_URL;
  if (typeof v === "string" && v) return `https://${v}`;
  return "";
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
  const ogImage = gallery[0]?.src ?? null;

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

  const formatDate = (date: Date, loc: string) => {
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
    ).format(date);
  };

  const initials = event.title
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const isTullpukuna = slug === TULLPUKUNA_SLUG;
  const eventGallery = isTullpukuna ? getGallerySlice(GALLERY_COUNT) : [];
  const heroImage = event.image ?? (eventGallery[0]?.src ?? null);
  const videoPoster = eventGallery[0]?.src ?? null;

  return (
    <div className="min-h-screen bg-bianco-caldo">
      {/* JSON-LD Event (senza location se indirizzo non disponibile) */}
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
              ...(event.price != null && { offers: { "@type": "Offer", price: event.price, priceCurrency: "EUR" } }),
              ...(event.locationAddress
                ? { location: { "@type": "Place", name: event.locationName, address: event.locationAddress } }
                : {}),
            }),
          }}
        />
      )}

      {/* Hero */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
          {heroImage ? (
            <div className="mb-8">
              <Image
                src={heroImage}
                alt={event.title}
                width={1200}
                height={800}
                className="w-full h-64 md:h-80 rounded-2xl object-cover"
              />
            </div>
          ) : null}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {!heroImage && (
              <div className="w-full md:w-32 h-32 md:h-32 rounded-2xl bg-gradient-to-br from-borgogna/20 via-crema/30 to-verde/20 flex items-center justify-center shrink-0">
                <span className="text-3xl font-serif font-bold text-borgogna/40">{initials}</span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-borgogna mb-6">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <p className="text-base md:text-lg text-marrone-scuro/80 flex items-center gap-2">
                  <span>📅</span>
                  <span>{formatDate(event.date, locale)}</span>
                </p>
                <p className="text-base md:text-lg text-marrone-scuro/80 flex items-center gap-2">
                  <span>📍</span>
                  <span>
                    {event.locationName}
                    {event.locationAddress ? `, ${event.locationAddress}` : ""}
                  </span>
                </p>
                {event.price != null && (
                  <p className="text-base md:text-lg text-marrone-scuro/80 flex items-center gap-2 font-semibold">
                    <span>💰</span>
                    <span>{event.price} €</span>
                  </p>
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
              {event.chef && (
                <p className="text-base md:text-lg text-marrone-scuro/80 flex items-center gap-2 mb-4">
                  <span>👨‍🍳</span>
                  <span>{event.chef}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-borgogna">Descrizione</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-marrone-scuro/90 leading-relaxed text-lg font-normal whitespace-pre-line">
                  {event.description ?? event.subtitle ?? ""}
                </p>
              </CardContent>
            </Card>

            {/* Tullpukuna: Gallery immagini da sito */}
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

            {/* Tullpukuna: Video (file in public/events/tullpukuna/video.mp4; copiare da WhatsApp Video...) */}
            {isTullpukuna && (
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl text-borgogna">Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-marrone-scuro/10">
                    <video
                      controls
                      preload="metadata"
                      playsInline
                      className="w-full h-full object-contain"
                      poster={videoPoster ?? undefined}
                      src={VIDEO_PATH}
                    >
                      Il tuo browser non supporta il tag video.
                    </video>
                  </div>
                  {/* TODO: se video non visibile, copiare file locale "WhatsApp Video 2026-01-31 at 18.50.28.mp4" in public/events/tullpukuna/video.mp4 */}
                </CardContent>
              </Card>
            )}

            {/* Dove: mappa o placeholder */}
            {isTullpukuna && (
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
                      {/* TODO: se disponibile embed mappa (iframe Google Maps), inserirlo qui */}
                    </>
                  ) : (
                    <p className="text-marrone-scuro/80 italic">Luogo: DA CONFERMARE</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Social: placeholder se non in repo/doc */}
            {isTullpukuna && (
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl text-borgogna">Seguici</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* TODO: inserire link ufficiali da doc (Instagram, Facebook, sito) quando disponibili */}
                  <p className="text-marrone-scuro/80 text-sm">
                    Instagram, Facebook e sito: link da confermare.
                  </p>
                </CardContent>
              </Card>
            )}

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

          <div className="lg:col-span-1">
            {event.remainingSeats > 0 && (
              <div className="sticky top-8">
                <BookingGate hasIdentity={hasIdentity} eventSlug={slug} locale={locale} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
