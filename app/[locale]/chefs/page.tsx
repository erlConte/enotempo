import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getChefs } from "@/lib/chefs";

export default async function ChefsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("chefs");
  const chefs = getChefs();

  return (
    <div className="min-h-screen bg-bianco-caldo py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-borgogna mb-6">
            {t("pageTitle")}
          </h1>
          <p className="text-lg md:text-xl text-marrone-scuro/70 max-w-2xl mx-auto">
            {t("pageSubtitle")}
          </p>
        </div>

        {chefs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-marrone-scuro/70">{t("empty")}</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${chefs.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8`}>
            {chefs.map((chef) => (
              <Card
                key={chef.slug}
                className="rounded-2xl border border-marrone-scuro/5 bg-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                <CardContent className="pt-6 pb-6 px-6 flex flex-col items-center text-center gap-3">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden border border-marrone-scuro/10 bg-bianco-caldo">
                    <Image
                      src={chef.photoPath}
                      alt={chef.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-borgogna font-semibold">
                      {chef.name}
                    </h3>
                    <p className="text-sm text-marrone-scuro/70 mt-1">
                      {chef.role}
                    </p>
                  </div>
                  <p className="text-sm text-marrone-scuro/80 leading-relaxed">
                    {chef.shortBio}
                  </p>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-borgogna"
                  >
                    <Link href={`/${locale}/chefs/${chef.slug}`}>
                      {t("actions.viewProfile")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

