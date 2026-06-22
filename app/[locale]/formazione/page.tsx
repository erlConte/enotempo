import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default async function FormazionePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("formazione");

  return (
    <div className="min-h-screen bg-bianco-caldo">
      {/* Hero borgogna */}
      <section className="bg-borgogna px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <Eyebrow className="text-verde/70 mb-4">Cultura</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-crema mb-4">
            {t("title")}
          </h1>
          <p className="text-crema/60 text-base md:text-lg max-w-xl mx-auto">
            {t("intro")}
          </p>
        </div>
      </section>

      {/* Contenuto */}
      <Section bg="bianco-caldo" py="md">
        <div className="max-w-3xl">
          <SectionHeading
            title={t("pilloleTitle")}
            align="left"
            className="mb-8"
          />
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-marrone-scuro/75 text-base">
              <span className="mt-2 w-1.5 h-1.5 rounded-[1px] bg-verde shrink-0" />
              {t("pillolePlaceholder")}
            </li>
          </ul>
        </div>
      </Section>
    </div>
  );
}
