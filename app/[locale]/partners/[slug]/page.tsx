import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPartnerBySlug, getPartners } from "@/lib/partners";
import { locales } from "@/lib/i18n/config";

export function generateStaticParams() {
  const partners = getPartners();
  const slugs = partners.map((partner) => partner.slug);
  // Produci combinazioni di parametri { locale, slug } per ogni lingua e partner
  return locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("partners");
  const partner = getPartnerBySlug(slug);

  if (!partner) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bianco-caldo py-12 md:py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header con nome, tipo, città */}
        <div className="bg-white border-b border-border rounded-2xl shadow-sm mb-8 p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1">
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-borgogna mb-4">
                {partner.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-base md:text-lg text-marrone-scuro/80">
                  {t(`type.${partner.type}`)}
                </p>
                <span className="text-marrone-scuro/40">·</span>
                <p className="text-base md:text-lg text-marrone-scuro/80">
                  {partner.city}, {partner.country}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sezioni testuali */}
        <div className="space-y-6">
          {/* Perché hai scelto Enotempo */}
          {partner.whyEnotempo ? (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-borgogna">
                  {t("detail.whyTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-marrone-scuro/90 leading-relaxed text-base">
                  {partner.whyEnotempo}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* Chi sei / descrizione attività */}
          {partner.about ? (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-borgogna">
                  {t("detail.aboutTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-marrone-scuro/90 leading-relaxed text-base">
                  {partner.about}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* Cosa ti aspetti da Enotempo */}
          {partner.expectations ? (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-borgogna">
                  {t("detail.expectationsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-marrone-scuro/90 leading-relaxed text-base">
                  {partner.expectations}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Link torna ai partner */}
        <div className="mt-12 text-center">
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-borgogna text-borgogna hover:bg-borgogna hover:text-bianco-caldo"
          >
            <Link href={`/${locale}/partners`}>
              ← {t("detail.backToList")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

