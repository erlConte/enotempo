import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMockEvents } from "@/lib/mockEvents";

export default async function CenePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("events");
  const events = getMockEvents();

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

        <div className={`grid grid-cols-1 ${events.length === 1 ? 'md:grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8`}>
          {events.map((event) => {
            const initials = event.title
              .split(" ")
              .map((word) => word[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            return (
              <Card
                key={event.slug}
                className="flex flex-col bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group"
              >
                {/* Image */}
                {event.image ? (
                  <div className="h-48 relative overflow-hidden">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="font-serif text-2xl text-borgogna flex-1">
                      {event.title}
                    </CardTitle>
                    {event.availableSeats > 0 ? (
                      <Badge className="bg-verde text-bianco-caldo ml-2 shrink-0">
                        {event.availableSeats} {t("availableSeats")}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="ml-2 shrink-0">
                        {t("soldOut")}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-marrone-scuro/80 text-base font-medium">
                    {formatDate(event.date, locale)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow space-y-4">
                  <p className="text-base text-marrone-scuro/80 flex items-start gap-2 font-medium">
                    <span className="shrink-0">📍</span>
                    <span className="line-clamp-2">{event.location}</span>
                  </p>
                  {event.price && (
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
                  <p className="text-base text-marrone-scuro/80 leading-relaxed line-clamp-3">
                    {event.shortDescription}
                  </p>
                </CardContent>

                <CardFooter className="pt-4">
                  <Link href={`/${locale}/cene/${event.slug}`} className="w-full">
                    <Button
                      className="w-full bg-borgogna text-bianco-caldo hover:bg-borgogna/90 rounded-xl py-6 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                      disabled={event.availableSeats === 0}
                    >
                      {t("details")}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

