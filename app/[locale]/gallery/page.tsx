import fs from "fs";
import path from "path";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params; // Per evitare warning unused
  const t = await getTranslations("gallery");

  const galleryDir = path.join(process.cwd(), "public", "gallery");
  let files: string[] = [];

  try {
    files = fs
      .readdirSync(galleryDir)
      .filter((file) => file.match(/\.(jpe?g|png|webp)$/i));
  } catch {
    files = [];
  }

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

        {/* Video Enotempo in evidenza - centrato e grande */}
        <div className="mt-10 flex justify-center">
          <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-2xl shadow-sm">
            <iframe
              src="https://www.youtube.com/embed/KR4amxTM1No"
              title="Enotempo Video"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>

        {/* Griglia immagini sotto il video */}
        {files.length > 0 && (
          <section className="mt-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => (
                <div
                  key={file}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-marrone-scuro/5"
                >
                  <Image
                    src={`/gallery/${file}`}
                    alt="Enotempo dinner"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

