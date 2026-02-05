"use client";

import { useState } from "react";
import Image from "next/image";

interface EventVideoProps {
  src: string;
  poster?: string | null;
  alt: string;
  vertical?: boolean; // Se true, usa aspect ratio 9:16 (verticale)
}

/** Video con fallback: se non carica o errore, mostra "Video in arrivo" + poster/hero. */
export default function EventVideo({ src, poster, alt, vertical = false }: EventVideoProps) {
  const [failed, setFailed] = useState(false);

  const aspectClass = vertical ? "aspect-[9/16] w-full" : "aspect-video";

  if (failed) {
    return (
      <div className={`relative ${aspectClass} rounded-xl overflow-hidden bg-marrone-scuro/10 flex flex-col items-center justify-center gap-4 p-6`}>
        {poster ? (
          <div className="absolute inset-0">
            <Image
              src={poster}
              alt={alt}
              fill
              className="object-cover opacity-60"
              sizes="(max-width: 768px) 100vw, 512px"
            />
          </div>
        ) : null}
        <p className="relative z-10 text-marrone-scuro/90 font-medium text-center">
          Video in arrivo
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${aspectClass} rounded-xl overflow-hidden bg-marrone-scuro/10`}>
      <video
        controls
        preload="metadata"
        playsInline
        className="w-full h-full object-contain"
        poster={poster ?? undefined}
        src={src}
        onError={() => setFailed(true)}
      >
        Il tuo browser non supporta il tag video.
      </video>
    </div>
  );
}
