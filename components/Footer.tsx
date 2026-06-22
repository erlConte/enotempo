"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Instagram } from "lucide-react";
import { getInstagramHandle } from "@/lib/instagram";

export default function Footer() {
  const locale = useLocale();
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");

  const handle = getInstagramHandle();
  const instagramUrl = `https://www.instagram.com/${handle}/`;

  const exploreLinks = [
    { href: `/${locale}/cene`, label: tNav("dinners") },
    { href: `/${locale}/chefs`, label: tNav("chefs") },
    { href: `/${locale}/partners`, label: tNav("partners") },
    { href: `/${locale}/gallery`, label: tNav("gallery") },
    { href: `/${locale}/social`, label: tNav("instagram") },
  ];

  const infoLinks = [
    { href: `/${locale}/about`, label: tNav("about") },
    { href: `/${locale}/contact`, label: tNav("contact") },
    { href: `/${locale}/privacy`, label: "Privacy" },
    { href: `/${locale}/regole`, label: "Regole" },
  ];

  return (
    <footer className="bg-borgogna text-crema">
      <div className="container mx-auto max-w-6xl px-4 py-14 md:py-20">
        {/* Brand block */}
        <div className="flex flex-col items-center text-center mb-12 md:mb-16">
          <Link href={`/${locale}`} aria-label="Enotempo — home" className="hover:opacity-80 transition-opacity mb-4">
            <Image
              src="/brand/enotempo-icon.svg"
              alt="Enotempo emblema"
              width={52}
              height={52}
              className="h-12 w-12 brightness-[4] saturate-0"
            />
          </Link>
          <p className="font-serif text-2xl font-medium tracking-[.18em] text-crema mb-1">
            ENOTEMPO
          </p>
          <p className="text-xs tracking-[.18em] uppercase text-crema/55">
            {tFooter("tagline")}
          </p>
        </div>

        {/* Thin divider */}
        <div className="w-16 mx-auto h-px bg-crema/20 mb-12 md:mb-16" />

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 md:gap-16 max-w-xs mx-auto md:max-w-sm mb-12 md:mb-16">
          {/* Esplora */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-crema/45 mb-5">
              {tFooter("exploreTitle")}
            </p>
            <ul className="space-y-3">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-crema/70 hover:text-crema transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-crema/45 mb-5">
              {tFooter("infoTitle")}
            </p>
            <ul className="space-y-3">
              {infoLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-crema/70 hover:text-crema transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social icons */}
        <div className="flex justify-center gap-4 mb-12 md:mb-16">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram Enotempo"
            className="flex items-center justify-center h-10 w-10 rounded-[2px] border border-crema/25 text-crema/60 hover:text-crema hover:border-crema/50 transition-colors"
          >
            <Instagram className="h-4 w-4" aria-hidden />
          </a>
        </div>

        {/* Thin divider */}
        <div className="w-full h-px bg-crema/10 mb-8" />

        {/* Copyright + disclaimer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-crema/50">
            © {new Date().getFullYear()} Enotempo. {tFooter("copyright")}
          </p>
          <p className="text-[11px] text-crema/35 max-w-sm mx-auto leading-relaxed">
            {tFooter("donationDisclaimer")}
          </p>
        </div>
      </div>
    </footer>
  );
}
