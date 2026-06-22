import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default async function RegolePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("regole");

  const rules = [
    { titleKey: "punctualityTitle", bodyKey: "punctuality" },
    { titleKey: "allergiesTitle", bodyKey: "allergies" },
    { titleKey: "extraPaidTitle", bodyKey: "extraPaid" },
    { titleKey: "limitedSeatsTitle", bodyKey: "limitedSeats" },
  ] as const;

  return (
    <div className="min-h-screen bg-bianco-caldo">
      {/* Hero borgogna */}
      <section className="bg-borgogna px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <Eyebrow className="text-verde/70 mb-4">Partecipazione</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-crema">
            {t("title")}
          </h1>
        </div>
      </section>

      {/* Intro */}
      <Section bg="bianco-caldo" py="sm">
        <p className="text-base md:text-lg text-marrone-scuro/70 max-w-3xl">
          {t("intro")}
        </p>
      </Section>

      {/* Regole alternate bianco/crema */}
      {rules.map(({ titleKey, bodyKey }, idx) => (
        <Section key={titleKey} bg={idx % 2 === 0 ? "crema" : "bianco-caldo"} py="sm">
          <div className="max-w-3xl">
            <h2 className="font-serif text-xl md:text-2xl font-medium text-borgogna mb-3">
              {t(titleKey)}
            </h2>
            <p className="text-marrone-scuro/80 leading-relaxed">{t(bodyKey)}</p>
          </div>
        </Section>
      ))}
    </div>
  );
}
