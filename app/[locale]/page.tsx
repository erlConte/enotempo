import { getTranslations } from "next-intl/server";
import NextDinnerPopup from "@/components/home/NextDinnerPopup";
import NewsletterForm from "@/components/home/NewsletterForm";
import InstagramFeed from "@/components/home/InstagramFeed";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getNextUpcomingEvent } from "@/lib/events";

// ISR: rigenera ogni 60 secondi per bilanciare performance e dati aggiornati
export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tHome = await getTranslations("home");
  const nextEventFromDb = await getNextUpcomingEvent();

  if (process.env.NODE_ENV === "development") {
    if (nextEventFromDb) {
      console.log("[DEBUG] getNextUpcomingEvent() returned:", {
        id: nextEventFromDb.id,
        slug: nextEventFromDb.slug,
        dateISO: nextEventFromDb.date.toISOString(),
        dateTimestamp: nextEventFromDb.date.getTime(),
        status: nextEventFromDb.status,
      });
    } else {
      console.log("[DEBUG] getNextUpcomingEvent() returned: null");
    }
  }

  const nextEvent =
    nextEventFromDb != null
      ? {
          title: nextEventFromDb.title,
          slug: nextEventFromDb.slug,
          date: nextEventFromDb.date.getTime(),
          locationName: nextEventFromDb.locationName,
          locationAddress: nextEventFromDb.locationAddress ?? null,
        }
      : null;

  if (process.env.NODE_ENV === "development" && nextEvent) {
    console.log("[DEBUG] nextEvent passed to popup:", {
      slug: nextEvent.slug,
      dateTimestamp: nextEvent.date,
      dateISO: new Date(nextEvent.date).toISOString(),
    });
  }

  return (
    <div className="min-h-screen">
      {/* ── Chi è Enotempo ───────────────────────────────────────────── */}
      <Section id="chi-siamo" bg="bianco-caldo" py="lg">
        <SectionHeading
          eyebrow="Chi siamo"
          title="Chi è Enotempo"
          align="center"
          className="mb-12"
        />
        <div className="max-w-4xl mx-auto space-y-6 text-left">
          <p className="text-lg md:text-xl text-marrone-scuro/80 leading-relaxed">
            Enotempo nasce come uno spazio d&apos;incontro tra le tradizioni della comunità latinoamericana
            presente in Italia e le eccellenze del territorio italiano.
          </p>
          <p className="text-lg md:text-xl text-marrone-scuro/80 leading-relaxed">
            Crediamo che il cibo, il vino e le storie siano ponti culturali capaci di unire persone, ricordi
            e identità. Per questo, il nostro progetto celebra l&apos;autenticità dei sapori, la ricchezza
            delle culture e la bellezza della condivisione.
          </p>
          <p className="text-lg md:text-xl text-marrone-scuro/80 leading-relaxed">
            Siamo un gruppo appassionato di enogastronomia, cultura e narrazione: professionisti, creativi e
            amanti del buon vivere che desiderano creare esperienze che restano nella memoria. Ogni nostro
            evento nasce dal desiderio di valorizzare ciò che è vero, locale e significativo, unendo due
            mondi che convivono ogni giorno nelle città italiane: l&apos;anima vibrante dell&apos;America
            Latina e l&apos;eleganza del patrimonio italiano.
          </p>
        </div>

        {/* Cosa facciamo */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="font-serif text-2xl md:text-3xl font-medium text-borgogna mb-6">
            Cosa facciamo
          </h3>
          <p className="text-lg md:text-xl text-marrone-scuro/80 leading-relaxed mb-4">
            In Enotempo curiamo esperienze enogastronomiche che raccontano le tradizioni latinoamericane
            attraverso il dialogo con i prodotti italiani d&apos;eccellenza. Non proponiamo semplici
            degustazioni: creiamo eventi multisensoriali in cui vino, gastronomia e cultura si intrecciano
            per offrire momenti autentici e profondi.
          </p>
          <p className="text-lg md:text-xl text-marrone-scuro/80 leading-relaxed mb-6">
            {tHome("formatText")}
          </p>
          <ul className="space-y-3 text-lg md:text-xl text-marrone-scuro/80 leading-relaxed">
            {[
              "Eventi di degustazione eno-gastronomica con vini italiani e latinoamericani abbinati a piatti tipici, raccontati con storie e identità culturali.",
              "Percorsi tematici e narrativi che combinano sapori, musica, tradizioni e racconti per un viaggio che stimola i sensi e la memoria.",
              "Collaborazioni con produttori, chef e realtà culturali per creare esperienze eleganti, educative e ricche di contenuto.",
              "Promozione della cultura latinoamericana attraverso format creativi che celebrano le radici e valorizzano l'incontro tra culture.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 rounded-[1px] bg-verde shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── Instagram Feed (ha il proprio <Section bg="crema">) ──────── */}
      <InstagramFeed locale={locale} />

      {/* ── Come funziona ────────────────────────────────────────────── */}
      <Section bg="bianco-caldo" py="lg">
        <SectionHeading
          eyebrow="Percorso"
          title={tHome("howItWorks.title")}
          align="center"
          className="mb-14"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {([1, 2, 3] as const).map((step) => (
            <div key={step} className="flex flex-col">
              <div className="w-14 h-14 rounded-[2px] bg-borgogna/10 flex items-center justify-center mb-6">
                <span className="font-serif text-xl font-medium text-borgogna">{step}</span>
              </div>
              <h3 className="font-serif text-xl md:text-2xl font-medium text-borgogna mb-3">
                {tHome(`howItWorks.step${step}.title`)}
              </h3>
              <p className="text-marrone-scuro/70 leading-relaxed">
                {tHome(`howItWorks.step${step}.description`)}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Donazioni ────────────────────────────────────────────────── */}
      <Section bg="crema" py="md">
        <div className="max-w-3xl mx-auto border border-borgogna/15 rounded-[2px] p-8 md:p-12 text-center">
          <SectionHeading
            eyebrow="Importante"
            title={tHome("donationBox.title")}
            align="center"
            className="mb-4"
          />
          <p className="text-lg text-marrone-scuro/80 leading-relaxed mt-6">
            {tHome("donationBox.description")}
          </p>
        </div>
      </Section>

      {/* ── Newsletter ───────────────────────────────────────────────── */}
      <Section bg="bianco-caldo" py="md">
        <div className="max-w-3xl mx-auto text-center">
          <SectionHeading
            eyebrow="Rimani connesso"
            title={tHome("newsletter.title")}
            align="center"
            className="mb-3"
          />
          <p className="text-marrone-scuro/70 text-base md:text-lg mb-10">
            {tHome("newsletter.description")}
          </p>
          <NewsletterForm />
        </div>
      </Section>

      {/* Popup prossima cena (dati da DB) */}
      <NextDinnerPopup locale={locale} nextEvent={nextEvent} />
    </div>
  );
}
