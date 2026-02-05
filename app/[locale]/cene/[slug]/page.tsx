import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { getEventBySlug } from "@/lib/events";
import { getGallerySlice, getFilledGallery } from "@/lib/gallery";
import BookingGate from "@/components/events/BookingGate";
import EventVideo from "@/components/events/EventVideo";
import EventMenu from "@/components/events/EventMenu";
import EventMap from "@/components/events/EventMap";
import { hasValidSession, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const TULLPUKUNA_SLUG = "cena-tullpukuna";
const GALLERY_COUNT = 9;

// URL video per Cena a Tullpukuna (file in public/events/tullpukuna/)
const TULLPUKUNA_VIDEO_URL = "/events/tullpukuna/video.mp4";

const TULLPUKUNA_WHATSAPP = "+39 327 449 4282";

// Menu per Tullpukuna con abbinamenti vino separati
const TULLPUKUNA_MENU = [
  {
    course: "1)",
    dish: "Cazuela de mariscos",
    wine: "San Severo Rosato DOP",
  },
  {
    course: "2)",
    dish: "Ceviche de camarones",
    wine: "Bombino IGP",
  },
  {
    course: "3)",
    dish: "Adobado de cerdo",
    wine: "Nero di Troia IGP",
  },
  {
    course: "4)",
    dish: "Bife Angus",
    wine: "Primitivo IGP",
  },
  {
    course: "5)",
    dish: "Arroz con leche",
    wine: "San Severo Bianco DOP",
  },
];

const TULLPUKUNA_DESCRIPTIONS: Record<"it" | "en" | "es", string> = {
  es: `¡Hola!
Nos da mucho gusto invitarle a una velada muy especial, concebida como una experiencia de encuentro, sabor y diálogo. Compartiremos mesa en un ambiente cálido y elegante, para realizar un recorrido por los sabores más representativos de la cocina sudamericana, cuidadosamente maridados con vinos italianos de gran calidad.
El menú ha sido diseñado y creado especialmente para la ocasión por nuestro chef, quien ha pensado cada plato como una experiencia sensorial que une tradición, creatividad y armonía.
Será una noche dedicada al gusto, a la conversación y al encuentro entre la riqueza gastronómica de Sudamérica y la elegancia del vino italiano.
Será un verdadero honor contar con su presencia y compartir juntos esta experiencia que, estoy seguro, permanecerá en la memoria y en el corazón.
Con estima,`,
  it: `Ciao!
Siamo lieti di invitarLa a una serata davvero speciale, concepita come un’esperienza di incontro, gusto e dialogo. Condivideremo la tavola in un ambiente caldo ed elegante, per intraprendere un viaggio attraverso i sapori più rappresentativi della cucina sudamericana, accuratamente abbinati a vini italiani di grande qualità.
Il menù è stato ideato e preparato appositamente per l’occasione dal nostro chef, che ha pensato ogni piatto come un’esperienza sensoriale capace di unire tradizione, creatività e armonia.
Sarà una serata dedicata al gusto, alla conversazione e all’incontro tra la ricchezza gastronomica del Sud America e l’eleganza del vino italiano.
Sarà un vero onore poterLa avere con noi e condividere insieme questa esperienza che, ne siamo certi, rimarrà nella memoria e nel cuore.
Con stima,`,
  en: `Hello!
We are delighted to invite you to a truly special evening, designed as an experience of encounter, taste and conversation. We will share the table in a warm and elegant atmosphere, travelling through some of the most representative flavours of South American cuisine, carefully paired with high‑quality Italian wines.
The menu has been created especially for this occasion by our chef, who has conceived each course as a sensory journey that brings together tradition, creativity and harmony.
It will be a night dedicated to flavour, dialogue and the meeting between the richness of South American gastronomy and the elegance of Italian wine.
It would be an honour to welcome you and share with you an experience that, we are sure, will remain in both memory and heart.
With esteem,`,
};

function getTullpukunaDescription(locale: string): string {
  if (locale === "es") return TULLPUKUNA_DESCRIPTIONS.es;
  if (locale === "en") return TULLPUKUNA_DESCRIPTIONS.en;
  return TULLPUKUNA_DESCRIPTIONS.it;
}

function getMenuTitle(locale: string): string {
  if (locale === "es") return "Menú";
  if (locale === "en") return "Menu";
  return "Menu";
}

function getBookingCopy(locale: string): string {
  if (locale === "es") {
    return "Pago en línea obligatorio. La reserva se considera confirmada solo después del pago.";
  }
  if (locale === "en") {
    return "Online payment required. Your reservation is confirmed only once payment has been completed.";
  }
  return "Pagamento online obbligatorio. Prenotazione confermata solo dopo il pagamento.";
}

function getWhatsappCopy(locale: string): string {
  if (locale === "es") {
    return `Para cualquier información sobre disponibilidad y detalles de la velada, puedes escribirnos por WhatsApp al ${TULLPUKUNA_WHATSAPP}.`;
  }
  if (locale === "en") {
    return `For any information about availability or details of the evening, you can write to us on WhatsApp at ${TULLPUKUNA_WHATSAPP}.`;
  }
  return `Per informazioni su disponibilità e dettagli della serata, puoi scriverci su WhatsApp al ${TULLPUKUNA_WHATSAPP}.`;
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
  const eventGallery = isTullpukuna ? getFilledGallery(GALLERY_COUNT) : [];
  const heroImage = event.image ?? (eventGallery[0]?.src ?? null);
  const videoPoster = eventGallery[0]?.src ?? null;
  const menuItems = isTullpukuna ? TULLPUKUNA_MENU : [];
  const description = isTullpukuna
    ? getTullpukunaDescription(locale)
    : event.description ?? event.subtitle ?? "";

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
      <div className="container mx-auto max-w-6xl px-4 pb-16 md:pb-24 space-y-12 md:space-y-16">
        {/* 2) DESCRIZIONE - Prima di tutto */}
        {description && (
          <section>
            <div className="bg-white/90 border border-borgogna/10 rounded-3xl p-6 md:p-10 shadow-lg">
              <div className="prose prose-lg max-w-none">
                <p className="text-marrone-scuro/90 leading-relaxed text-base md:text-lg lg:text-xl whitespace-pre-line font-light">
                  {description}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 3) BLOCCO PRENOTAZIONE */}
        {event.remainingSeats > 0 && (
          <section>
            <div className="bg-gradient-to-br from-white to-borgogna/5 border-2 border-borgogna/20 rounded-3xl p-6 md:p-10 shadow-xl booking-container">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-borgogna mb-4">
                {t("reservation.title")}
              </h2>
              <p className="text-base md:text-lg text-marrone-scuro/90 mb-4 font-medium booking-description">
                {getBookingCopy(locale)}
              </p>
              {isTullpukuna && (
                <p className="text-sm md:text-base text-marrone-scuro/80 mb-6 rounded-xl bg-borgogna/5 p-3 border border-borgogna/10 booking-description">
                  {getWhatsappCopy(locale)}
                </p>
              )}
              <div className="mt-6">
                <BookingGate
                  hasIdentity={hasIdentity}
                  eventSlug={slug}
                  locale={locale}
                  simple={true}
                />
              </div>
            </div>
          </section>
        )}
            

        {/* 4) MENU - Sezione dedicata */}
        {menuItems.length > 0 && (
          <section>
            <div className="bg-white/90 border border-borgogna/10 rounded-3xl p-6 md:p-10 shadow-lg">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-borgogna mb-8">
                {getMenuTitle(locale)}
              </h2>
              <EventMenu items={menuItems} />
            </div>
          </section>
        )}

        {/* 5) REGOLE - Elenco breve */}
        <section>
          <div className="bg-white/90 border border-borgogna/10 rounded-3xl p-6 md:p-10 shadow-lg">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-borgogna mb-6">
              {tRegole("title")}
            </h2>
            <ul className="space-y-4 text-marrone-scuro/90 text-base md:text-lg">
              <li className="flex items-start gap-3">
                <span className="text-borgogna mt-1 text-xl">•</span>
                <span className="leading-relaxed">{tRegole("punctuality")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-borgogna mt-1 text-xl">•</span>
                <span className="leading-relaxed">{tRegole("allergies")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-borgogna mt-1 text-xl">•</span>
                <span className="leading-relaxed">{tRegole("extraPaid")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-borgogna mt-1 text-xl">•</span>
                <span className="leading-relaxed">{tRegole("limitedSeats")}</span>
              </li>
            </ul>
            <Link
              href={`/${locale}/regole`}
              className="inline-block text-borgogna font-semibold hover:text-borgogna/80 hover:underline mt-6 transition-colors"
            >
              {tRegole("readMore")} →
            </Link>
          </div>
        </section>

        {/* 6) MEDIA (Video + Gallery) - Solo per Tullpukuna */}
        {isTullpukuna && eventGallery.length > 0 && (
          <section>
            <div className="bg-white/90 border border-borgogna/10 rounded-3xl p-6 md:p-10 shadow-lg">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 lg:gap-10 items-end">
                {/* Colonna sinistra: Video verticale 9:16 (ridotta larghezza e altezza per allineamento con immagini) */}
                <div className="flex items-end justify-center lg:justify-start">
                  <div className="video-container">
                    <EventVideo
                      src={TULLPUKUNA_VIDEO_URL}
                      poster={videoPoster ?? undefined}
                      alt={event.title}
                      vertical={true}
                    />
                  </div>
                </div>

                {/* Colonna destra: Gallery grid con hover effects migliorati */}
                <div className="w-full gallery-container">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-5 w-full">
                    {eventGallery.map((item, idx) => (
                      <div
                        key={`${item.src}-${idx}`}
                        className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-marrone-scuro/5 shadow-md hover:shadow-xl transition-all duration-300 group gallery-item"
                      >
                        <Image
                          src={item.src}
                          alt={`${event.title} - ${item.name}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 7) MAPPA - in fondo, solo embed + link */}
        {event.locationAddress && (
          <section>
            <div className="rounded-3xl overflow-hidden shadow-lg">
              <EventMap locationName={event.locationName} locationAddress={event.locationAddress} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
