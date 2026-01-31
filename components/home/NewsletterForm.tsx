"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function NewsletterForm() {
  const t = useTranslations("home.newsletter");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError(t("error.invalidEmail"));
      return;
    }

    setIsLoading(true);

    try {
      // TODO: In futuro, implementare endpoint API /api/newsletter
      // Per ora, simuliamo un successo
      // In produzione, qui si può integrare con servizio email (Resend, Mailchimp, ecc.)
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(t("error.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Alert className="bg-verde/10 border-verde rounded-xl">
        <AlertDescription className="text-verde font-medium">
          {t("success")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("placeholder")}
          required
          className="flex-1 h-12 rounded-xl border-2 border-marrone-scuro/20 focus:border-borgogna focus:ring-2 focus:ring-borgogna/20 transition-all duration-200 text-base px-4"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-borgogna text-bianco-caldo hover:bg-borgogna/90 rounded-xl px-8 py-6 h-12 font-semibold shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
        >
          {isLoading ? t("submitting") : t("submit")}
        </Button>
      </div>
      <p className="text-xs text-marrone-scuro/60 text-center">
        {t.rich("privacyNotice", {
          link: (chunks) => (
            <Link
              href={`/${locale}/privacy`}
              className="underline text-borgogna hover:text-borgogna/80"
              target="_blank"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}

