import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { locales } from "@/lib/i18n/config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validazione della locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // **Abilita il rendering statico** fissando la locale corrente:
  setRequestLocale(locale);

  // Carica i messaggi di traduzione per la locale (da file JSON)
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${cormorantGaramond.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

