import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function FenamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const t = await getTranslations("fenam");

  return (
    <div className="min-h-screen bg-gray-50">
      <NextIntlClientProvider messages={messages}>
        {/* Top Bar FENAM - Look istituzionale */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-6 py-5">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">F</span>
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 tracking-tight">
                      FENAM
                    </h1>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">
                      {locale === "it"
                        ? "Federazione Nazionale di Associazioni Multiculturali"
                        : locale === "en"
                        ? "National Federation of Multicultural Associations"
                        : "Federación Nacional de Asociaciones Multiculturales"}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/${locale}`}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium self-start md:self-center"
                >
                  {locale === "it"
                    ? "← Torna a Enotempo"
                    : locale === "en"
                    ? "← Back to Enotempo"
                    : "← Volver a Enotempo"}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <main className="bg-gray-50">{children}</main>
      </NextIntlClientProvider>
    </div>
  );
}

