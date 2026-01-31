import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("privacy");

  return (
    <div className="min-h-screen bg-bianco-caldo py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-borgogna mb-6">
            {t("title")}
          </h1>
          <p className="text-lg md:text-xl text-marrone-scuro/70 max-w-2xl mx-auto leading-relaxed">
            {t("intro")}
          </p>
        </div>

        <Card className="border-0 shadow-sm rounded-2xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-2xl md:text-3xl text-borgogna">
              {t("sections.events.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base md:text-lg text-marrone-scuro/80 leading-relaxed">
              {t("sections.events.body")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl bg-white mt-6">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-2xl md:text-3xl text-borgogna">
              {t("sections.general.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base md:text-lg text-marrone-scuro/80 leading-relaxed">
              {t("sections.general.body")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

