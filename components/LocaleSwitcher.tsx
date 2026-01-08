"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { locales } from "@/lib/i18n/config";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  // Rimuove il prefisso locale dal path
  const pathWithoutLocale = pathname.replace(/^\/(it|en|es)/, "") || "/";

  return (
    <div className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs md:text-sm">
      {locales.map((loc) => {
        const isActive = loc === locale;
        return (
          <Link
            key={loc}
            href={`/${loc}${pathWithoutLocale}`}
            className={`px-2 py-1 rounded-full transition-colors ${
              isActive
                ? "bg-borgogna text-bianco-caldo font-semibold"
                : "text-marrone-scuro/70 hover:bg-neutral-200"
            }`}
          >
            {loc.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}

