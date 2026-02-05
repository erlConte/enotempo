"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isPlaceholderEmail } from "@/lib/fenam-handoff";

interface ReservationFormProps {
  eventSlug: string;
}

type MeResponse = {
  hasIdentity: boolean;
  member?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
};

export default function ReservationForm({ eventSlug }: ReservationFormProps) {
  const t = useTranslations("events.reservation");
  const tRegole = useTranslations("regole");
  const locale = useLocale();
  const [member, setMember] = useState<MeResponse["member"] | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [meError, setMeError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    notes: "",
    rulesAccepted: false,
    dataConsent: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataConsentError, setDataConsentError] = useState<string | null>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json() as Promise<MeResponse>)
      .then((data) => {
        if (cancelled) return;
        if (!data.hasIdentity || !data.member) {
          setMeError("Sessione non valida. Accedi con FENAM.");
          return;
        }
        setMember(data.member);
        setFormData((prev) => ({
          ...prev,
          firstName: data.member?.firstName ?? "",
          lastName: data.member?.lastName ?? "",
          phone: data.member?.phone ?? "",
        }));
      })
      .catch(() => {
        if (!cancelled) setMeError("Impossibile caricare i dati. Riprova.");
      })
      .finally(() => {
        if (!cancelled) setMeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

    const firstNameEditable = !(member?.firstName ?? "").trim();
    const lastNameEditable = !(member?.lastName ?? "").trim();
    if (firstNameEditable && !formData.firstName.trim()) {
      setError("Il nome è obbligatorio.");
      return;
    }
    if (lastNameEditable && !formData.lastName.trim()) {
      setError("Il cognome è obbligatorio.");
      return;
    }

    setIsLoading(true);

    const phoneEditable = !(member?.phone ?? "").trim();
    const payload: Record<string, unknown> = {
      eventSlug,
      notes: formData.notes || null,
      rulesAccepted: true,
      dataConsent: true,
    };
    if (firstNameEditable && formData.firstName.trim()) payload.firstName = formData.firstName.trim();
    if (lastNameEditable && formData.lastName.trim()) payload.lastName = formData.lastName.trim();
    if (phoneEditable && formData.phone.trim()) payload.phone = formData.phone.trim();

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        reservationId?: string;
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        let errorMessage = "Si è verificato un errore durante la prenotazione.";
        
        if (response.status === 401) {
          errorMessage = "Sessione scaduta. Per favore, accedi nuovamente con FENAM.";
        } else if (response.status === 409) {
          // Messaggi specifici per conflitti
          if (data.error?.includes("già prenotato") || data.error?.includes("ALREADY_CONFIRMED")) {
            errorMessage = "Sei già prenotato per questo evento.";
          } else if (data.error?.includes("posti") || data.error?.includes("NO_CAPACITY")) {
            errorMessage = "Spiacenti, non ci sono più posti disponibili per questo evento.";
          } else {
            errorMessage = data.error ?? data.message ?? "Impossibile completare la prenotazione. Riprova più tardi.";
          }
        } else if (response.status === 429) {
          errorMessage = "Troppe richieste. Attendi un momento e riprova.";
        } else if (response.status >= 500) {
          errorMessage = "Errore del server. Riprova più tardi o contatta il supporto.";
        } else {
          errorMessage = data.error ?? data.message ?? errorMessage;
        }
        
        setError(errorMessage);
        return;
      }

      setReservationId(data.reservationId ?? null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  if (meLoading) {
    return (
      <Card className="w-full max-w-xl mx-auto border-0 shadow-lg rounded-2xl bg-white">
        <CardContent className="py-12 px-8 text-center text-marrone-scuro/80">
          Caricamento...
        </CardContent>
      </Card>
    );
  }

  if (meError || !member) {
    return (
      <Card className="w-full max-w-xl mx-auto border-0 shadow-lg rounded-2xl bg-white">
        <CardHeader className="pb-4 px-8 pt-8">
          <CardTitle className="font-serif text-2xl text-borgogna">
            {t("title")}
          </CardTitle>
          <p className="text-marrone-scuro/80 mt-2">{meError ?? "Accedi per prenotare."}</p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Link href={`/${locale}/accedi-fenam?returnUrl=${encodeURIComponent(`/${locale}/cene/${eventSlug}`)}`}>
            <Button className="w-full bg-borgogna text-bianco-caldo hover:bg-borgogna/90 rounded-xl py-7 text-lg font-semibold shadow-md">
              Accedi / Iscriviti con FENAM
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (success && reservationId) {
    return (
      <Card className="w-full max-w-xl mx-auto border-0 shadow-sm rounded-2xl">
        <CardContent className="pt-6">
          <Alert className="mb-6 bg-verde/10 border-verde rounded-xl">
            <AlertDescription className="text-verde font-semibold">
              {t("success")}
            </AlertDescription>
          </Alert>
          <p className="text-marrone-scuro text-sm mb-4">
            Completa il pagamento per confermare la prenotazione.
          </p>
          <Link href={`/${locale}/paga/${reservationId}`}>
            <Button className="bg-borgogna text-bianco-caldo hover:bg-borgogna/90 rounded-xl w-full">
              Vai al pagamento
            </Button>
          </Link>
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
          I tuoi dati sono precompilati; puoi aggiungere note o allergie.
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
                value={(member?.firstName ?? "").trim() ? (member?.firstName ?? "") : formData.firstName}
                readOnly={!!(member?.firstName ?? "").trim()}
                disabled={!!(member?.firstName ?? "").trim()}
                onChange={(e) => (member?.firstName ?? "").trim() ? undefined : setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                className={(member?.firstName ?? "").trim() ? "h-12 rounded-xl border-2 border-marrone-scuro/20 bg-marrone-scuro/5 text-base px-4" : "h-12 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna focus:ring-2 focus:ring-borgogna/20 transition-all duration-200 text-base px-4"}
                placeholder="Nome"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="lastName" className="text-base font-semibold text-marrone-scuro">
                {t("lastName")} <span className="text-borgogna">*</span>
              </Label>
              <Input
                id="lastName"
                value={(member?.lastName ?? "").trim() ? (member?.lastName ?? "") : formData.lastName}
                readOnly={!!(member?.lastName ?? "").trim()}
                disabled={!!(member?.lastName ?? "").trim()}
                onChange={(e) => (member?.lastName ?? "").trim() ? undefined : setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                className={(member?.lastName ?? "").trim() ? "h-12 rounded-xl border-2 border-marrone-scuro/20 bg-marrone-scuro/5 text-base px-4" : "h-12 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna focus:ring-2 focus:ring-borgogna/20 transition-all duration-200 text-base px-4"}
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
                value={member.email ?? ""}
                readOnly
                disabled
                className="h-12 rounded-xl border-2 border-marrone-scuro/20 bg-marrone-scuro/5 text-base px-4"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-base font-semibold text-marrone-scuro">
                {t("phone")}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={member.phone ?? ""}
                readOnly
                disabled
                className="h-12 rounded-xl border-2 border-marrone-scuro/20 bg-marrone-scuro/5 text-base px-4"
                placeholder="—"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-semibold text-marrone-scuro">
              {t("notes")}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
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
                setFormData((prev) => ({ ...prev, rulesAccepted: checked === true }));
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
                  setFormData((prev) => ({ ...prev, dataConsent: checked === true }));
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

          <div className="rounded-xl border border-marrone-scuro/20 bg-marrone-scuro/5 px-4 py-3 text-sm text-marrone-scuro/90">
            {t("paymentInfo")}
          </div>
        </CardContent>
        <CardFooter className="pt-4 pb-6 px-6 md:px-8">
          <Button
            type="submit"
            disabled={isLoading || !formData.rulesAccepted || !formData.dataConsent}
            className="w-full bg-borgogna text-bianco-caldo hover:bg-borgogna/90 rounded-xl py-6 text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Invio in corso...
              </span>
            ) : (
              t("submit")
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
