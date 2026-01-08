import { getTranslations } from "next-intl/server";
import FenamRegistrationForm from "@/components/fenam/FenamRegistrationForm";

export default async function FenamRegistrationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("fenam");

  return (
    <div className="min-h-screen py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-marrone-scuro mb-4">
            {t("form.title")}
          </h1>
          <p className="text-lg text-marrone-scuro/70 max-w-2xl mx-auto">
            Iscrizione alla Federazione Nazionale di Associazioni Multiculturali (FENAM)
          </p>
        </div>
        <FenamRegistrationForm />
      </div>
    </div>
  );
}

