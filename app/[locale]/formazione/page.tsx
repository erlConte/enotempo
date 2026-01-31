import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FormazionePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("formazione");

  return (
    <div className="min-h-screen bg-bianco-caldo py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-borgogna mb-6 text-center">
          {t("title")}
        </h1>
        <p className="text-lg text-marrone-scuro/80 text-center mb-12 max-w-2xl mx-auto">
          {t("intro")}
        </p>
        <Card className="border-0 shadow-md rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-borgogna">
              {t("pilloleTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-marrone-scuro/90">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-borgogna/60 shrink-0" />
                {t("pillolePlaceholder")}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
