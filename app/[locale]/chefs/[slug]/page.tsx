import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getChefBySlug, getChefs } from "@/lib/chefs";
import { locales } from "@/lib/i18n/config";

export function generateStaticParams() {
  const chefs = getChefs();
  const slugs = chefs.map((chef) => chef.slug);
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export default async function ChefDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("chefs");
  const chef = getChefBySlug(slug);

  if (!chef) notFound();

  return (
    <div className="min-h-screen bg-bianco-caldo">
      {/* Hero borgogna */}
      <section className="bg-borgogna px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="relative h-40 w-40 md:h-52 md:w-52 rounded-[2px] overflow-hidden border-2 border-crema/20 shrink-0">
              <Image
                src={chef.photoPath}
                alt={chef.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <p className="text-verde/80 text-[11px] font-semibold uppercase tracking-[.22em] mb-3">
                {t("pageTitle")}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-crema mb-3">
                {chef.name}
              </h1>
              <p className="text-crema/65 text-base md:text-lg">
                {chef.role}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bio */}
      <Section bg="bianco-caldo" py="md">
        <div className="max-w-3xl">
          <p className="text-marrone-scuro/85 leading-relaxed text-base md:text-lg">
            {chef.fullBio}
          </p>
        </div>
      </Section>

      {/* Back link */}
      <Section bg="crema" py="sm">
        <div className="flex justify-start">
          <Link
            href={`/${locale}/chefs`}
            className="inline-flex items-center gap-2 rounded-[2px] border-2 border-borgogna bg-transparent px-5 py-2.5 text-sm font-medium text-borgogna hover:bg-borgogna/5 transition-colors"
          >
            ← {t("detail.backToList")}
          </Link>
        </div>
      </Section>
    </div>
  );
}
