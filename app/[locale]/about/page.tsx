import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getChefs } from "@/lib/chefs";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("about");
  const tChefs = await getTranslations("chefs");
  const chefs = getChefs().slice(0, 2); // Prendi i primi 2 chef

  return (
    <div className="min-h-screen bg-bianco-caldo py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* H1 Title */}
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-borgogna mb-6">
            {t("title")}
          </h1>
        </div>

        {/* Sezione Chi siamo */}
        <Card className="border-0 shadow-sm rounded-2xl bg-white mb-8">
          <CardHeader>
            <CardTitle className="font-serif text-3xl md:text-4xl text-borgogna mb-4">
              {t("sections.whoWeAre.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              Enotempo nasce come uno spazio d&apos;incontro tra le tradizioni della comunità latinoamericana presente in Italia e le eccellenze del territorio italiano.
            </p>
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              Crediamo che il cibo, il vino e le storie siano ponti culturali capaci di unire persone, ricordi e identità. Per questo, il nostro progetto celebra l&apos;autenticità dei sapori, la ricchezza delle culture e la bellezza della condivisione.
            </p>
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              Siamo un gruppo appassionato di enogastronomia, cultura e narrazione: professionisti, creativi e amanti del buon vivere che desiderano creare esperienze che restano nella memoria. Ogni nostro evento nasce dal desiderio di valorizzare ciò che è vero, locale e significativo, unendo due mondi che convivono ogni giorno nelle città italiane: l&apos;anima vibrante dell&apos;America Latina e l&apos;eleganza del patrimonio italiano.
            </p>
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              Enotempo non è solo un marchio: è un viaggio sensoriale fatto di emozioni, incontri e scoperta.
            </p>
          </CardContent>
        </Card>

        {/* Sezione Cosa facciamo */}
        <Card className="border-0 shadow-sm rounded-2xl bg-white mb-8">
          <CardHeader>
            <CardTitle className="font-serif text-3xl md:text-4xl text-borgogna mb-4">
              {t("sections.whatWeDo.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              In Enotempo curiamo esperienze enogastronomiche che raccontano le tradizioni latinoamericane attraverso il dialogo con i prodotti italiani d&apos;eccellenza. Non proponiamo semplici degustazioni: creiamo eventi multisensoriali in cui vino, gastronomia e cultura si intrecciano per offrire momenti autentici e profondi.
            </p>
            <p className="text-marrone-scuro/80 leading-relaxed text-lg font-semibold">
              Cosa realizziamo concretamente:
            </p>
            <ul className="list-disc list-inside space-y-3 text-marrone-scuro/80 leading-relaxed text-lg ml-4">
              <li>Eventi di degustazione eno-gastronomica dove selezioniamo vini italiani e latinoamericani abbinati a piatti tipici, raccontati con storie, significati e identità culturali.</li>
              <li>Percorsi tematici e narrativi che combinano sapori, musica, tradizioni e racconti per immergere i partecipanti in un viaggio che stimola i sensi e la memoria.</li>
              <li>Collaborazioni con produttori, chef e realtà culturali per creare esperienze eleganti, educative e ricche di contenuto, in cui ogni dettaglio è curato con raffinatezza.</li>
              <li>Promozione della cultura latinoamericana attraverso format creativi che celebrano le radici, rafforzano il senso di comunità e valorizzano l&apos;incontro tra culture.</li>
            </ul>
            <p className="text-marrone-scuro/80 leading-relaxed text-lg mt-6">
              Ogni evento è pensato come un momento di connessione: tra persone, tra tradizioni, tra storie. Il nostro obiettivo è trasformare ogni calice e ogni assaggio in un ponte che unisce l&apos;Italia all&apos;America Latina.
            </p>
          </CardContent>
        </Card>

        {/* Sezione Missione */}
        <Card className="border-0 shadow-sm rounded-2xl bg-white mb-8">
          <CardHeader>
            <CardTitle className="font-serif text-3xl md:text-4xl text-borgogna mb-4">
              {t("sections.mission.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              La nostra missione è valorizzare il patrimonio gastronomico e culturale dell&apos;America Latina in dialogo con le eccellenze italiane, creando esperienze che uniscono persone, tradizioni e sapori.
            </p>
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              Attraverso eventi enogastronomici curati nei dettagli, desideriamo educare al gusto, emozionare con storie autentiche e promuovere una cultura dell&apos;incontro capace di avvicinare comunità diverse.
            </p>
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              Ogni nostra iniziativa nasce dal desiderio di costruire ponti: tra territori, tra memorie, tra sensibilità. Crediamo che il vino, il cibo e la narrazione possano diventare linguaggi universali di connessione e scoperta.
            </p>
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              Per questo ci impegniamo a offrire esperienze profonde, eleganti e ricche di significato, dove ogni prodotto racconta un&apos;origine e ogni abbinamento apre un nuovo orizzonte.
            </p>
          </CardContent>
        </Card>

        {/* Sezione Visione */}
        <Card className="border-0 shadow-sm rounded-2xl bg-white mb-8">
          <CardHeader>
            <CardTitle className="font-serif text-3xl md:text-4xl text-borgogna mb-4">
              {t("sections.vision.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              Vogliamo diventare un punto di riferimento in Italia per la promozione culturale ed enogastronomica latinoamericana, creando una rete di eventi, collaborazioni e progetti che celebrino la ricchezza delle nostre radici e la bellezza del dialogo interculturale.
            </p>
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              La nostra visione è quella di consolidare uno spazio riconosciuto e stimato in cui le eccellenze italiane e latinoamericane possano incontrarsi, fondersi e generare nuove forme di creatività, convivialità e apprendimento.
            </p>
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              Aspiriamo a portare Enotempo nei luoghi più emblematici del Paese, trasformando ogni appuntamento in un&apos;esperienza che susciti emozioni autentiche, favorisca connessioni durature e alimenti un senso di comunità tra le diverse culture che vivono in Italia.
            </p>
          </CardContent>
        </Card>

        {/* Sezione I nostri chef */}
        <Card className="border-0 shadow-sm rounded-2xl bg-white mb-12">
          <CardHeader>
            <CardTitle className="font-serif text-3xl md:text-4xl text-borgogna mb-4">
              {tChefs("aboutSection.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-marrone-scuro/80 leading-relaxed text-lg">
              {tChefs("aboutSection.subtitle")}
            </p>
            {chefs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {chefs.map((chef) => (
                  <Card
                    key={chef.slug}
                    className="rounded-2xl border border-marrone-scuro/5 bg-bianco-caldo shadow-sm"
                  >
                    <CardContent className="pt-6 pb-6 px-6 flex flex-col items-center text-center gap-3">
                      <div className="relative h-20 w-20 rounded-full overflow-hidden border border-marrone-scuro/10 bg-white">
                        <Image
                          src={chef.photoPath}
                          alt={chef.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg text-borgogna font-semibold">
                          {chef.name}
                        </h3>
                        <p className="text-xs text-marrone-scuro/70 mt-1">
                          {chef.role}
                        </p>
                      </div>
                      <p className="text-sm text-marrone-scuro/80 leading-relaxed">
                        {chef.shortBio}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="text-center mt-6">
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-borgogna text-borgogna hover:bg-borgogna hover:text-bianco-caldo"
              >
                <Link href={`/${locale}/chefs`}>
                  {tChefs("aboutSection.cta")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Link contatti */}
        <div className="text-center">
          <p className="text-marrone-scuro/70 text-lg mb-6">
            Vuoi contattarci?
          </p>
          <Link href={`/${locale}/contact`}>
            <Button
              size="lg"
              className="bg-borgogna text-bianco-caldo hover:bg-borgogna/90 font-semibold px-8 py-6 text-lg rounded-2xl shadow-sm"
            >
              Contattaci
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

