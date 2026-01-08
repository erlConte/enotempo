import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./lib/i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  // Definisce le rotte da internationalizzare, escludendo asset e API
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};

