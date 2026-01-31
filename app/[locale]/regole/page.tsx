import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RegolePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("regole");

  return (
    <div className="min-h-screen bg-bianco-caldo py-16 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-borgogna mb-8 text-center">
          {t("title")}
        </h1>
        <Card className="border-0 shadow-md rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-borgogna">
              {t("intro")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="font-semibold text-marrone-scuro mb-2">{t("punctualityTitle")}</h2>
              <p className="text-marrone-scuro/90 leading-relaxed">{t("punctuality")}</p>
            </section>
            <section>
              <h2 className="font-semibold text-marrone-scuro mb-2">{t("allergiesTitle")}</h2>
              <p className="text-marrone-scuro/90 leading-relaxed">{t("allergies")}</p>
            </section>
            <section>
              <h2 className="font-semibold text-marrone-scuro mb-2">{t("extraPaidTitle")}</h2>
              <p className="text-marrone-scuro/90 leading-relaxed">{t("extraPaid")}</p>
            </section>
            <section>
              <h2 className="font-semibold text-marrone-scuro mb-2">{t("limitedSeatsTitle")}</h2>
              <p className="text-marrone-scuro/90 leading-relaxed">{t("limitedSeats")}</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
