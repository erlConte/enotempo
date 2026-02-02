import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { headers } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AccediFenamClient from "./AccediFenamClient";

/** Fallback base URL FENAM login socio (solo origin + pathname, no www). */
const DEFAULT_FENAM_LOGIN_URL = "https://fenam.website/affiliazione";

/** Normalizza base FENAM: https, niente www, niente query (solo origin + pathname). */
function normalizeFenamBase(envUrl: string | undefined): string {
  const raw = (envUrl || "").trim().replace(/\?.*$/, "");
  if (!raw) return DEFAULT_FENAM_LOGIN_URL;
  try {
    const u = new URL(raw);
    u.protocol = "https:";
    if (u.hostname.toLowerCase().startsWith("www.")) {
      u.hostname = u.hostname.slice(4);
    }
    u.search = "";
    return u.origin + u.pathname;
  } catch {
    return DEFAULT_FENAM_LOGIN_URL;
  }
}

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ returnUrl?: string }> };

export default async function AccediFenamPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { returnUrl } = await searchParams;
  const t = await getTranslations("auth.fenam");
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  // returnUrl interno: dove mandare l'utente dopo il callback (solo path relativo)
  const internalRedirect = returnUrl && returnUrl.startsWith("/") ? returnUrl : `/${locale}/cene`;
  // Callback Enotempo: GET che riceve token in query (fenamToken o token)
  const callbackPath = "/api/auth/fenam/callback";
  const callbackUrl = `${origin}${callbackPath}?redirect=${encodeURIComponent(internalRedirect)}`;
  // URL verso FENAM: base normalizzata (https, no www, no query) + query deterministica
  const fenamBase = normalizeFenamBase(process.env.FENAM_LOGIN_URL);
  const fenamRedirectUrl = `${fenamBase}?source=enotempo&returnUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-bianco-caldo px-4 py-12">
      <Card className="max-w-xl w-full rounded-3xl shadow-md border-none bg-white/90">
        <CardHeader>
          <CardTitle className="font-serif text-2xl text-borgogna">{t("title")}</CardTitle>
          <p className="text-marrone-scuro/80 mt-2">{t("description")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <AccediFenamClient fenamRedirectUrl={fenamRedirectUrl} />
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
