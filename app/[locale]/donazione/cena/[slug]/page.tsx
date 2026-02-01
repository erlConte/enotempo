/**
 * DEPRECATO: la prenotazione ora richiede pagamento obbligatorio prima della conferma.
 * Redirect a /cene/[slug] con messaggio informativo.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CenaDonationPageDeprecated({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  redirect(`/${locale}/cene/${slug}?donazione=deprecata`);
}
