"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default function ContactPage() {
  const t = useTranslations("contact");
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.message) {
      setError(t("form.error"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Inserisci un indirizzo email valido.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error();
      setSuccess(true);
      setFormData({ name: "", email: "", message: "" });
    } catch {
      setError(t("form.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bianco-caldo">
      {/* Hero borgogna */}
      <section className="bg-borgogna px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <Eyebrow className="text-verde/70 mb-4">Scrivici</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-crema mb-4">
            {t("title")}
          </h1>
          <p className="text-crema/60 text-base md:text-lg max-w-xl mx-auto">
            {t("description")}
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-2xl">
          {/* Intro text */}
          <p className="text-base md:text-lg text-marrone-scuro/70 leading-relaxed text-center mb-12">
            Enotempo crea esperienze enogastronomiche che uniscono l&apos;Italia e l&apos;America Latina attraverso
            eventi multisensoriali dove vino, gastronomia e cultura si intrecciano. Utilizza il form qui sotto
            per collaborazioni, domande sulle cene, proposte di eventi o qualsiasi altra richiesta.
          </p>

          <div className="border border-borgogna/15 rounded-[2px] p-6 md:p-10 bg-white/60">
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-borgogna mb-8">
              Invia un messaggio
            </h2>

            {error && (
              <Alert variant="destructive" className="rounded-[2px] mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-verde/8 border-verde/30 rounded-[2px] mb-6">
                <AlertDescription className="text-verde font-medium">
                  {t("form.success")}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-marrone-scuro/80 text-sm">
                  {t("form.name")} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-[2px] border-borgogna/20 focus:border-borgogna"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-marrone-scuro/80 text-sm">
                  {t("form.email")} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="rounded-[2px] border-borgogna/20 focus:border-borgogna"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-marrone-scuro/80 text-sm">
                  {t("form.message")} *
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  required
                  className="rounded-[2px] border-borgogna/20 focus:border-borgogna"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center rounded-[2px] bg-verde text-bianco-caldo px-6 py-3 text-sm font-medium hover:bg-verde/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Invio in corso…" : t("form.submit")}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
