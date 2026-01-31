import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { headers } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AccediFenamClient from "./AccediFenamClient";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ returnUrl?: string }> };

export default async function AccediFenamPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { returnUrl } = await searchParams;
  const t = await getTranslations("auth.fenam");
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;
  // FeNAM farà POST a handoff; redirect = dove mandare l'utente dopo il login
  const handoffUrl = `${origin}/api/auth/fenam/handoff?redirect=${encodeURIComponent(returnUrl || `/${locale}/cene`)}`;
  const fenamLoginUrl = process.env.FENAM_LOGIN_URL || "";

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-bianco-caldo px-4 py-12">
      <Card className="max-w-xl w-full rounded-3xl shadow-md border-none bg-white/90">
        <CardHeader>
          <CardTitle className="font-serif text-2xl text-borgogna">{t("title")}</CardTitle>
          <p className="text-marrone-scuro/80 mt-2">{t("description")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <AccediFenamClient
            fenamLoginUrl={fenamLoginUrl}
            callbackUrl={handoffUrl}
            returnUrl={returnUrl || `/${locale}/cene`}
            locale={locale}
          />
          <p className="text-sm text-marrone-scuro/70 text-center">
            <Link href={`/${locale}/cene`} className="underline text-borgogna hover:text-borgogna/80">
              {t("backToDinners")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
