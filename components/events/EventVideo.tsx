"use client";

import { useState } from "react";
import Image from "next/image";

interface EventVideoProps {
  src: string;
  poster?: string | null;
  alt: string;
}

/** Video con fallback: se non carica o errore, mostra "Video in arrivo" + poster/hero. */
export default function EventVideo({ src, poster, alt }: EventVideoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden bg-marrone-scuro/10 flex flex-col items-center justify-center gap-4 p-6">
        {poster ? (
          <div className="absolute inset-0">
            <Image
              src={poster}
              alt={alt}
              fill
              className="object-cover opacity-60"
              sizes="(max-width: 768px) 100vw, 1024px"
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
    <div className="relative aspect-video rounded-xl overflow-hidden bg-marrone-scuro/10">
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
