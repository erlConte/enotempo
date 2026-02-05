import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, FENAM_SESSION_COOKIE, isPlaceholderEmail } from "@/lib/fenam-handoff";

export const dynamic = "force-dynamic";

export default async function ConfermaPage({
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
                Per vedere la conferma devi accedere con FENAM.
              </p>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild className="bg-borgogna text-bianco-caldo hover:bg-borgogna/90">
                <Link href={`/${locale}/accedi-fenam?returnUrl=${encodeURIComponent(`/${locale}/conferma/${reservationId}`)}`}>
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

  const tConferma = await getTranslations("conferma");
  const event = reservation.event;
  const memberEmail = reservation.fenamMember?.email ?? "";
  const emailWasNotSent = !memberEmail || isPlaceholderEmail(memberEmail);
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

  if (reservation.status !== "confirmed") {
    return (
      <div className="min-h-screen bg-bianco-caldo py-12 px-4">
        <div className="container mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-borgogna text-center">
                Pagamento non completato
              </CardTitle>
              <p className="text-center text-marrone-scuro mt-2">
                La prenotazione non risulta ancora pagata. Completa il pagamento per confermare.
              </p>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild className="bg-borgogna text-bianco-caldo hover:bg-borgogna/90">
                <Link href={`/${locale}/paga/${reservationId}`}>
                  Vai al pagamento
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bianco-caldo py-12 px-4">
      <div className="container mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-3xl text-borgogna text-center">
              Prenotazione confermata
            </CardTitle>
            <p className="text-center text-marrone-scuro font-semibold mt-2">
              {event.title}
            </p>
            <p className="text-center text-marrone-scuro/80 text-sm mt-1">
              {eventDate}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl bg-verde/10 border border-verde/30 p-4 text-center">
              <p className="text-sm text-marrone-scuro/80">Codice di conferma</p>
              <p className="text-2xl font-mono font-bold text-borgogna mt-1">
                {reservation.confirmationCode ?? "—"}
              </p>
            </div>
            <div className="text-marrone-scuro space-y-2 text-sm">
              <p>
                <strong>Contatti:</strong> per modifiche o informazioni contatta gli organizzatori.
              </p>
              {emailWasNotSent && (
                <p className="text-marrone-scuro/80 text-sm">
                  {tConferma("emailNotSent")}
                </p>
              )}
              {reservation.notes && (
                <p>
                  <strong>Note / allergie:</strong> {reservation.notes}
                </p>
              )}
            </div>
            <div className="pt-4 flex justify-center">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/${locale}/cene/${event.slug}`}>
                  Torna all&apos;evento
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
