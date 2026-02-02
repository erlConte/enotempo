"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Props = {
  /** URL completo verso FENAM (già costruito server-side: base?source=enotempo&returnUrl=encoded). */
  fenamRedirectUrl: string;
};

export default function AccediFenamClient({ fenamRedirectUrl }: Props) {
  const t = useTranslations("auth.fenam");

  const handleRedirect = () => {
    window.location.href = fenamRedirectUrl;
  };

  if (!fenamRedirectUrl || !fenamRedirectUrl.startsWith("http")) {
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
