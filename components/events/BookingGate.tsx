"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CheckoutGate from "./CheckoutGate";

interface BookingGateProps {
  hasIdentity: boolean;
  eventSlug: string;
  locale: string;
}

export default function BookingGate({ hasIdentity, eventSlug, locale }: BookingGateProps) {
  const t = useTranslations("auth.fenam");
  const tEvents = useTranslations("events");

  if (!hasIdentity) {
    const returnUrl = `/${locale}/cene/${eventSlug}`;
    return (
      <Card className="border-0 shadow-lg rounded-2xl bg-white">
        <CardHeader className="pb-4 px-8 pt-8">
          <CardTitle className="font-serif text-2xl text-borgogna">
            {tEvents("reservation.title")}
          </CardTitle>
          <p className="text-marrone-scuro/80 mt-2">{t("gateMessage")}</p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Link href={`/${locale}/accedi-fenam?returnUrl=${encodeURIComponent(returnUrl)}`}>
            <Button className="w-full bg-borgogna text-bianco-caldo hover:bg-borgogna/90 rounded-xl py-7 text-lg font-semibold shadow-md">
              {t("cta")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <CheckoutGate eventSlug={eventSlug} />;
}
