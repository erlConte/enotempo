import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ paypal?: string }>;
};

export default async function FenamDonationPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams?.paypal;
  const t = await getTranslations({ locale, namespace: "donation.fenam" });

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-bianco-caldo px-4 py-12">
      <Card className="max-w-xl w-full rounded-3xl shadow-md border-none bg-white/90">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-serif text-marrone-scuro">
            {t("title")}
          </CardTitle>
          <p className="text-marrone-scuro/75 text-sm">
            {t("body")}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* PayPal Status Banner */}
          {status === "success" && (
            <Alert className="bg-verde/10 border-verde rounded-xl">
              <AlertDescription className="text-verde font-semibold">
                {t("paypalSuccess")}
              </AlertDescription>
            </Alert>
          )}

          {status === "cancel" && (
            <Alert className="bg-amber-50 border-amber-200 rounded-xl">
              <AlertDescription className="text-amber-800">
                {t("paypalCancel")}
              </AlertDescription>
            </Alert>
          )}

          {/* PayPal Button */}
          <div className="space-y-2">
            <Button asChild className="flex-1 w-full justify-center py-6 text-base font-semibold">
              <a
                href="https://www.paypal.com/donate/?hosted_button_id=2MLWSNVYDDHFE"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("paypalButton")}
              </a>
            </Button>
          </div>

          {/* Divider piccolo */}
          <div className="flex items-center gap-2 text-xs text-marrone-scuro/60">
            <div className="h-px flex-1 bg-marrone-scuro/10" />
            <span>oppure</span>
            <div className="h-px flex-1 bg-marrone-scuro/10" />
          </div>

          {/* Continua senza donazione */}
          <div className="space-y-2">
            <Button
              asChild
              variant="outline"
              className="flex-1 w-full justify-center py-6 text-base font-semibold"
            >
              <Link href={`/${locale}/cene`}>
                {t("skipDonation")}
              </Link>
            </Button>
            <p className="text-xs text-marrone-scuro/70 text-center">
              {t("skipDonationNote")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

