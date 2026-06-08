"use client";

import { useEffect } from "react";

// Tipo globale minimale per window.instgrm
declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process(): void;
      };
    };
  }
}

const INSTAGRAM_URL = "https://www.instagram.com/enotempo/"; // TODO: verificare l'handle corretto del profilo

const instagramPosts = [
  "https://www.instagram.com/p/DV8jXHaiCCK/",
  "https://www.instagram.com/p/DWWT39yCIoc/",
  "https://www.instagram.com/p/DZC-GwliDrv/",
];

export default function InstagramFeed() {
  useEffect(() => {
    // Carica lo script di Instagram una sola volta
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    // Quando lo script è caricato, processa gli embed
    script.onload = () => {
      window.instgrm?.Embeds?.process();
    };

    return () => {
      // Cleanup: rimuove lo script se il componente viene unmontato
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-borgogna mb-2">
            Seguici su Instagram
          </h2>
        </div>

        {/* Griglia responsive di embed */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 justify-items-center">
          {instagramPosts.map((postUrl) => (
            <div
              key={postUrl}
              className="w-full max-w-sm flex justify-center"
            >
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={postUrl}
                data-instgrm-version="14"
              />
            </div>
          ))}
        </div>

        {/* Bottone per il profilo */}
        <div className="flex justify-center">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-borgogna px-8 py-3 text-base font-semibold text-bianco-caldo shadow-sm hover:bg-borgogna/90 transition-colors"
          >
            Vedi il profilo
          </a>
        </div>
      </div>
    </section>
  );
}
