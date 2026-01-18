import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPartners } from "@/lib/partners";

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("partners");
  const partners = getPartners();

  return (
    <div className="min-h-screen bg-bianco-caldo py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-borgogna mb-6">
            {t("pageTitle")}
          </h1>
          <p className="text-lg md:text-xl text-marrone-scuro/70 max-w-2xl mx-auto">
            {t("pageSubtitle")}
          </p>
        </div>

        {/* Box informativo CTA */}
        <div className="rounded-2xl bg-white border border-marrone-scuro/10 p-6 mb-10">
          <p className="text-lg text-marrone-scuro/80 mb-4">
            {t("ctaBox.title")}
          </p>
          <p className="text-base text-marrone-scuro/70 mb-6">
            {t("ctaBox.body")}
          </p>
          <Button
            asChild
            className="bg-borgogna text-bianco-caldo hover:bg-borgogna/90 rounded-xl"
          >
            <Link href={`/${locale}/partners/contract`}>
              {t("ctaBox.button")}
            </Link>
          </Button>
        </div>

        {partners.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-marrone-scuro/70">{t("empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {partners.map((partner) => (
              <Card
                key={partner.slug}
                className="rounded-2xl border border-marrone-scuro/5 shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    {partner.logoPath ? (
                      <div className="relative h-16 w-16 rounded-xl bg-bianco-caldo overflow-hidden shrink-0 border border-marrone-scuro/10">
                        <Image
                          src={partner.logoPath}
                          alt={partner.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-borgogna/20 via-crema/30 to-verde/20 flex items-center justify-center shrink-0 border border-marrone-scuro/10">
                        <span className="text-xl font-serif font-bold text-borgogna/40">
                          {partner.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-marrone-scuro text-lg font-serif">
                        {partner.name}
                      </h3>
                      <p className="text-xs text-marrone-scuro/60 mt-1">
                        {t(`type.${partner.type}`)} · {partner.city}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="mt-2 px-0 text-sm text-borgogna hover:text-borgogna/80 hover:bg-borgogna/5"
                  >
                    <Link href={`/${locale}/partners/${partner.slug}`}>
                      {t("actions.viewDetails")} →
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

