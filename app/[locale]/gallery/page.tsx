import Image from "next/image";
import { getTranslations } from "next-intl/server";
import fs from "fs";
import path from "path";

interface GalleryItem {
  src: string;
  name: string;
}

async function getGalleryData(): Promise<GalleryItem[]> {
  try {
    const filePath = path.join(process.cwd(), "data", "gallery.json");
    
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const fileContents = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContents) as GalleryItem[];
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Errore nel caricamento della gallery:", error);
    return [];
  }
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params; // Per evitare warning unused
  const t = await getTranslations("gallery");

  // Carica i dati della gallery da data/gallery.json
  const galleryItems = await getGalleryData();

  return (
    <main className="bg-bianco-caldo min-h-screen">
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Header della sezione - testi centrali */}
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-3xl md:text-4xl text-marrone-scuro">
            {t("title")}
          </h1>
          <p className="mt-3 text-base md:text-lg text-marrone-scuro/80">
            {t("description")}
          </p>
        </div>

        {/* Griglia immagini */}
        {galleryItems.length > 0 ? (
          <section className="mt-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryItems.map((item) => (
                <div
                  key={item.src}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-marrone-scuro/5"
                >
                  <Image
                    src={item.src}
                    alt={`Enotempo dinner - ${item.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-10">
            <div className="max-w-2xl mx-auto text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-marrone-scuro/10 mb-6">
                <svg
                  className="w-12 h-12 text-marrone-scuro/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-2xl md:text-3xl text-marrone-scuro mb-4">
                Gallery in arrivo
              </h2>
              <p className="text-base md:text-lg text-marrone-scuro/70">
                Stiamo preparando una selezione delle migliori foto delle nostre cene ENOTEMPO.
                Torna presto per vedere i momenti più belli delle nostre esperienze enogastronomiche.
              </p>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

