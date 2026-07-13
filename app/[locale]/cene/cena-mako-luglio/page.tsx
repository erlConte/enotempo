import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Clock, MapPin, MessageCircle } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import EventMap from "@/components/events/EventMap";
import { MAKO_EVENT } from "@/lib/mako-event";

function formatDateShort(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : locale === "en" ? "en-US" : "es-ES", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Rome",
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(date);
}

function formatDateWithTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(
    locale === "it" ? "it-IT" : locale === "en" ? "en-US" : "es-ES",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Rome",
    }
  )
    .format(date)
    .replace(/, (\d{1,2}:\d{2})/, " — $1");
}

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
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = `${MAKO_EVENT.title} — ${formatDateShort(MAKO_EVENT.date, locale)} ${formatTime(MAKO_EVENT.date)}`;
  const description = [
    MAKO_EVENT.title,
    formatDateShort(MAKO_EVENT.date, locale),
    formatTime(MAKO_EVENT.date),
  ]
    .filter(Boolean)
    .join(" · ");

  const baseUrl = buildBaseUrl();
  const pathname = `/${locale}/cene/cena-mako-luglio`;
  const canonicalUrl = baseUrl ? `${baseUrl}${pathname}` : pathname;
  const ogImageUrl = `${buildBaseUrl()}/makodish.jpg`;

  return {
    title,
    description,
    keywords: [
      "enotempo",
      "cena",
      "evento",
      "vino",
      "cucina",
      "prenotazione",
      MAKO_EVENT.title.toLowerCase(),
      formatDateShort(MAKO_EVENT.date, locale).toLowerCase(),
    ]
      .filter(Boolean)
      .join(", "),
    authors: [{ name: "ENOTEMPO" }],
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalUrl,
      siteName: "ENOTEMPO",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: MAKO_EVENT.title,
          type: "image/jpeg",
        },
      ],
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      creator: "@enotempo",
      site: "@enotempo",
    },
    alternates: { canonical: canonicalUrl },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function MakoCenaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("events");
  const tRegole = await getTranslations("regole");

  return (
    <div className="min-h-screen bg-bianco-caldo">
      {/* ── HERO: immagine + info ────────────────────────────────────── */}
      <section className="w-full">
        {MAKO_EVENT.image && (
          <div className="relative w-full max-h-[500px] overflow-hidden bg-borgogna/10">
            <div className="relative w-full aspect-[4/5] md:aspect-[21/9] max-h-[500px]">
              <Image
                src={MAKO_EVENT.image}
                alt={MAKO_EVENT.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
          </div>
        )}

        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-borgogna">
              {MAKO_EVENT.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base text-marrone-scuro/70">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-borgogna/70" />
              <span>{formatDateWithTime(MAKO_EVENT.date, locale)}</span>
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-borgogna/70" />
              <span>
                {MAKO_EVENT.locationName}
                {MAKO_EVENT.locationAddress ? `, ${MAKO_EVENT.locationAddress}` : ""}
              </span>
            </span>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 pb-16 md:pb-24 space-y-12 md:space-y-16">
        {/* ── Descrizione ─────────────────────────────────────────────── */}
        <section>
          <p className="text-marrone-scuro/85 leading-relaxed text-base md:text-lg lg:text-xl whitespace-pre-line font-light max-w-4xl">
            {MAKO_EVENT.description}
          </p>
        </section>

        {/* ── Mappa + Prenotazione WhatsApp ──────────────────────────── */}
        <section className="video-map-reservation-container">
          {MAKO_EVENT.locationAddress && (
            <div className="map-container">
              <div className="rounded-[2px] overflow-hidden shadow-md h-full">
                <EventMap
                  locationName={MAKO_EVENT.locationName}
                  locationAddress={MAKO_EVENT.locationAddress}
                />
              </div>
            </div>
          )}

          <div className="reservation-form-container">
            <div className="bg-gradient-to-br from-white via-borgogna/5 to-borgogna/10 border border-borgogna/20 rounded-[2px] p-4 md:p-6 shadow-lg booking-container relative overflow-visible">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, #581D27 1px, transparent 0)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-borgogna/10 rounded-[2px]">
                    <MessageCircle className="w-5 h-5 text-borgogna" />
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl font-medium text-borgogna">
                    Prenotazioni
                  </h2>
                </div>
                <p className="text-marrone-scuro/85 text-base md:text-lg leading-relaxed mb-6">
                  Posti limitati, si consiglia di prenotare in anticipo. Prenotazioni
                  via WhatsApp al numero {MAKO_EVENT.whatsapp}.
                </p>
                <a
                  href={`https://wa.me/${MAKO_EVENT.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center w-full rounded-xl bg-borgogna text-crema py-4 px-6 text-base font-semibold shadow-lg hover:bg-borgogna/90 transition-colors duration-200"
                >
                  Contattaci su WhatsApp
                </a>
                <p className="text-sm text-marrone-scuro/70 mt-4">
                  Ti risponderemo al più presto per confermare la tua partecipazione.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Regole ──────────────────────────────────────────────────── */}
        <section className="bg-white/60 border border-borgogna/10 rounded-[2px] p-6 md:p-10">
          <SectionHeading title={tRegole("title")} align="left" className="mb-8" />
          <ul className="space-y-5 text-marrone-scuro/85 text-base md:text-lg">
            {[
              { icon: Clock, text: tRegole("punctuality") },
              { icon: MessageCircle, text: tRegole("allergies") },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-4">
                <div className="p-2 bg-borgogna/8 rounded-[2px] shrink-0">
                  <Icon className="w-4 h-4 text-borgogna" />
                </div>
                <span className="leading-relaxed pt-1">{text}</span>
              </li>
            ))}
          </ul>
          <Link
            href={`/${locale}/regole`}
            className="inline-flex items-center gap-2 text-borgogna text-sm font-medium hover:underline mt-8 transition-colors"
          >
            {tRegole("readMore")} →
          </Link>
        </section>
      </div>
    </div>
  );
}
