import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getChefBySlug, getChefs } from "@/lib/chefs";
import { locales } from "@/lib/i18n/config";

export function generateStaticParams() {
  const chefs = getChefs();
  const slugs = chefs.map((chef) => chef.slug);
  // Produci combinazioni di parametri { locale, slug } per ogni lingua e chef
  return locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export default async function ChefDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("chefs");
  const chef = getChefBySlug(slug);

  if (!chef) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bianco-caldo py-12 md:py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header con foto e info */}
        <Card className="border-0 shadow-sm rounded-2xl bg-white mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative h-48 w-48 md:h-64 md:w-64 rounded-2xl overflow-hidden border border-marrone-scuro/10 bg-bianco-caldo shrink-0">
                <Image
                  src={chef.photoPath}
                  alt={chef.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-borgogna mb-4">
                  {chef.name}
                </h1>
                <p className="text-lg md:text-xl text-marrone-scuro/80">
                  {chef.role}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio completa */}
        <Card className="border-0 shadow-sm rounded-2xl bg-white mb-8">
          <CardContent className="p-8">
            <div className="space-y-4">
              <p className="text-marrone-scuro/90 leading-relaxed text-lg">
                {chef.fullBio}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Link torna agli chef */}
        <div className="text-center">
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-borgogna text-borgogna hover:bg-borgogna hover:text-bianco-caldo"
          >
            <Link href={`/${locale}/chefs`}>
              ← {t("detail.backToList")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

