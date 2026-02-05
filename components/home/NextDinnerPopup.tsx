"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export type NextEventSerialized = {
  title: string;
  slug: string;
  date: number; // Timestamp numerico (preserva l'ora esatta senza problemi di timezone)
  locationName: string;
  locationAddress: string | null;
};

interface NextDinnerPopupProps {
  locale: string;
  nextEvent: NextEventSerialized | null;
}

export default function NextDinnerPopup({ locale, nextEvent }: NextDinnerPopupProps) {
  const t = useTranslations("home.nextDinner");
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined" && nextEvent) {
      // Usa localStorage per-event invece che globale
      const storageKey = `enotempo-next-dinner-dismissed-${nextEvent.slug}`;
      const dismissed = localStorage.getItem(storageKey);
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, [nextEvent]);

  const handleClose = () => {
    setIsVisible(false);
    if (typeof window !== "undefined" && nextEvent) {
      // Salva per questo evento specifico
      const storageKey = `enotempo-next-dinner-dismissed-${nextEvent.slug}`;
      localStorage.setItem(storageKey, "true");
    }
  };

  const formatDate = (timestamp: number, locale: string) => {
    const date = new Date(timestamp);
    // Formatta in timezone Europe/Rome per coerenza
    return new Intl.DateTimeFormat(
      locale === "it" ? "it-IT" : locale === "en" ? "en-US" : "es-ES",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Rome", // Timezone esplicito per evitare problemi
      }
    ).format(date);
  };

  // Non renderizzare nulla se non c'è un evento futuro o se è stato chiuso
  if (!nextEvent || !isVisible || !isMounted) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto z-50 max-w-md md:max-w-sm animate-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-2xl shadow-lg bg-white/95 backdrop-blur-sm border border-borgogna/20 p-6 space-y-4">
        {/* Header con titolo e pulsante chiudi */}
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-semibold text-borgogna uppercase tracking-wide">
            {t("title")}
          </h3>
          <button
            onClick={handleClose}
            className="text-marrone-scuro/60 hover:text-marrone-scuro transition-colors p-1 -mt-1 -mr-1"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nome evento */}
        <h4 className="font-serif text-xl md:text-2xl font-bold text-borgogna">
          {nextEvent.title}
        </h4>

        {/* Data formattata */}
        <p className="text-base text-marrone-scuro/80 font-medium">
          {formatDate(nextEvent.date, locale)}
        </p>

        {/* Debug info (solo se NEXT_PUBLIC_DEBUG=1) */}
        {process.env.NEXT_PUBLIC_DEBUG === "1" && (
          <div className="text-xs text-marrone-scuro/50 border-t border-marrone-scuro/10 pt-2 mt-2">
            <p>DEBUG:</p>
            <p>Timestamp: {nextEvent.date}</p>
            <p>ISO: {new Date(nextEvent.date).toISOString()}</p>
            <p>Local: {new Date(nextEvent.date).toString()}</p>
            <p>Rome: {new Date(nextEvent.date).toLocaleString("it-IT", { timeZone: "Europe/Rome" })}</p>
          </div>
        )}

        {/* Luogo */}
        {nextEvent.locationName && (
          <p className="text-sm text-marrone-scuro/70 flex items-start gap-2">
            <span className="shrink-0">📍</span>
            <span className="line-clamp-2">
              {nextEvent.locationName}
              {nextEvent.locationAddress ? `, ${nextEvent.locationAddress}` : ""}
            </span>
          </p>
        )}

        {/* Pulsanti */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href={`/${locale}/cene/${nextEvent.slug}`} className="flex-1">
            <Button
              className="w-full bg-borgogna text-bianco-caldo hover:bg-borgogna/90 rounded-xl py-2.5 text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            >
              {t("cta")}
            </Button>
          </Link>
          <Button
            onClick={handleClose}
            variant="outline"
            className="border border-borgogna/30 text-marrone-scuro hover:bg-borgogna/10 rounded-xl py-2.5 text-sm font-medium"
          >
            {t("close")}
          </Button>
        </div>
      </div>
    </div>
  );
}

