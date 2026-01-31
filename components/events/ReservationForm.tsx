"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReservationFormProps {
  eventSlug: string;
}

export default function ReservationForm({ eventSlug }: ReservationFormProps) {
  const t = useTranslations("events.reservation");
  const tRegole = useTranslations("regole");
  const locale = useLocale();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    participants: "1",
    notes: "",
    rulesAccepted: false,
    dataConsent: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [dataConsentError, setDataConsentError] = useState<string | null>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validateEmail = (value: string) => {
    if (!value) return "Inserisci un indirizzo email valido.";
    if (!emailRegex.test(value)) return "Inserisci un indirizzo email valido.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setRulesError(null);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError("Tutti i campi obbligatori devono essere compilati.");
      return;
    }

    const emailValidationError = validateEmail(formData.email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    if (!formData.rulesAccepted) {
      setRulesError(t("rulesAcceptError"));
      return;
    }

    if (!formData.dataConsent) {
      setDataConsentError(t("dataConsentError"));
      return;
    }
    setDataConsentError(null);

    setIsLoading(true);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          eventSlug,
          dataConsent: true,
        }),
      });

      if (!response.ok) {
        let message = "Richiesta non valida.";
        try {
          const data = (await response.json()) as { message?: string; error?: string };
          message = data.error ?? data.message ?? message;
        } catch {
          // ignore JSON parse errors
        }
        if (response.status === 401) {
          setError(message);
          return;
        }
        if (response.status === 409) {
          setError(message);
          return;
        }
        setError(`Errore prenotazione: (${response.status}) ${message}`);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="pt-6">
          <Alert className="mb-6 bg-verde/10 border-verde rounded-xl">
            <AlertDescription className="text-verde font-semibold">
              {t("success")}
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Link href={`/${locale}/donazione/cena/${eventSlug}`}>
              <Button className="bg-borgogna text-bianco-caldo hover:bg-borgogna/90 rounded-xl w-full">
                {t("goToDonation")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg rounded-2xl bg-white">
      <CardHeader className="pb-6 px-8 pt-8">
        <CardTitle className="text-3xl font-serif text-borgogna">
          {t("title")}
        </CardTitle>
        <p className="text-sm text-marrone-scuro/70 mt-2">
          Compila tutti i campi per completare la prenotazione
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-8 px-8">
          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="firstName" className="text-base font-semibold text-marrone-scuro">
                {t("firstName")} <span className="text-borgogna">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
                className="h-12 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna focus:ring-2 focus:ring-borgogna/20 transition-all duration-200 text-base px-4"
                placeholder="Nome"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="lastName" className="text-base font-semibold text-marrone-scuro">
                {t("lastName")} <span className="text-borgogna">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
                className="h-12 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna focus:ring-2 focus:ring-borgogna/20 transition-all duration-200 text-base px-4"
                placeholder="Cognome"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-base font-semibold text-marrone-scuro">
                {t("email")} <span className="text-borgogna">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                onBlur={() => {
                  const validationError = validateEmail(formData.email);
                  setEmailError(validationError);
                }}
                required
                className="h-12 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna focus:ring-2 focus:ring-borgogna/20 transition-all duration-200 text-base px-4"
                placeholder="nome@esempio.com"
              />
              {emailError && (
                <p className="text-sm text-borgogna font-medium">{emailError}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-base font-semibold text-marrone-scuro">
                {t("phone")} <span className="text-borgogna">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                className="h-12 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna focus:ring-2 focus:ring-borgogna/20 transition-all duration-200 text-base px-4"
                placeholder="+39 123 456 7890"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="participants" className="text-base font-semibold text-marrone-scuro">
              {t("participants")} <span className="text-borgogna">*</span>
            </Label>
            <select
              id="participants"
              value={formData.participants}
              onChange={(e) =>
                setFormData({ ...formData, participants: e.target.value })
              }
              className="flex h-12 w-full rounded-xl border-2 border-marrone-scuro/20 bg-background px-4 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borgogna/20 focus-visible:border-borgogna transition-all duration-200"
              required
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num.toString()}>
                  {num} {num === 1 ? "persona" : "persone"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-semibold text-marrone-scuro">
              {t("notes")}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
              className="rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna focus:ring-2 focus:ring-borgogna/20 transition-all duration-200 text-base px-4 py-3"
              placeholder="Note aggiuntive (allergie, preferenze alimentari, ecc.)"
            />
          </div>

          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="rulesAccept"
              checked={formData.rulesAccepted}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, rulesAccepted: checked === true });
                setRulesError(null);
              }}
              className="mt-1 h-5 w-5 rounded-md border-2 border-marrone-scuro/30 data-[state=checked]:bg-borgogna data-[state=checked]:border-borgogna"
            />
            <Label
              htmlFor="rulesAccept"
              className="text-sm leading-relaxed cursor-pointer text-marrone-scuro/80"
            >
              {t("rulesAcceptLabel")}{" "}
              <Link
                href={`/${locale}/regole`}
                className="underline text-borgogna hover:text-borgogna/80"
                target="_blank"
              >
                {tRegole("title")}
              </Link>{" "}
              <span className="text-borgogna">*</span>
            </Label>
          </div>
          {rulesError && (
            <p className="text-sm text-borgogna font-medium">{rulesError}</p>
          )}

          <div className="space-y-2 pt-2">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="dataConsent"
                checked={formData.dataConsent}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, dataConsent: checked === true });
                  setDataConsentError(null);
                }}
                className="mt-1 h-5 w-5 rounded-md border-2 border-marrone-scuro/30 data-[state=checked]:bg-borgogna data-[state=checked]:border-borgogna"
              />
              <Label
                htmlFor="dataConsent"
                className="text-sm leading-relaxed cursor-pointer text-marrone-scuro/80"
              >
                {t("dataConsentLabel")}{" "}
                <Link
                  href={`/${locale}/privacy`}
                  className="underline text-borgogna hover:text-borgogna/80"
                  target="_blank"
                >
                  {t("dataConsentLink")}
                </Link>{" "}
                <span className="text-borgogna">*</span>
              </Label>
            </div>
            {dataConsentError && (
              <p className="text-sm text-borgogna font-medium ml-8">{dataConsentError}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-6 pb-8 px-8">
          <Button
            type="submit"
            disabled={isLoading || !formData.rulesAccepted}
            className="w-full bg-borgogna text-bianco-caldo hover:bg-borgogna/90 rounded-xl py-7 text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isLoading ? "Invio in corso..." : t("submit")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
