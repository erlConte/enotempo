import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, FENAM_SESSION_COOKIE } from "@/lib/fenam-handoff";
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

  const paypalConfigured = !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

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
            {!paypalConfigured ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center text-marrone-scuro">
                <p className="font-medium">Pagamento temporaneamente non disponibile.</p>
                <p className="text-sm mt-1">Contatta il supporto per completare la prenotazione.</p>
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
