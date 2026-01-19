"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { locales } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

// Language Switcher Component
const LanguageSwitcher = ({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) => {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Rimuove il prefisso locale dal path
  const pathWithoutLocale = pathname.replace(/^\/(it|en|es)/, "") || "/";

  const languages = [
    { code: "it", label: "IT" },
    { code: "en", label: "EN" },
    { code: "es", label: "ES" },
  ];

  const current = languages.find((l) => l.code === locale) ?? languages[0];

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (variant === "mobile") {
    return (
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded-full border border-borgogna px-4 py-2 text-sm font-semibold text-borgogna hover:bg-borgogna hover:text-bianco-caldo transition-colors"
        >
          <span>{current.label}</span>
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </button>

        {open && (
          <div className="absolute left-0 right-0 mt-2 w-full rounded-xl border border-marrone-scuro/10 bg-white shadow-lg z-50">
            {languages.map((lang) => (
              <Link
                key={lang.code}
                href={`/${lang.code}${pathWithoutLocale}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "block w-full px-4 py-2.5 text-left text-sm transition-colors",
                  lang.code === locale
                    ? "bg-borgogna/5 font-semibold text-borgogna"
                    : "text-marrone-scuro/80 hover:bg-bianco-caldo"
                )}
              >
                {lang.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-full border border-borgogna px-3 py-1.5 text-xs font-semibold text-borgogna hover:bg-borgogna hover:text-bianco-caldo transition-colors whitespace-nowrap"
      >
        {current.label}
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-28 rounded-xl border border-marrone-scuro/10 bg-white shadow-lg z-50">
          {languages.map((lang) => (
            <Link
              key={lang.code}
              href={`/${lang.code}${pathWithoutLocale}`}
              onClick={() => setOpen(false)}
              className={cn(
                "block w-full px-3 py-2 text-left text-xs transition-colors",
                lang.code === locale
                  ? "bg-borgogna/5 font-semibold text-borgogna"
                  : "text-marrone-scuro/80 hover:bg-bianco-caldo"
              )}
            >
              {lang.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/cene`, label: t("dinners") },
    { href: `/${locale}/gallery`, label: t("gallery") },
    { href: `/${locale}/chefs`, label: t("chefs") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  const closeMobileMenu = () => setIsOpen(false);

  // Blocca lo scroll del body quando il menu è aperto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (pathname.includes("/fenam")) return null;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-marrone-scuro/10 bg-white/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20 min-w-0">
          <Link
            href={`/${locale}`}
            className="shrink-0 font-serif text-2xl md:text-3xl font-bold text-borgogna hover:text-borgogna/80 transition-colors whitespace-nowrap"
          >
            EnoTempo
          </Link>

          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-marrone-scuro hover:text-borgogna transition-colors font-medium text-sm lg:text-base whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/${locale}/fenam`} className="hidden lg:block">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-borgogna text-borgogna hover:bg-borgogna hover:text-bianco-caldo whitespace-nowrap"
              >
                {t("fenam")}
              </Button>
            </Link>

            <div className="hidden lg:block">
              <LanguageSwitcher variant="desktop" />
            </div>

            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-full border border-marrone-scuro/20 p-2 text-marrone-scuro hover:bg-bianco-caldo/70 lg:hidden transition-colors"
              aria-label="Toggle navigation"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-x-0 top-16 md:top-20 z-50 lg:hidden bg-white shadow-xl border-b border-marrone-scuro/10",
          "transition-transform duration-200 ease-out",
          isOpen ? "translate-y-0" : "-translate-y-3 pointer-events-none opacity-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4 max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-5rem)] overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMobileMenu}
              className="text-marrone-scuro hover:text-borgogna hover:bg-bianco-caldo/50 transition-colors font-medium py-3 px-3 rounded-lg"
            >
              {link.label}
            </Link>
          ))}

          <Link href={`/${locale}/fenam`} onClick={closeMobileMenu} className="mt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl border-borgogna text-borgogna hover:bg-borgogna hover:text-bianco-caldo"
            >
              {t("fenam")}
            </Button>
          </Link>

          <div className="mt-4">
            <LanguageSwitcher variant="mobile" />
          </div>
        </nav>
      </div>
    </>
  );
}

