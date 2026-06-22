import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getEventBySlug, isEventBookable } from "@/lib/events";
import { getGallerySlice, getFilledGallery } from "@/lib/gallery";
import BookingGate from "@/components/events/BookingGate";
import EventMenu from "@/components/events/EventMenu";
import EventMap from "@/components/events/EventMap";
import MenuGallery from "@/components/events/MenuGallery";
import ImageLightbox from "@/components/events/ImageLightbox";
import SeatsProgressBar from "@/components/events/SeatsProgressBar";
import VideoWithModal from "@/components/events/VideoWithModal";
import { hasValidSession, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";
import type { Metadata } from "next";
import { Clock, MapPin, Euro, Users, AlertCircle, CreditCard, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const TULLPUKUNA_SLUG = "cena-tullpukuna";
const GALLERY_COUNT = 9;

const TULLPUKUNA_VIDEO_URL = "https://qxuhqfbetljqqcvfsrls.supabase.co/storage/v1/object/sign/media/enotempo%20video.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xMDZmZjRmZS04ZGEyLTQ1YjEtYWM0MC1mYmIwYjM1NTc5ZTgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtZWRpYS9lbm90ZW1wbyB2aWRlby5tcDQiLCJpYXQiOjE3NzAzMDUwMjcsImV4cCI6MzMzMDYzMDUwMjd9.rkj9MZVDLusJF3775oeoDuZred3ZbVGVrzAzehWAQbQ";

const TULLPUKUNA_WHATSAPP = "+39 327 449 4282";

const TULLPUKUNA_MENU_IMAGES: Array<{ src: string; name: string; alt?: string }> = [
  // TODO: aggiungere path immagini dopo caricamento
];

const TULLPUKUNA_MENU = [
  { course: "1)", dish: "Cazuela de mariscos", wine: "San Severo Rosato DOP" },
  { course: "2)", dish: "Ceviche de camarones", wine: "Bombino IGP" },
  { course: "3)", dish: "Adobado de cerdo", wine: "Nero di Troia IGP" },
  { course: "4)", dish: "Bife Angus", wine: "Primitivo IGP" },
  { course: "5)", dish: "Arroz con leche", wine: "San Severo Bianco DOP" },
];

const TULLPUKUNA_DESCRIPTIONS: Record<"it" | "en" | "es", string> = {
  es: `Nos da mucho gusto invitarle a una velada muy especial, concebida como una experiencia de encuentro, sabor y diálogo. Compartiremos mesa en un ambiente cálido y elegante, para realizar un recorrido por los sabores más representativos de la cocina sudamericana, cuidadosamente maridados con vinos italianos de gran calidad.
El menú ha sido diseñado y creado especialmente para la ocasión por nuestro chef, quien ha pensado cada plato como una experiencia sensorial que une tradición, creatividad y armonía.
Será una noche dedicada al gusto, a la conversación y al encuentro entre la riqueza gastronómica de Sudamérica y la elegancia del vino italiano.
Será un verdadero honor contar con su presencia y compartir juntos esta experiencia que, estoy seguro, permanecerá en la memoria y en el corazón.
Con estima,`,
  it: `
Siamo lieti di invitarLa a una serata davvero speciale, concepita come un'esperienza di incontro, gusto e dialogo. Condivideremo la tavola in un ambiente caldo ed elegante, per intraprendere un viaggio attraverso i sapori più rappresentativi della cucina sudamericana, accuratamente abbinati a vini italiani di grande qualità.
Il menù è stato ideato e preparato appositamente per l'occasione dal nostro chef, che ha pensato ogni piatto come un'esperienza sensoriale capace di unire tradizione, creatività e armonia.
Sarà una serata dedicata al gusto, alla conversazione e all'incontro tra la ricchezza gastronomica del Sud America e l'eleganza del vino italiano.
Sarà un vero onore poterLa avere con noi e condividere insieme questa esperienza che, ne siamo certi, rimarrà nella memoria e nel cuore.
Con stima,`,
  en: `We are delighted to invite you to a truly special evening, designed as an experience of encounter, taste and conversation. We will share the table in a warm and elegant atmosphere, travelling through some of the most representative flavours of South American cuisine, carefully paired with high‑quality Italian wines.
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
  return locale === "es" ? "Menú" : "Menu";
}

function getBookingCopy(locale: string): string {
  if (locale === "es") return "Pago en línea obligatorio. La reserva se considera confirmada solo después del pago.";
  if (locale === "en") return "Online payment required. Your reservation is confirmed only once payment has been completed.";
  return "Pagamento online obbligatorio. Prenotazione confermata solo dopo il pagamento.";
}

function getWhatsappCopy(locale: string): string {
  if (locale === "es") return `Para cualquier información sobre disponibilidad y detalles de la velada, puedes escribirnos por WhatsApp al ${TULLPUKUNA_WHATSAPP}.`;
  if (locale === "en") return `For any information about availability or details of the evening, you can write to us on WhatsApp at ${TULLPUKUNA_WHATSAPP}.`;
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

  const title = `${event.title} — ${formatDateShort(event.date, locale)} ${formatTime(event.date)}`;
  const description = [
    event.title,
    formatDateShort(event.date, locale),
    formatTime(event.date),
    event.price != null ? `${event.price} €` : "",
    "Pagamento online obbligatorio.",
  ].filter(Boolean).join(" · ");

  const baseUrl = buildBaseUrl();
  const pathname = `/${locale}/cene/${slug}`;
  const canonicalUrl = baseUrl ? `${baseUrl}${pathname}` : pathname;
  const gallery = getGallerySlice(1);
  const ogImageRaw = gallery[0]?.src ?? null;
  const ogImage =
    ogImageRaw && !ogImageRaw.startsWith("http")
      ? `${buildBaseUrl()}${ogImageRaw.startsWith("/") ? "" : "/"}${ogImageRaw}`
      : ogImageRaw;

  return {
    title,
    description,
    keywords: ["enotempo", "cena", "evento", "vino", "cucina", "prenotazione", event.title.toLowerCase(), formatDateShort(event.date, locale).toLowerCase()].filter(Boolean).join(", "),
    authors: [{ name: "ENOTEMPO" }],
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalUrl,
      siteName: "ENOTEMPO",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: event.title, type: "image/jpeg" }] : undefined,
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : "es_ES",
    },
    twitter: { card: "summary_large_image", title, description, images: ogImage ? [ogImage] : undefined, creator: "@enotempo", site: "@enotempo" },
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
  };
}

function formatDateShort(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : locale === "en" ? "en-US" : "es-ES", {
    day: "numeric", month: "long", timeZone: "Europe/Rome",
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }).format(date);
}

function formatDateWithTime(date: Date, loc: string): string {
  return new Intl.DateTimeFormat(loc === "it" ? "it-IT" : loc === "en" ? "en-US" : "es-ES", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome",
  }).format(date).replace(/, (\d{1,2}:\d{2})/, " — $1");
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

  if (!event) notFound();

  const bookable = isEventBookable(event);
  const isPast = event.date < new Date();

  const isTullpukuna = slug === TULLPUKUNA_SLUG;
  const eventGallery = isTullpukuna ? getFilledGallery(GALLERY_COUNT) : [];
  const heroImage = event.image ?? (eventGallery[0]?.src ?? null);
  const videoPoster = eventGallery[0]?.src ?? null;
  const menuItems = isTullpukuna ? TULLPUKUNA_MENU : [];
  const description = isTullpukuna ? getTullpukunaDescription(locale) : event.description ?? event.subtitle ?? "";

  return (
    <div className="min-h-screen bg-bianco-caldo">
      {/* JSON-LD */}
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
              ...(event.locationAddress ? { location: { "@type": "Place", name: event.locationName, address: event.locationAddress } } : {}),
            }),
          }}
        />
      )}

      {/* ── HERO: immagine + info ────────────────────────────────────── */}
      <section className="w-full">
        {heroImage && (
          <div className="relative w-full max-h-[500px] overflow-hidden bg-borgogna/10">
            <div className="relative w-full aspect-[4/5] md:aspect-[21/9] max-h-[500px]">
              <Image
                src={heroImage}
                alt={event.title}
                fill
                className={`object-cover ${isPast ? "grayscale-[20%]" : ""}`}
                priority
                sizes="100vw"
              />
            </div>
          </div>
        )}

        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-borgogna">
              {event.title}
            </h1>
            {isPast && (
              <Badge className="bg-marrone-scuro/60 text-bianco-caldo text-sm rounded-[2px]">
                {t("pastBadge")}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base text-marrone-scuro/70">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-borgogna/70" />
              <span>{formatDateWithTime(event.date, locale)}</span>
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-borgogna/70" />
              <span>{event.locationName}{event.locationAddress ? `, ${event.locationAddress}` : ""}</span>
            </span>
            {event.price != null && (
              <span className="flex items-center gap-2 font-medium text-borgogna">
                <Euro className="w-4 h-4" />
                <span>{event.price} €</span>
              </span>
            )}
            {!isPast && event.remainingSeats > 0 && (
              <span className="flex items-center gap-2 font-medium text-verde">
                <Users className="w-4 h-4" />
                <span>{event.remainingSeats} posti disponibili</span>
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 pb-16 md:pb-24 space-y-12 md:space-y-16">
        {/* ── Descrizione ─────────────────────────────────────────────── */}
        {description && (
          <section>
            <p className="text-marrone-scuro/85 leading-relaxed text-base md:text-lg lg:text-xl whitespace-pre-line font-light max-w-4xl">
              {description}
            </p>
          </section>
        )}

        {/* ── Prenotazione / Banner conclusa ──────────────────────────── */}
        {bookable ? (
          <section className="video-map-reservation-container">
            {isTullpukuna && eventGallery.length > 0 && (
              <div className="video-section">
                <VideoWithModal videoUrl={TULLPUKUNA_VIDEO_URL} poster={videoPoster ?? undefined} />
              </div>
            )}
            {event.locationAddress && (
              <div className="map-container">
                <div className="rounded-[2px] overflow-hidden shadow-md h-full">
                  <EventMap locationName={event.locationName} locationAddress={event.locationAddress} />
                </div>
              </div>
            )}
            <div className="reservation-form-container">
              <div className="bg-gradient-to-br from-white via-borgogna/5 to-borgogna/10 border border-borgogna/20 rounded-[2px] p-4 md:p-6 shadow-lg booking-container relative overflow-visible">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #581D27 1px, transparent 0)", backgroundSize: "40px 40px" }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-borgogna/10 rounded-[2px]">
                      <CreditCard className="w-5 h-5 text-borgogna" />
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl font-medium text-borgogna">
                      {t("reservation.title")}
                    </h2>
                  </div>
                  <div className="mb-6">
                    <SeatsProgressBar remainingSeats={event.remainingSeats} capacity={event.capacity} />
                  </div>
                  <div className="bg-white/80 rounded-[2px] p-4 md:p-5 mb-6 border border-borgogna/15">
                    <p className="text-sm md:text-base text-marrone-scuro/85 mb-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-borgogna mt-0.5 shrink-0" />
                      <span>{getBookingCopy(locale)}</span>
                    </p>
                    {isTullpukuna && (
                      <p className="text-xs md:text-sm text-marrone-scuro/70 flex items-start gap-2">
                        <MessageCircle className="w-4 h-4 text-borgogna mt-0.5 shrink-0" />
                        <span>{getWhatsappCopy(locale)}</span>
                      </p>
                    )}
                  </div>
                  <div className="mt-5">
                    <BookingGate hasIdentity={hasIdentity} eventSlug={slug} locale={locale} simple={true} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : isPast ? (
          <>
            <section>
              <div className="bg-marrone-scuro/5 border border-marrone-scuro/15 rounded-[2px] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-2 text-center md:text-left">
                  <Badge className="bg-marrone-scuro/60 text-bianco-caldo w-fit mx-auto md:mx-0 text-sm rounded-[2px] px-3 py-1">
                    {t("pastBadge")}
                  </Badge>
                  <p className="text-marrone-scuro/55 text-sm">{formatDateWithTime(event.date, locale)}</p>
                </div>
                <Link
                  href={`/${locale}/cene`}
                  className="inline-flex items-center gap-2 rounded-[2px] bg-borgogna text-bianco-caldo px-6 py-2.5 text-sm font-medium hover:bg-borgogna/90 transition-colors shrink-0"
                >
                  {t("discoverUpcoming")} →
                </Link>
              </div>
            </section>
            {isTullpukuna && eventGallery.length > 0 && (
              <section className="max-w-3xl mx-auto">
                <VideoWithModal videoUrl={TULLPUKUNA_VIDEO_URL} poster={videoPoster ?? undefined} />
              </section>
            )}
          </>
        ) : null}

        {/* ── Menu ────────────────────────────────────────────────────── */}
        {menuItems.length > 0 && (
          <section>
            <SectionHeading
              eyebrow="Gastronomia"
              title={getMenuTitle(locale)}
              align="left"
              className="mb-8"
            />
            <EventMenu items={menuItems} />
            {isTullpukuna && TULLPUKUNA_MENU_IMAGES.length > 0 && (
              <div className="mt-10 pt-10 border-t border-borgogna/10">
                <MenuGallery
                  images={TULLPUKUNA_MENU_IMAGES}
                  title={locale === "es" ? "Imágenes del Menú" : locale === "en" ? "Menu Images" : "Immagini del Menu"}
                />
              </div>
            )}
          </section>
        )}

        {/* ── Regole ──────────────────────────────────────────────────── */}
        <section className="bg-white/60 border border-borgogna/10 rounded-[2px] p-6 md:p-10">
          <SectionHeading
            title={tRegole("title")}
            align="left"
            className="mb-8"
          />
          <ul className="space-y-5 text-marrone-scuro/85 text-base md:text-lg">
            {[
              { icon: Clock, text: tRegole("punctuality") },
              { icon: AlertCircle, text: tRegole("allergies") },
              { icon: Euro, text: tRegole("extraPaid") },
              { icon: Users, text: tRegole("limitedSeats") },
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

        {/* ── Gallery ─────────────────────────────────────────────────── */}
        {isTullpukuna && eventGallery.length > 0 && (
          <section>
            <div className="w-full gallery-container">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 w-full">
                {eventGallery.map((item, idx) => (
                  <ImageLightbox
                    key={`${item.src}-${idx}`}
                    images={eventGallery.map(g => ({ src: g.src, name: g.name, alt: `${event.title} - ${g.name}` }))}
                    initialIndex={idx}
                    trigger={
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-borgogna/5 shadow-sm hover:shadow-md transition-all duration-300 group gallery-item cursor-pointer">
                        <Image
                          src={item.src}
                          alt={`${event.title} - ${item.name}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-borgogna/0 group-hover:bg-borgogna/20 transition-colors duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-borgogna/90 text-crema px-3 py-1.5 rounded-[2px] text-xs font-medium">
                              Clicca per ingrandire
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
