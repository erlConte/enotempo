"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PayPalButton from "@/components/payments/PayPalButton";
import { isPlaceholderEmail } from "@/lib/fenam-handoff";

export type CheckoutMember = {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
};

interface CheckoutFormWithPayPalProps {
  reservationId: string;
  member: CheckoutMember;
  initialNotes: string | null;
  eventTitle: string;
  eventDate: string;
  amount: string;
  locale: string;
}

export default function CheckoutFormWithPayPal({
  reservationId,
  member,
  initialNotes,
  eventTitle,
  eventDate,
  amount,
  locale,
}: CheckoutFormWithPayPalProps) {
  const t = useTranslations("events.reservation");
  const tCheckout = useTranslations("checkout");
  const [formData, setFormData] = useState({
    firstName: member.firstName ?? "",
    lastName: member.lastName ?? "",
    phone: member.phone ?? "",
    notes: initialNotes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [payPalKey, setPayPalKey] = useState(0);

  const saveFormBeforePay = useCallback(async () => {
    const res = await fetch(`/api/reservations/${reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        notes: formData.notes.trim() || null,
      }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Salvataggio dati fallito");
    }
  }, [reservationId, formData]);

  const handleSuccess = () => {
    window.location.href = `/${locale}/conferma/${reservationId}`;
  };

  const emailIsPlaceholder = member.email ? isPlaceholderEmail(member.email) : false;

  return (
    <Card>
      <CardHeader className="pb-4 pt-6 px-6 md:px-8">
        <CardTitle className="font-serif text-2xl text-borgogna text-center">
          {tCheckout("title")}
        </CardTitle>
        <p className="text-center text-marrone-scuro font-semibold mt-2">{eventTitle}</p>
        <p className="text-center text-marrone-scuro/80 text-sm mt-1">{eventDate}</p>
        <p className="text-center text-marrone-scuro font-medium mt-2">Importo: {amount} €</p>
      </CardHeader>
      <CardContent className="space-y-5 px-6 md:px-8 pb-8">
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-base font-semibold text-marrone-scuro">
                {t("firstName")} <span className="text-borgogna">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                className="h-11 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna text-base px-4"
                placeholder="Nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-base font-semibold text-marrone-scuro">
                {t("lastName")} <span className="text-borgogna">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                className="h-11 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna text-base px-4"
                placeholder="Cognome"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-semibold text-marrone-scuro">
              {t("phone")}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              className="h-11 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna text-base px-4"
              placeholder="—"
            />
          </div>

          {emailIsPlaceholder ? (
            <div className="space-y-2">
              <span className="text-base font-semibold text-marrone-scuro">{t("email")}</span>
              <p className="text-sm text-marrone-scuro/80 rounded-xl border-2 border-marrone-scuro/20 bg-marrone-scuro/5 px-4 py-3">
                {t("emailNotAvailableFromFenam")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-base font-semibold text-marrone-scuro">{t("email")}</Label>
              <p className="text-sm text-marrone-scuro/80 rounded-xl border-2 border-marrone-scuro/20 bg-marrone-scuro/5 px-4 py-3">
                {member.email}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold text-marrone-scuro">
              {t("notes")}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna text-base px-4 py-3 min-h-[80px]"
              placeholder="Note (allergie, preferenze...)"
            />
          </div>
        </form>

        <div className="rounded-xl border border-marrone-scuro/20 bg-marrone-scuro/5 px-4 py-3 text-sm text-marrone-scuro/90">
          {t("paymentInfo")}
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription className="flex flex-wrap items-center gap-2">
              <span>{error}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setError(null);
                  setPayPalKey((k) => k + 1);
                }}
              >
                {tCheckout("retry")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div key={payPalKey}>
          <PayPalButton
            reservationId={reservationId}
            onSuccess={handleSuccess}
            onError={setError}
            beforeCreateOrder={saveFormBeforePay}
          />
        </div>
      </CardContent>
    </Card>
  );
}
