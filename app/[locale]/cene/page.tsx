import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getEventsSplit } from "@/lib/events";
import type { EventWithRemaining } from "@/lib/events";
import { getGallerySlice } from "@/lib/gallery";

// ISR: rigenera ogni 60 secondi
export const revalidate = 60;

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

function gridCols(count: number): string {
  if (count === 1) return "md:grid-cols-1 max-w-2xl mx-auto";
  if (count === 2) return "md:grid-cols-2";
  return "md:grid-cols-2 lg:grid-cols-3";
}

export default async function CenePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("events");
  const { upcoming, past } = await getEventsSplit();
  const galleryFirst = getGallerySlice(1)[0]?.src ?? null;

  function renderCard(event: EventWithRemaining, isPast: boolean) {
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
        className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-borgogna focus-visible:ring-offset-2 rounded-[2px]"
      >
        <Card className={`flex flex-col h-full bg-white border-0 shadow-md hover:shadow-2xl transition-all duration-500 rounded-[2px] overflow-hidden group-hover:-translate-y-1 ${isPast ? "opacity-75" : ""}`}>
          {heroImage ? (
            <div className="h-52 relative overflow-hidden">
              <Image
                src={heroImage}
                alt={event.title}
                fill
                className={`object-cover group-hover:scale-105 transition-transform duration-500 ${isPast ? "grayscale-[25%]" : ""}`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-borgogna/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ) : (
            <div className="h-52 bg-gradient-to-br from-borgogna/15 via-crema/40 to-verde/15 flex items-center justify-center">
              <span className="font-serif text-4xl font-medium text-borgogna/35">
                {initials}
              </span>
            </div>
          )}

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <CardTitle className="font-serif text-xl md:text-2xl text-borgogna flex-1 font-medium">
                {event.title}
              </CardTitle>
              {isPast ? (
                <Badge className="bg-marrone-scuro/60 text-bianco-caldo shrink-0 rounded-[2px]">
                  {t("pastBadge")}
                </Badge>
              ) : event.remainingSeats > 0 ? (
                <Badge className="bg-verde text-bianco-caldo shrink-0 rounded-[2px]">
                  {event.remainingSeats} {t("availableSeats")}
                </Badge>
              ) : (
                <Badge variant="destructive" className="shrink-0 rounded-[2px]">
                  {t("soldOut")}
                </Badge>
              )}
            </div>
            <CardDescription className="text-marrone-scuro/70 text-sm font-medium">
              {formatDateWithTime(event.date, locale)}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-grow space-y-2">
            <p className="text-sm text-marrone-scuro/70 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">📍</span>
              <span className="line-clamp-2">
                {event.locationName}
                {event.locationAddress ? `, ${event.locationAddress}` : ""}
              </span>
            </p>
            {event.price != null && (
              <p className="text-sm text-borgogna flex items-center gap-2 font-medium">
                <span>€</span>
                <span>{event.price}</span>
              </p>
            )}
            {microCopy ? (
              <p className="text-sm text-marrone-scuro/70 leading-relaxed line-clamp-2 pt-1">
                {microCopy}
              </p>
            ) : null}
          </CardContent>

          <CardFooter className="pt-4">
            <span className="inline-flex items-center justify-center w-full rounded-[2px] py-2.5 text-borgogna text-sm font-medium border-2 border-borgogna/25 group-hover:border-borgogna group-hover:bg-borgogna/5 transition-all duration-200">
              {isPast ? t("detailsOnly") : t("details")}
              <span className="ml-2 group-hover:translate-x-0.5 transition-transform duration-200">→</span>
            </span>
          </CardFooter>
        </Card>
      </Link>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero borgogna */}
      <section className="bg-borgogna px-4 py-16 md:py-20">
        <div className="container mx-auto max-w-6xl text-center">
          <Eyebrow className="text-verde/70 mb-4">Esperienze</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-crema">
            {t("title")}
          </h1>
          {upcoming.length === 0 && past.length > 0 && (
            <p className="text-crema/60 text-base md:text-lg mt-4 max-w-xl mx-auto">
              {t("noUpcoming")}
            </p>
          )}
        </div>
      </section>

      {/* Prossime cene */}
      {upcoming.length > 0 && (
        <Section bg="bianco-caldo" py="md">
          {past.length > 0 && (
            <SectionHeading
              title={t("upcomingSection")}
              align="left"
              className="mb-10"
            />
          )}
          <div className={`grid grid-cols-1 ${gridCols(upcoming.length)} gap-8`}>
            {upcoming.map((event) => renderCard(event, false))}
          </div>
        </Section>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <Section bg="bianco-caldo" py="md">
          <p className="text-center text-marrone-scuro/50 py-16">{t("noUpcoming")}</p>
        </Section>
      )}

      {/* Cene passate */}
      {past.length > 0 && (
        <Section bg="crema" py="md">
          <SectionHeading
            title={t("pastSection")}
            align="left"
            className="mb-10"
            titleClassName="text-borgogna/55"
          />
          <div className={`grid grid-cols-1 ${gridCols(past.length)} gap-8`}>
            {past.map((event) => renderCard(event, true))}
          </div>
        </Section>
      )}
    </div>
  );
}
