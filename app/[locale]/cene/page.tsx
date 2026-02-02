import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEvents } from "@/lib/events";
import { getGallerySlice } from "@/lib/gallery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TULLPUKUNA_SLUG = "cena-tullpukuna";

function formatDateWithTime(date: Date, locale: string): string {
  const dtf = new Intl.DateTimeFormat(
    locale === "it" ? "it-IT" : locale === "en" ? "en-US" : "es-ES",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
  return dtf.format(date).replace(/, (\d{1,2}:\d{2})/, " — $1");
}

export default async function CenePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("events");
  const events = await getEvents();
  const galleryFirst = getGallerySlice(1)[0]?.src ?? null;

  return (
    <div className="min-h-screen bg-bianco-caldo py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-borgogna mb-6">
            {t("title")}
          </h1>
          <p className="text-lg md:text-xl text-marrone-scuro/70 max-w-2xl mx-auto">
            Scopri le prossime esperienze enogastronomiche e prenota il tuo posto
          </p>
        </div>

        <div
          className={`grid grid-cols-1 ${events.length === 1 ? "md:grid-cols-1 max-w-2xl mx-auto" : "md:grid-cols-2 lg:grid-cols-3"} gap-8`}
        >
          {events.map((event) => {
            const heroImage =
              event.image ?? (event.slug === TULLPUKUNA_SLUG ? galleryFirst : null);
            const initials = event.title
              .split(" ")
              .map((word) => word[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();
            const microCopy =
              event.subtitle ?? (event.description ? event.description.split("\n")[0] : "") ?? "";
            const eventHref = `/${locale}/cene/${event.slug}`;

            return (
              <Link
                key={event.slug}
                href={eventHref}
                className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-borgogna focus-visible:ring-offset-2 rounded-2xl"
              >
                <Card className="flex flex-col h-full bg-white border-0 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group-hover:-translate-y-0.5">
                  {heroImage ? (
                    <div className="h-48 relative overflow-hidden">
                      <Image
                        src={heroImage}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-borgogna/20 via-crema/30 to-verde/20 flex items-center justify-center">
                      <span className="text-4xl font-serif font-bold text-borgogna/40">
                        {initials}
                      </span>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="font-serif text-2xl text-borgogna flex-1">
                        {event.title}
                      </CardTitle>
                      {event.remainingSeats > 0 ? (
                        <Badge className="bg-verde text-bianco-caldo shrink-0">
                          {event.remainingSeats} {t("availableSeats")}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="shrink-0">
                          {t("soldOut")}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-marrone-scuro/80 text-base font-medium">
                      {formatDateWithTime(event.date, locale)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-grow space-y-3">
                    <p className="text-base text-marrone-scuro/80 flex items-start gap-2 font-medium">
                      <span className="shrink-0">📍</span>
                      <span className="line-clamp-2">
                        {event.locationName}
                        {event.locationAddress ? `, ${event.locationAddress}` : ""}
                      </span>
                    </p>
                    {event.price != null && (
                      <p className="text-base text-marrone-scuro/80 flex items-center gap-2 font-semibold">
                        <span>💰</span>
                        <span>{event.price} €</span>
                      </p>
                    )}
                    {event.chef && (
                      <p className="text-sm text-marrone-scuro/70 flex items-center gap-2">
                        <span>👨‍🍳</span>
                        <span>{event.chef}</span>
                      </p>
                    )}
                    {microCopy ? (
                      <p className="text-base text-marrone-scuro/80 leading-relaxed line-clamp-2">
                        {microCopy}
                      </p>
                    ) : null}
                  </CardContent>

                  <CardFooter className="pt-4">
                    <span className="inline-flex items-center justify-center w-full rounded-xl py-3 text-borgogna font-semibold border-2 border-borgogna/30 group-hover:border-borgogna/60 group-hover:bg-borgogna/5 transition-colors">
                      {t("details")}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
