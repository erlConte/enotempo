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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(s: string): boolean {
  return typeof s === "string" && s.length > 0 && EMAIL_REGEX.test(s.trim());
}

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
  const emailIsPlaceholder = !member.email || isPlaceholderEmail(member.email);
  const [formData, setFormData] = useState({
    firstName: member.firstName ?? "",
    lastName: member.lastName ?? "",
    phone: member.phone ?? "",
    email: emailIsPlaceholder ? "" : (member.email ?? ""),
    notes: initialNotes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [payPalKey, setPayPalKey] = useState(0);

  const saveFormBeforePay = useCallback(async () => {
    const payload: Record<string, unknown> = {
      firstName: formData.firstName.trim() || undefined,
      lastName: formData.lastName.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      notes: formData.notes.trim() || null,
    };
    if (emailIsPlaceholder && formData.email.trim()) {
      payload.email = formData.email.trim().toLowerCase();
    }
    const res = await fetch(`/api/reservations/${reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    if (res.status === 409 && data.error === "EMAIL_ALREADY_IN_USE") {
      setError(tCheckout("emailAlreadyInUse"));
      throw new Error(tCheckout("emailAlreadyInUse"));
    }
    if (!res.ok) {
      throw new Error(data.error ?? "Salvataggio dati fallito");
    }
  }, [reservationId, formData, emailIsPlaceholder, tCheckout]);

  const handleSuccess = () => {
    window.location.href = `/${locale}/conferma/${reservationId}`;
  };

  const emailRequiredAndValid =
    !emailIsPlaceholder || (formData.email.trim().length > 0 && isValidEmail(formData.email));

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
              <Label htmlFor="checkout-email" className="text-base font-semibold text-marrone-scuro">
                {t("email")} <span className="text-borgogna">*</span>
              </Label>
              <p className="text-sm text-marrone-scuro/80 mb-1">{tCheckout("emailRequiredHint")}</p>
              <Input
                id="checkout-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="h-11 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna text-base px-4"
                placeholder="email@esempio.it"
                required
              />
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

        {!emailRequiredAndValid ? (
          <p className="text-marrone-scuro/80 text-sm rounded-xl bg-marrone-scuro/5 border border-marrone-scuro/20 px-4 py-3">
            {tCheckout("emailRequiredHint")}
          </p>
        ) : (
          <div key={payPalKey}>
            <PayPalButton
              reservationId={reservationId}
              onSuccess={handleSuccess}
              onError={setError}
              beforeCreateOrder={saveFormBeforePay}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
