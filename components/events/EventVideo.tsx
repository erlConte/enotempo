"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface EventVideoProps {
  src: string;
  poster?: string | null;
  alt: string;
  vertical?: boolean; // Se true, usa aspect ratio 9:16 (verticale)
}

/** Video con fallback: se non carica o errore, mostra "Video in arrivo" + poster/hero.
 * Migliorato con poster interattivo e transizioni fluide.
 */
export default function EventVideo({ src, poster, alt, vertical = false }: EventVideoProps) {
  const [failed, setFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Per video verticale, usa altezza ridotta per allinearsi con le immagini
  const aspectClass = vertical ? "aspect-[9/16] w-full max-h-[80vh]" : "aspect-video";

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

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
    <div className={`relative ${aspectClass} rounded-xl overflow-hidden bg-marrone-scuro/10 video-container group shadow-lg hover:shadow-2xl transition-all duration-300`}>
      <video
        ref={videoRef}
        controls
        preload="metadata"
        playsInline
        className="w-full h-full object-contain"
        poster={poster ?? undefined}
        src={src}
        onError={() => setFailed(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        Il tuo browser non supporta il tag video.
      </video>
      
      {/* Poster overlay con pulsante play (solo quando non sta riproducendo) */}
      {poster && !isPlaying && (
        <div
          className="absolute inset-0 cursor-pointer group-hover:bg-black/20 transition-all duration-300"
          onClick={handlePlay}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-borgogna/90 flex items-center justify-center shadow-lg group-hover:bg-borgogna group-hover:scale-110 transition-all duration-300">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-bianco-caldo ml-1" fill="currentColor" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
