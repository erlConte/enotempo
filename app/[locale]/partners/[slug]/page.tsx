import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPartnerBySlug, getPartners } from "@/lib/partners";
import { locales } from "@/lib/i18n/config";

export function generateStaticParams() {
  const partners = getPartners();
  const slugs = partners.map((partner) => partner.slug);
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("partners");
  const partner = getPartnerBySlug(slug);

  if (!partner) notFound();

  const sections = [
    { key: "whyEnotempo", titleKey: "detail.whyTitle", content: partner.whyEnotempo },
    { key: "about", titleKey: "detail.aboutTitle", content: partner.about },
    { key: "expectations", titleKey: "detail.expectationsTitle", content: partner.expectations },
  ].filter((s) => s.content);

  return (
    <div className="min-h-screen bg-bianco-caldo">
      {/* Hero borgogna */}
      <section className="bg-borgogna px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-4xl">
          <p className="text-verde/80 text-[11px] font-semibold uppercase tracking-[.22em] mb-4">
            {t("pageTitle")}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-crema mb-4">
            {partner.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-crema/60 text-sm">
            <span>{t(`type.${partner.type}`)}</span>
            <span className="text-crema/30">·</span>
            <span>{partner.city}, {partner.country}</span>
          </div>
        </div>
      </section>

      {/* Sezioni contenuto alternate */}
      {sections.map(({ key, titleKey, content }, idx) => (
        <Section key={key} bg={idx % 2 === 0 ? "bianco-caldo" : "crema"} py="sm">
          <div className="max-w-3xl">
            <h2 className="font-serif text-xl md:text-2xl font-medium text-borgogna mb-4">
              {t(titleKey as Parameters<typeof t>[0])}
            </h2>
            <p className="text-marrone-scuro/85 leading-relaxed text-base">
              {content}
            </p>
          </div>
        </Section>
      ))}

      {/* Back link */}
      <Section bg={sections.length % 2 === 0 ? "bianco-caldo" : "crema"} py="sm">
        <div className="flex justify-start">
          <Link
            href={`/${locale}/partners`}
            className="inline-flex items-center gap-2 rounded-[2px] border-2 border-borgogna bg-transparent px-5 py-2.5 text-sm font-medium text-borgogna hover:bg-borgogna/5 transition-colors"
          >
            ← {t("detail.backToList")}
          </Link>
        </div>
      </Section>
    </div>
  );
}
