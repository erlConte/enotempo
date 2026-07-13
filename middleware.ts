import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./lib/i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  // Definisce le rotte da internationalizzare, escludendo asset e API.
  // ".*\\..*" esclude qualunque path con un'estensione (immagini in /public,
  // font, ecc.): senza questo, il middleware li reindirizzava aggiungendo il
  // prefisso locale (es. /makodish.jpg -> /it/makodish.jpg), rompendo tutte
  // le immagini statiche referenziate con path assoluto.
  matcher: [
    '/((?!api|_next|favicon.ico|.*\\..*).*)'
  ]
};

