"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Props = {
  fenamLoginUrl: string;
  callbackUrl: string;
  returnUrl: string;
  locale: string;
};

export default function AccediFenamClient({ fenamLoginUrl, callbackUrl, returnUrl, locale }: Props) {
  const t = useTranslations("auth.fenam");

  const handleRedirect = () => {
    const url = new URL(fenamLoginUrl);
    url.searchParams.set("returnUrl", callbackUrl);
    window.location.href = url.toString();
  };

  if (!fenamLoginUrl) {
    return (
      <p className="text-marrone-scuro/80 text-sm">
        {t("notConfigured")}
      </p>
    );
  }

  return (
    <Button
      onClick={handleRedirect}
      className="w-full bg-borgogna text-bianco-caldo hover:bg-borgogna/90 rounded-xl py-6 text-base font-semibold"
    >
      {t("cta")}
    </Button>
  );
}
