"use client";

import { useTranslations } from "next-intl";

type Props = {
  fenamRedirectUrl: string;
};

export default function AccediFenamClient({ fenamRedirectUrl }: Props) {
  const t = useTranslations("auth.fenam");

  const handleRedirect = () => {
    window.location.href = fenamRedirectUrl;
  };

  if (!fenamRedirectUrl || !fenamRedirectUrl.startsWith("http")) {
    return (
      <p className="text-marrone-scuro/70 text-sm">
        {t("notConfigured")}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleRedirect}
      className="w-full inline-flex items-center justify-center rounded-[2px] bg-borgogna text-bianco-caldo px-6 py-3 text-sm font-medium hover:bg-borgogna/90 transition-colors"
    >
      {t("cta")}
    </button>
  );
}
