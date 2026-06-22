"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type AuthMember = { id: string; firstName: string; lastName: string; email: string };
type AuthState =
  | { status: "loading" }
  | { status: "logged-out" }
  | { status: "logged-in"; member: AuthMember };

// ── Language Switcher ─────────────────────────────────────────────────────────

const LanguageSwitcher = ({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) => {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const pathWithoutLocale = pathname.replace(/^\/(it|en|es)/, "") || "/";
  const languages = [
    { code: "it", label: "IT" },
    { code: "en", label: "EN" },
    { code: "es", label: "ES" },
  ];
  const current = languages.find((l) => l.code === locale) ?? languages[0];

  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const dropdownCls = "absolute mt-1 rounded-[2px] border border-borgogna/20 bg-bianco-caldo shadow-lg z-[60] overflow-hidden";
  const itemCls = (code: string) =>
    cn(
      "block px-4 py-2.5 text-sm transition-colors",
      code === locale
        ? "bg-borgogna/8 font-semibold text-borgogna"
        : "text-marrone-scuro/80 hover:bg-borgogna/5 hover:text-borgogna"
    );

  if (variant === "mobile") {
    return (
      <div className="relative w-full" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded-[2px] border border-crema/40 px-4 py-3 text-sm font-semibold text-crema hover:bg-crema/10 transition-colors"
          aria-expanded={open}
          aria-label="Seleziona lingua"
        >
          <span>{current.label}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} />
        </button>
        {open && (
          <div className={cn(dropdownCls, "left-0 right-0 w-full")}>
            {languages.map((lang) => (
              <Link key={lang.code} href={`/${lang.code}${pathWithoutLocale}`} onClick={() => setOpen(false)} className={itemCls(lang.code)}>
                {lang.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-[2px] border border-borgogna px-3 py-1.5 text-xs font-semibold tracking-widest text-borgogna hover:bg-borgogna hover:text-bianco-caldo transition-colors"
        aria-expanded={open}
        aria-label="Seleziona lingua"
      >
        {current.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className={cn(dropdownCls, "right-0 w-28")}>
          {languages.map((lang) => (
            <Link key={lang.code} href={`/${lang.code}${pathWithoutLocale}`} onClick={() => setOpen(false)} className={itemCls(lang.code)}>
              {lang.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ── User Menu (desktop) ───────────────────────────────────────────────────────

const UserMenu = ({
  member,
  onLogout,
  logoutLabel,
}: {
  member: AuthMember;
  onLogout: () => void;
  logoutLabel: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  const initials =
    (member.firstName.charAt(0) + member.lastName.charAt(0)).toUpperCase() || "?";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-[2px] border border-borgogna/30 bg-borgogna/5 px-3 py-1.5 text-xs font-semibold text-borgogna hover:bg-borgogna/10 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center justify-center h-5 w-5 rounded-sm bg-borgogna text-bianco-caldo text-[10px] font-bold">
          {initials}
        </span>
        <span className="max-w-[80px] truncate">{member.firstName}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-[2px] border border-borgogna/20 bg-bianco-caldo shadow-lg z-[60] overflow-hidden">
          <div className="px-4 py-3 border-b border-borgogna/10">
            <p className="text-xs font-semibold text-borgogna truncate">
              {member.firstName} {member.lastName}
            </p>
            <p className="text-[11px] text-marrone-scuro/50 truncate mt-0.5">{member.email}</p>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); onLogout(); }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-marrone-scuro/70 hover:bg-borgogna/5 hover:text-borgogna transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {logoutLabel}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Header ────────────────────────────────────────────────────────────────────

export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  // Fetch auth state once on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.hasIdentity && data.member) {
          setAuth({ status: "logged-in", member: data.member });
        } else {
          setAuth({ status: "logged-out" });
        }
      })
      .catch(() => setAuth({ status: "logged-out" }));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAuth({ status: "logged-out" });
      // Full reload so any server components re-render without the session
      window.location.href = `/${locale}`;
    }
  }, [locale]);

  const navLinks = [
    { href: `/${locale}/cene`, label: t("dinners") },
    { href: `/${locale}/chefs`, label: t("chefs") },
    { href: `/${locale}/partners`, label: t("partners") },
    { href: `/${locale}/gallery`, label: t("gallery") },
    { href: `/${locale}/social`, label: t("instagram") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Desktop / tablet header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-bianco-caldo border-b border-borgogna/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Enotempo — home"
          >
            <Image
              src="/brand/enotempo-logo.svg"
              alt="Enotempo"
              width={180}
              height={40}
              className="h-8 md:h-9 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-9" aria-label="Navigazione principale">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors whitespace-nowrap relative group",
                  isActive(link.href)
                    ? "text-borgogna font-semibold"
                    : "text-marrone-scuro/70 hover:text-borgogna"
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute -bottom-1 left-0 h-px bg-borgogna transition-all duration-200",
                    isActive(link.href) ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            ))}
          </nav>

          {/* Desktop right: locale switcher + auth + hamburger (mobile) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-3">
              <LanguageSwitcher variant="desktop" />

              {/* Auth section */}
              {auth.status === "logged-out" && (
                <Link
                  href={`/${locale}/accedi-fenam`}
                  className="inline-flex items-center gap-1.5 rounded-[2px] border-2 border-borgogna bg-transparent px-3 py-1.5 text-xs font-semibold text-borgogna hover:bg-borgogna/5 transition-colors whitespace-nowrap"
                >
                  <User className="h-3.5 w-3.5" />
                  {t("login")}
                </Link>
              )}
              {auth.status === "logged-in" && (
                <UserMenu
                  member={auth.member}
                  onLogout={handleLogout}
                  logoutLabel={t("logout")}
                />
              )}
              {/* loading → niente (evita flash) */}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden inline-flex items-center justify-center rounded-[2px] border border-borgogna/25 p-2 text-marrone-scuro hover:bg-borgogna/5 transition-colors"
              aria-label="Apri menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile full-screen menu ─────────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-[200] bg-borgogna flex flex-col lg:hidden",
          "transition-all duration-300 ease-in-out",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-crema/15">
          <Link href={`/${locale}`} onClick={() => setMobileOpen(false)} aria-label="Enotempo — home">
            <Image
              src="/brand/enotempo-icon.svg"
              alt="Enotempo"
              width={36}
              height={36}
              className="h-9 w-9"
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-[2px] border border-crema/30 p-2 text-crema hover:bg-crema/10 transition-colors"
            aria-label="Chiudi menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links — large, centered */}
        <nav className="flex flex-col items-center justify-center flex-1 gap-2 px-8 overflow-y-auto" aria-label="Navigazione mobile">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "font-serif text-3xl sm:text-4xl font-medium py-3 transition-opacity",
                isActive(link.href) ? "text-crema" : "text-crema/60 hover:text-crema"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Bottom: auth + locale switcher */}
        <div className="px-6 py-6 border-t border-crema/15 space-y-4">
          {/* Auth row */}
          {auth.status === "logged-out" && (
            <Link
              href={`/${locale}/accedi-fenam`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full rounded-[2px] border-2 border-crema/50 bg-transparent px-4 py-3 text-sm font-semibold text-crema hover:bg-crema/10 transition-colors"
            >
              <User className="h-4 w-4" />
              {t("login")}
            </Link>
          )}
          {auth.status === "logged-in" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-8 w-8 rounded-sm bg-crema text-borgogna text-xs font-bold">
                  {(auth.member.firstName.charAt(0) + auth.member.lastName.charAt(0)).toUpperCase()}
                </span>
                <span className="text-sm text-crema/80">{auth.member.firstName} {auth.member.lastName}</span>
              </div>
              <button
                type="button"
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="flex items-center gap-1.5 text-sm text-crema/50 hover:text-crema transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </button>
            </div>
          )}

          {/* Locale switcher */}
          <LanguageSwitcher variant="mobile" />
        </div>
      </div>
    </>
  );
}
