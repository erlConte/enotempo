import Image from "next/image";
import { getTranslations } from "next-intl/server";
import fs from "fs";
import path from "path";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { logger } from "@/lib/logger";

export const revalidate = 0;

interface GalleryItem {
  src: string;
  name: string;
}

async function getGalleryData(): Promise<GalleryItem[]> {
  try {
    const filePath = path.join(process.cwd(), "data", "gallery.json");
    if (!fs.existsSync(filePath)) return [];
    const fileContents = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContents) as GalleryItem[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.error("Error loading gallery", error);
    return [];
  }
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations("gallery");
  const galleryItems = await getGalleryData();

  return (
    <div className="min-h-screen bg-bianco-caldo">
      {/* Hero borgogna */}
      <section className="bg-borgogna px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-6xl text-center">
          <Eyebrow className="text-verde/70 mb-4">Visual</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-crema mb-4">
            {t("title")}
          </h1>
          <p className="text-crema/60 text-base md:text-lg max-w-2xl mx-auto">
            {t("description")}
          </p>
        </div>
      </section>

      {/* Griglia */}
      {galleryItems.length > 0 ? (
        <Section bg="bianco-caldo" py="md">
          <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item) => (
              <div
                key={item.src}
                className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-borgogna/5"
              >
                <Image
                  src={item.src}
                  alt={`Enotempo — ${item.name}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <Section bg="bianco-caldo" py="lg">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2px] bg-borgogna/8 mb-8">
              <svg
                className="w-10 h-10 text-borgogna/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-borgogna mb-4">
              Gallery in arrivo
            </h2>
            <p className="text-marrone-scuro/60 text-base md:text-lg leading-relaxed">
              Stiamo preparando una selezione delle migliori foto delle nostre cene ENOTEMPO.
              Torna presto per vedere i momenti più belli delle nostre esperienze enogastronomiche.
            </p>
          </div>
        </Section>
      )}
    </div>
  );
}
