import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, defaultLocale } from "./lib/i18n/config";

export default getRequestConfig(async ({ requestLocale }) => {
  // Ottiene la locale richiesta (va atteso perché in futuro Next.js la fornirà in modo asincrono)
  let locale = await requestLocale;
  
  // Validazione della locale
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale; // fallback alla lingua di default se locale non supportata
  }

  return {
    locale, // restituiamo esplicitamente la locale selezionata
    messages: (await import(`./messages/${locale}.json`)).default, // forniamo i messaggi di traduzione corrispondenti
  };
});

