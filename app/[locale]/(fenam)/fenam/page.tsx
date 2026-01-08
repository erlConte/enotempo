import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function FenamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("fenam");

  return (
    <div className="min-h-screen py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Colonna sinistra - Testo istituzionale */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-marrone-scuro mb-6">
                {t("title")}
              </h1>
              <p className="text-lg md:text-xl text-marrone-scuro/80 leading-relaxed">
                {t("description")}
              </p>
            </div>

            <div className="space-y-6 text-marrone-scuro/70 leading-relaxed">
              <p>
                La Federazione Nazionale di Associazioni Multiculturali (FENAM) promuove
                l&apos;incontro tra culture diverse attraverso iniziative culturali, eventi e
                momenti di convivialità. La nostra missione è creare ponti tra comunità,
                valorizzando le tradizioni e favorendo il dialogo interculturale.
              </p>
              <p>
                L&apos;iscrizione alla FENAM è aperta a tutti coloro che condividono i valori
                di inclusione, rispetto e apertura verso le diverse culture che arricchiscono
                il nostro territorio.
              </p>
            </div>
          </div>

          {/* Colonna destra - Box riepilogo */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-marrone-scuro/20 rounded-2xl shadow-sm bg-white sticky top-8">
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-2xl text-marrone-scuro">
                  Partecipa alle cene ENOTEMPO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-marrone-scuro/80 leading-relaxed text-sm">
                  Per partecipare alle cene ENOTEMPO è obbligatoria l&apos;iscrizione alla FENAM.
                  Senza registrazione FENAM non è possibile completare la prenotazione.
                </p>
                <Link href={`/${locale}/fenam/iscrizione`} className="block">
                  <Button
                    size="lg"
                    className="w-full bg-marrone-scuro text-bianco-caldo hover:bg-marrone-scuro/90 font-semibold py-6 text-lg rounded-xl shadow-sm"
                  >
                    {t("registerButton")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

