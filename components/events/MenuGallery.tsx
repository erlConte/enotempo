"use client";

import Image from "next/image";
import ImageLightbox from "./ImageLightbox";

interface MenuGalleryProps {
  images: Array<{ src: string; name: string; alt?: string }>;
  title?: string;
}

/**
 * Componente Gallery per immagini del menu con hover effects e lightbox.
 * Le immagini vengono visualizzate in una griglia responsive con effetti hover.
 */
export default function MenuGallery({ images, title }: MenuGalleryProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="w-full">
      {title && (
        <h3 className="font-serif text-2xl md:text-3xl font-bold text-borgogna mb-6">
          {title}
        </h3>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {images.map((image, idx) => (
          <ImageLightbox
            key={`${image.src}-${idx}`}
            images={images}
            initialIndex={idx}
            trigger={
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-marrone-scuro/5 shadow-md hover:shadow-2xl transition-all duration-300 group cursor-pointer menu-gallery-item">
                <Image
                  src={image.src}
                  alt={image.alt || image.name || "Menu image"}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Overlay al hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-borgogna/90 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                      Clicca per ingrandire
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}
