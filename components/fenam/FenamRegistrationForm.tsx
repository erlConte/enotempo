// NOTE: I dati FENAM vengono salvati nella tabella FenamMember
// tramite Prisma. Non usiamo sessioni o cookie: la membership
// viene verificata di volta in volta via API partendo dall'email.

"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FenamRegistrationForm() {
  const t = useTranslations("fenam.form");
  const locale = useLocale();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    taxCode: "",
    dataConsent: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataConsentError, setDataConsentError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validazione base
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError("Tutti i campi obbligatori devono essere compilati.");
      return;
    }

    if (!formData.dataConsent) {
      setDataConsentError(t("dataConsentError"));
      return;
    }
    setDataConsentError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Inserisci un indirizzo email valido.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/fenam/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          taxCode: formData.taxCode,
          locale,
          dataConsent: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Errore durante l&rsquo;invio della richiesta.";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
      } else {
        throw new Error(data.error || "Errore durante la registrazione.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Si è verificato un errore. Riprova più tardi.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-0 shadow-sm rounded-2xl bg-white">
        <CardContent className="pt-6">
          <Alert className="mb-6 bg-verde/10 border-verde rounded-xl">
            <AlertDescription className="text-verde font-semibold">
              {t("success")}
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Link href={`/${locale}/donazione/fenam`}>
              <Button className="bg-marrone-scuro text-bianco-caldo hover:bg-marrone-scuro/90 rounded-xl w-full py-6 text-lg">
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
        <CardTitle className="text-3xl font-serif text-marrone-scuro mb-3">
          {t("title")}
        </CardTitle>
        <p className="text-base text-marrone-scuro/70 leading-relaxed">
          Compila il modulo per iscriverti alla Federazione Nazionale di Associazioni Multiculturali (FENAM)
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

          <div className="space-y-3">
            <Label htmlFor="email" className="text-base font-semibold text-marrone-scuro">
              {t("email")} <span className="text-borgogna">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="h-12 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna focus:ring-2 focus:ring-borgogna/20 transition-all duration-200 text-base px-4"
              placeholder="nome@esempio.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="space-y-3">
              <Label htmlFor="taxCode" className="text-base font-semibold text-marrone-scuro">
                {t("taxCode")}
              </Label>
              <Input
                id="taxCode"
                value={formData.taxCode}
                onChange={(e) =>
                  setFormData({ ...formData, taxCode: e.target.value })
                }
                className="h-12 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna focus:ring-2 focus:ring-borgogna/20 transition-all duration-200 text-base px-4"
                placeholder="Codice fiscale (opzionale)"
              />
            </div>
          </div>

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

          <div className="bg-borgogna/5 border border-borgogna/20 rounded-xl p-4 mt-4">
            <p className="text-sm text-marrone-scuro/80 leading-relaxed">
              {t("donationNote")}
            </p>
          </div>
        </CardContent>
        <CardFooter className="pt-6 pb-8 px-8">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-marrone-scuro text-bianco-caldo hover:bg-marrone-scuro/90 rounded-xl py-7 text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isLoading ? "Invio in corso..." : t("submit")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

