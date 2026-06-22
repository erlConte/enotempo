import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("privacy");

  const sections = [
    { titleKey: "sections.events.title", bodyKey: "sections.events.body" },
    { titleKey: "sections.general.title", bodyKey: "sections.general.body" },
  ] as const;

  return (
    <div className="min-h-screen bg-bianco-caldo">
      {/* Hero borgogna */}
      <section className="bg-borgogna px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <Eyebrow className="text-verde/70 mb-4">Legal</Eyebrow>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-crema mb-4 leading-tight">
            {t("title")}
          </h1>
          <p className="text-crema/55 text-base max-w-xl mx-auto">
            {t("intro")}
          </p>
        </div>
      </section>

      {/* Sezioni alternate */}
      {sections.map(({ titleKey, bodyKey }, idx) => (
        <Section key={titleKey} bg={idx % 2 === 0 ? "bianco-caldo" : "crema"} py="sm">
          <div className="max-w-3xl">
            <h2 className="font-serif text-xl md:text-2xl font-medium text-borgogna mb-4">
              {t(titleKey)}
            </h2>
            <p className="text-marrone-scuro/80 leading-relaxed text-base md:text-lg">
              {t(bodyKey)}
            </p>
          </div>
        </Section>
      ))}
    </div>
  );
}
