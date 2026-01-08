import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PartnersContractPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("partners.contract");

  return (
    <div className="min-h-screen bg-bianco-caldo py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-0 shadow-sm rounded-2xl bg-white p-8">
          <div className="mb-8">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-borgogna mb-6">
              {t("title")}
            </h1>
            <p className="text-lg md:text-xl text-marrone-scuro/70 leading-relaxed mb-8">
              {t("intro")}
            </p>
          </div>

          <CardContent className="space-y-8 p-0">
            {/* Sezione 1: Oggetto della collaborazione */}
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-borgogna mb-4">
                {t("sections.scopeTitle")}
              </h2>
              <p className="text-base md:text-lg text-marrone-scuro/80 leading-relaxed">
                {t("sections.scopeBody")}
              </p>
            </div>

            {/* Sezione 2: Impegni di Enotempo */}
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-borgogna mb-4">
                {t("sections.enotempoTitle")}
              </h2>
              <p className="text-base md:text-lg text-marrone-scuro/80 leading-relaxed">
                {t("sections.enotempoBody")}
              </p>
            </div>

            {/* Sezione 3: Impegni del partner */}
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-borgogna mb-4">
                {t("sections.partnerTitle")}
              </h2>
              <p className="text-base md:text-lg text-marrone-scuro/80 leading-relaxed">
                {t("sections.partnerBody")}
              </p>
            </div>

            {/* Sezione 4: Aspetti logistici */}
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-borgogna mb-4">
                {t("sections.logisticsTitle")}
              </h2>
              <p className="text-base md:text-lg text-marrone-scuro/80 leading-relaxed">
                {t("sections.logisticsBody")}
              </p>
            </div>

            {/* Sezione 5: Trattamento dati */}
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-borgogna mb-4">
                {t("sections.dataTitle")}
              </h2>
              <p className="text-base md:text-lg text-marrone-scuro/80 leading-relaxed">
                {t("sections.dataBody")}
              </p>
            </div>

            {/* Disclaimer */}
            <div className="pt-6 border-t border-marrone-scuro/10">
              <p className="text-sm text-marrone-scuro/60 leading-relaxed">
                {t("disclaimer")}
              </p>
            </div>

            {/* Pulsante per tornare alla lista */}
            <div className="pt-4">
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-borgogna text-borgogna hover:bg-borgogna hover:text-bianco-caldo"
              >
                <Link href={`/${locale}/partners`}>
                  {t("backToPartners")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

