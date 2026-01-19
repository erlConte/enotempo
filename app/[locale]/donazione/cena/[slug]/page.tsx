import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEventBySlug, getMockEvents } from "@/lib/mockEvents";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  const events = getMockEvents();
  const slugs = events.map((event) => event.slug);
  // Produci combinazioni di parametri { locale, slug } per ogni lingua e evento
  return locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export default async function CenaDonationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "donation" });
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bianco-caldo py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-3xl text-borgogna text-center">
              {t("dinner.title")}
            </CardTitle>
            <p className="text-center text-marrone-scuro font-semibold mt-2">
              {event.title}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-marrone-scuro leading-relaxed text-center">
              Hai confermato la tua partecipazione.
            </p>
            <p className="text-marrone-scuro leading-relaxed text-center">
              {t("dinner.description")}
            </p>
            <p className="text-sm text-marrone-scuro/70 text-center">
              La donazione è volontaria. Puoi continuare anche senza completare il pagamento.
            </p>
            <div className="text-center pt-4 space-y-4">
              <Button
                asChild
                className="w-full justify-center py-6 text-base bg-borgogna text-bianco-caldo hover:bg-borgogna/90"
              >
                <a
                  href="https://www.paypal.com/donate/?hosted_button_id=2MLWSNVYDDHFE"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("dinner.button")}
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-center py-6 text-base"
              >
                <Link href={`/${locale}/cene/${slug}?donazione=skipped`}>
                  {t("dinner.skipDonation")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

