"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CheckoutGateProps {
  eventSlug: string;
}

export default function CheckoutGate({ eventSlug }: CheckoutGateProps) {
  const t = useTranslations("events.reservation");
  const tRegole = useTranslations("regole");
  const locale = useLocale();
  const [formData, setFormData] = useState({
    rulesAccepted: false,
    dataConsent: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [dataConsentError, setDataConsentError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRulesError(null);
    setDataConsentError(null);

    if (!formData.rulesAccepted) {
      setRulesError(t("rulesAcceptError"));
      return;
    }
    if (!formData.dataConsent) {
      setDataConsentError(t("dataConsentError"));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventSlug,
          rulesAccepted: true,
          dataConsent: true,
        }),
      });
      const data = (await res.json()) as { reservationId?: string; error?: string; message?: string };

      if (!res.ok) {
        const msg = data.error ?? data.message ?? "Errore. Riprova.";
        if (res.status === 401) setError(msg);
        else if (res.status === 409) setError(msg);
        else setError(`Errore: (${res.status}) ${msg}`);
        return;
      }

      const reservationId = data.reservationId;
      if (reservationId) {
        window.location.href = `/${locale}/paga/${reservationId}`;
        return;
      }
      setError("Risposta non valida. Riprova.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto border-0 shadow-lg rounded-2xl bg-white">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 px-8 md:px-10 py-8 md:py-10">
          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-start space-x-3">
            <Checkbox
              id="rulesAccept"
              checked={formData.rulesAccepted}
              onCheckedChange={(checked) => {
                setFormData((prev) => ({ ...prev, rulesAccepted: checked === true }));
                setRulesError(null);
              }}
              className="mt-1 h-5 w-5 rounded-md border-2 border-marrone-scuro/30 data-[state=checked]:bg-borgogna data-[state=checked]:border-borgogna"
            />
            <Label htmlFor="rulesAccept" className="text-sm leading-relaxed cursor-pointer text-marrone-scuro/80">
              {t("rulesAcceptLabel")}{" "}
              <Link href={`/${locale}/regole`} className="underline text-borgogna hover:text-borgogna/80" target="_blank">
                {tRegole("title")}
              </Link>{" "}
              <span className="text-borgogna">*</span>
            </Label>
          </div>
          {rulesError && <p className="text-sm text-borgogna font-medium">{rulesError}</p>}

          <div className="flex items-start space-x-3">
            <Checkbox
              id="dataConsent"
              checked={formData.dataConsent}
              onCheckedChange={(checked) => {
                setFormData((prev) => ({ ...prev, dataConsent: checked === true }));
                setDataConsentError(null);
              }}
              className="mt-1 h-5 w-5 rounded-md border-2 border-marrone-scuro/30 data-[state=checked]:bg-borgogna data-[state=checked]:border-borgogna"
            />
            <Label htmlFor="dataConsent" className="text-sm leading-relaxed cursor-pointer text-marrone-scuro/80">
              {t("dataConsentLabel")}{" "}
              <Link href={`/${locale}/privacy`} className="underline text-borgogna hover:text-borgogna/80" target="_blank">
                {t("dataConsentLink")}
              </Link>{" "}
              <span className="text-borgogna">*</span>
            </Label>
          </div>
          {dataConsentError && <p className="text-sm text-borgogna font-medium">{dataConsentError}</p>}

          <Button
            type="submit"
            disabled={isLoading || !formData.rulesAccepted || !formData.dataConsent}
            className="w-full bg-borgogna text-bianco-caldo hover:bg-borgogna/90 rounded-xl py-6 text-lg font-semibold shadow-md"
          >
            {isLoading ? "..." : t("goToCheckout")}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
