import { getTranslations } from "next-intl/server";
import Link from "next/link";
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

        {partners.length === 0 ? (
          <Card className="border-0 shadow-sm rounded-2xl bg-white max-w-2xl mx-auto">
            <CardHeader className="pb-2">
              <h2 className="font-serif text-3xl md:text-4xl text-borgogna text-center">
                {t("emptyTitle")}
              </h2>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-base md:text-lg text-marrone-scuro/70">
                {t("emptyBody")}
              </p>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-borgogna text-borgogna hover:bg-borgogna hover:text-bianco-caldo"
              >
                <Link href={`/${locale}/contact`}>
                  {t("emptyCta")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {partners.map((partner) => (
              <Card
                key={partner.slug}
                className="rounded-2xl border border-marrone-scuro/5 shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
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

