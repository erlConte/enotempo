import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";
import { getPayPalConfigStatus } from "@/lib/paypal";
import PayPalButtonWrapper from "./PayPalButtonWrapper";

export const dynamic = "force-dynamic";

export default async function PagaPage({
  params,
}: {
  params: Promise<{ locale: string; reservationId: string }>;
}) {
  const { locale, reservationId } = await params;
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(FENAM_SESSION_COOKIE)?.value;
  const session = verifySessionToken(cookieValue);

  if (!session) {
    return (
      <div className="min-h-screen bg-bianco-caldo py-12 px-4">
        <div className="container mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-borgogna text-center">
                Pagamento prenotazione
              </CardTitle>
              <p className="text-center text-marrone-scuro mt-2">
                Per completare il pagamento devi accedere con FENAM.
              </p>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild className="bg-borgogna text-bianco-caldo hover:bg-borgogna/90">
                <Link href={`/${locale}/accedi-fenam?returnUrl=${encodeURIComponent(`/${locale}/paga/${reservationId}`)}`}>
                  Accedi / Iscriviti con FENAM
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { event: true, fenamMember: true },
  });

  if (!reservation || reservation.fenamMemberId !== session.fenamMemberId) {
    notFound();
  }

  if (reservation.status === "confirmed") {
    return (
      <div className="min-h-screen bg-bianco-caldo py-12 px-4">
        <div className="container mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-borgogna text-center">
                Pagamento già completato
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-marrone-scuro">
                La tua prenotazione è già stata confermata.
              </p>
              <Button asChild className="bg-borgogna text-bianco-caldo hover:bg-borgogna/90">
                <Link href={`/${locale}/conferma/${reservationId}`}>
                  Vai alla pagina di conferma
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (reservation.status !== "pending_payment") {
    notFound();
  }

  const event = reservation.event;
  const eventDate = event.date
    ? new Intl.DateTimeFormat("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(event.date))
    : "";

  const amount =
    event.priceCents != null ? (event.priceCents / 100).toFixed(2) : "75.00";

  const paypalStatus = getPayPalConfigStatus();

  return (
    <div className="min-h-screen bg-bianco-caldo py-12 px-4">
      <div className="container mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-3xl text-borgogna text-center">
              Completa il pagamento
            </CardTitle>
            <p className="text-center text-marrone-scuro font-semibold mt-2">
              {event.title}
            </p>
            <p className="text-center text-marrone-scuro/80 text-sm mt-1">
              {eventDate}
            </p>
            <p className="text-center text-marrone-scuro font-medium mt-2">
              Importo: {amount} €
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!paypalStatus.configured ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center text-marrone-scuro">
                <p className="font-medium">Pagamento non disponibile. Riprova più tardi.</p>
                <p className="text-sm mt-1">Contatta il supporto se il problema persiste.</p>
                {paypalStatus.missing.length > 0 && (
                  <details className="mt-3 text-left text-xs text-marrone-scuro/70">
                    <summary>Dettagli tecnici</summary>
                    <ul className="mt-1 list-disc list-inside">
                      {paypalStatus.missing.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ) : (
              <PayPalButtonWrapper
                reservationId={reservationId}
                locale={locale}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
