import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getEventBySlug, getMockEvents } from "@/lib/mockEvents";
import ReservationForm from "@/components/events/ReservationForm";
import { locales } from "@/lib/i18n/config";

export function generateStaticParams() {
  const events = getMockEvents();
  const slugs = events.map((event) => event.slug);
  // Produci combinazioni di parametri { locale, slug } per ogni lingua e evento
  return locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export default async function CenaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("events");
  const event = getEventBySlug(slug);

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
            {!event.image && slug !== "cena-di-benedizione" && (
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
                  <span>{event.location}</span>
                </p>
                {event.price && (
                  <p className="text-base md:text-lg text-marrone-scuro/80 flex items-center gap-2 font-semibold">
                    <span>💰</span>
                    <span>{event.price} €</span>
                  </p>
                )}
                {event.availableSeats > 0 ? (
                  <Badge className="bg-verde text-bianco-caldo text-sm">
                    {t("availableSeats")}: {event.availableSeats}
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
                <p className="text-marrone-scuro/90 leading-relaxed text-lg font-normal">
                  {event.fullDescription}
                </p>
              </CardContent>
            </Card>

            {/* FENAM Requirement Alert - Più evidente */}
            <Alert className="bg-borgogna/10 border-2 border-borgogna rounded-2xl shadow-md">
              <AlertDescription className="text-borgogna">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div className="flex-1">
                    <strong className="text-xl mb-3 block font-bold">{t("fenamRequired")}</strong>
                    <p className="text-base mb-4 text-borgogna/90">
                      L&rsquo;iscrizione alla FENAM è obbligatoria per partecipare alle cene Enotempo. 
                      Se non sei ancora iscritto, registrati prima di completare la prenotazione.
                    </p>
                    <Link href={`/${locale}/fenam/iscrizione`}>
                      <Button
                        className="bg-borgogna text-bianco-caldo hover:bg-borgogna/90 mt-2 rounded-xl py-3 px-6 font-semibold text-base shadow-md"
                      >
                        {t("registerFenam")} →
                      </Button>
                    </Link>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          {/* Colonna destra - Form prenotazione */}
          <div className="lg:col-span-1">
            {event.availableSeats > 0 && (
              <div className="sticky top-8">
                <ReservationForm eventSlug={slug} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

