import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEventBySlug, getEvents } from "@/lib/events";
import BookingGate from "@/components/events/BookingGate";
import { locales } from "@/lib/i18n/config";
import { hasValidSession, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const events = await getEvents();
  const slugs = events.map((e) => e.slug);
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
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

  const formatDate = (date: Date, locale: string) => {
    return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : locale === "en" ? "en-US" : "es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const initials = event.title
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-bianco-caldo">
      {/* Hero piccolo */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
          {event.image ? (
            <div className="mb-8">
              <Image
                src={event.image}
                alt={event.title}
                width={1200}
                height={800}
                className="w-full h-64 md:h-80 rounded-2xl object-cover"
              />
            </div>
          ) : null}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {!event.image && (
              <div className="w-full md:w-32 h-32 md:h-32 rounded-2xl bg-gradient-to-br from-borgogna/20 via-crema/30 to-verde/20 flex items-center justify-center shrink-0">
                <span className="text-3xl font-serif font-bold text-borgogna/40">
                  {initials}
                </span>
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
          {/* Colonna sinistra - Dettagli evento */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-borgogna">
                  Descrizione
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-marrone-scuro/90 leading-relaxed text-lg font-normal whitespace-pre-line">
                  {event.description ?? event.subtitle ?? ""}
                </p>
              </CardContent>
            </Card>

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

          {/* Colonna destra - Form prenotazione */}
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

