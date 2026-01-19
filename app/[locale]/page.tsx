import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NextDinnerPopup from "@/components/home/NextDinnerPopup";
import NewsletterForm from "@/components/home/NewsletterForm";

export const revalidate = 0;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("hero");
  const tHome = await getTranslations("home");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="w-full relative min-h-[520px] flex items-center justify-center px-4 py-12 md:py-20"
        style={{
          backgroundImage: "url(https://8ud5gz3z3ejgzjpg.public.blob.vercel-storage.com/gallery/logo-borgogna-UgcW4ZgaHLzDGdpjkjcwqNF67u6TP1.jpg)",
          backgroundRepeat: "repeat",
          backgroundSize: "800px auto",
          backgroundPosition: "center",
          backgroundAttachment: "scroll"
        }}
      >
        {/* Overlay per leggibilità */}
        <div className="absolute inset-0 bg-bianco-caldo/80 backdrop-blur-[1px]" />
        
        {/* Contenuto centrato */}
        <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center text-center mt-[330px] md:mt-[394px]">
          {/* Testo centrato */}
          <p className="max-w-2xl text-lg md:text-xl text-marrone-scuro/90 font-medium mb-10">
            {t("subtitle")}
          </p>

          {/* Bottoni: riga su desktop, colonna su mobile */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            <Link
              href={`/${locale}/cene`}
              className="inline-flex items-center justify-center rounded-full bg-borgogna px-8 py-3 text-base font-semibold text-bianco-caldo shadow-sm hover:bg-borgogna/90 transition-colors"
            >
              {t("ctaPrimary")}
            </Link>

            <Link
              href={`/${locale}/about`}
              className="inline-flex items-center justify-center rounded-full border border-borgogna px-8 py-3 text-base font-semibold text-borgogna hover:bg-borgogna/10 transition-colors"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-borgogna mb-16 text-center">
            {tHome("howItWorks.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step) => (
              <Card
                key={step}
                className="border-0 shadow-sm rounded-2xl bg-bianco-caldo hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-full bg-borgogna/10 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-borgogna">{step}</span>
                  </div>
                  <CardTitle className="font-serif text-2xl text-borgogna">
                    {tHome(`howItWorks.step${step}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-marrone-scuro/70 leading-relaxed">
                    {tHome(`howItWorks.step${step}.description`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Chi è Enotempo */}
      <section className="py-20 px-4 bg-bianco-caldo">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-borgogna mb-8">
              Chi è Enotempo
            </h2>
            <div className="max-w-4xl mx-auto space-y-6 text-left">
              <p className="text-lg md:text-xl text-marrone-scuro/80 leading-relaxed">
                Enotempo nasce come uno spazio d&apos;incontro tra le tradizioni della comunità latinoamericana presente in Italia e le eccellenze del territorio italiano.
              </p>
              <p className="text-lg md:text-xl text-marrone-scuro/80 leading-relaxed">
                Crediamo che il cibo, il vino e le storie siano ponti culturali capaci di unire persone, ricordi e identità. Per questo, il nostro progetto celebra l&apos;autenticità dei sapori, la ricchezza delle culture e la bellezza della condivisione.
              </p>
              <p className="text-lg md:text-xl text-marrone-scuro/80 leading-relaxed">
                Siamo un gruppo appassionato di enogastronomia, cultura e narrazione: professionisti, creativi e amanti del buon vivere che desiderano creare esperienze che restano nella memoria. Ogni nostro evento nasce dal desiderio di valorizzare ciò che è vero, locale e significativo, unendo due mondi che convivono ogni giorno nelle città italiane: l&apos;anima vibrante dell&apos;America Latina e l&apos;eleganza del patrimonio italiano.
              </p>
            </div>

            {/* Cosa facciamo */}
            <div className="mt-16 max-w-4xl mx-auto text-left">
              <h3 className="font-serif text-3xl md:text-4xl font-bold text-borgogna mb-6">
                Cosa facciamo
              </h3>
              <p className="text-lg md:text-xl text-marrone-scuro/80 leading-relaxed mb-6">
                In Enotempo curiamo esperienze enogastronomiche che raccontano le tradizioni latinoamericane attraverso il dialogo con i prodotti italiani d&apos;eccellenza. Non proponiamo semplici degustazioni: creiamo eventi multisensoriali in cui vino, gastronomia e cultura si intrecciano per offrire momenti autentici e profondi.
              </p>
              <ul className="list-disc list-inside space-y-3 text-lg md:text-xl text-marrone-scuro/80 leading-relaxed ml-4">
                <li>Eventi di degustazione eno-gastronomica con vini italiani e latinoamericani abbinati a piatti tipici, raccontati con storie e identità culturali.</li>
                <li>Percorsi tematici e narrativi che combinano sapori, musica, tradizioni e racconti per un viaggio che stimola i sensi e la memoria.</li>
                <li>Collaborazioni con produttori, chef e realtà culturali per creare esperienze eleganti, educative e ricche di contenuto.</li>
                <li>Promozione della cultura latinoamericana attraverso format creativi che celebrano le radici e valorizzano l&apos;incontro tra culture.</li>
              </ul>
            </div>

            {/* Link a Chi siamo */}
            <div className="mt-12">
              <Link href={`/${locale}/about`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-borgogna text-borgogna hover:bg-borgogna hover:text-bianco-caldo px-8 py-6 text-lg rounded-2xl shadow-sm"
                >
                  Scopri di più su Enotempo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Box Donazioni */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <Card className="border-2 border-borgogna/20 rounded-2xl shadow-sm bg-bianco-caldo">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-serif text-3xl md:text-4xl text-borgogna">
                {tHome("donationBox.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg md:text-xl text-marrone-scuro/80 leading-relaxed max-w-3xl mx-auto">
                {tHome("donationBox.description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 px-4 bg-bianco-caldo">
        <div className="container mx-auto max-w-3xl">
          <Card className="border-0 shadow-sm rounded-2xl bg-white">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-serif text-3xl md:text-4xl text-borgogna">
                {tHome("newsletter.title")}
              </CardTitle>
              <p className="text-base md:text-lg text-marrone-scuro/70 mt-2">
                {tHome("newsletter.description")}
              </p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <NewsletterForm />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Popup prossima cena */}
      <NextDinnerPopup locale={locale} />
    </div>
  );
}

