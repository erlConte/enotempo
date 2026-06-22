import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { headers } from "next/headers";
import { Eyebrow } from "@/components/ui/Eyebrow";
import AccediFenamClient from "./AccediFenamClient";

const DEFAULT_FENAM_LOGIN_URL = "https://fenam.website/affiliazione";

function normalizeFenamBase(envUrl: string | undefined): string {
  const raw = (envUrl || "").trim().replace(/\?.*$/, "");
  if (!raw) return DEFAULT_FENAM_LOGIN_URL;
  try {
    const u = new URL(raw);
    u.protocol = "https:";
    if (u.hostname.toLowerCase().startsWith("www.")) u.hostname = u.hostname.slice(4);
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

  const internalRedirect = returnUrl && returnUrl.startsWith("/") ? returnUrl : `/${locale}/cene`;
  const callbackPath = "/api/auth/fenam/callback";
  const callbackUrl = `${origin}${callbackPath}?redirect=${encodeURIComponent(internalRedirect)}`;
  const fenamBase = normalizeFenamBase(process.env.FENAM_LOGIN_URL);
  const fenamRedirectUrl = `${fenamBase}?source=enotempo&returnUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="min-h-screen bg-bianco-caldo flex items-center justify-center px-4 py-16 md:py-24">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="border border-borgogna/15 rounded-[2px] bg-white/70 p-8 md:p-10 shadow-sm">
          <Eyebrow className="mb-4">Accesso soci</Eyebrow>
          <h1 className="font-serif text-2xl md:text-3xl font-medium text-borgogna mb-3">
            {t("title")}
          </h1>
          <p className="text-marrone-scuro/70 text-sm md:text-base leading-relaxed mb-8">
            {t("description")}
          </p>

          <AccediFenamClient fenamRedirectUrl={fenamRedirectUrl} />

          <p className="text-center mt-6">
            <Link
              href={`/${locale}/cene`}
              className="text-sm text-borgogna hover:underline"
            >
              ← {t("backToDinners")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
