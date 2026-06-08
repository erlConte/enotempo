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
    <section className="py-20 md:py-28 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        {/* Eyebrow + Heading + Subtitle */}
        <div className="text-center mb-16">
          <p className="text-xs md:text-sm font-semibold tracking-widest text-borgogna/70 uppercase mb-4">
            Social
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-borgogna mb-4 tracking-tight">
            Seguici su Instagram
          </h2>
          <p className="text-base md:text-lg text-marrone-scuro/70 max-w-2xl mx-auto">
            Scopri i nostri ultimi momenti, eventi e storie dalle esperienze Enotempo.
          </p>
        </div>

        {/* Griglia responsive di embed con cornice */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 justify-items-center">
          {instagramPosts.map((postUrl) => (
            <div
              key={postUrl}
              className="w-full max-w-sm rounded-2xl border border-borgogna/10 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={postUrl}
                data-instgrm-version="14"
              />
            </div>
          ))}
        </div>

        {/* Bottone profilo (Primary style) */}
        <div className="flex justify-center">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-borgogna text-bianco-caldo px-8 py-3 text-base font-semibold shadow-sm hover:bg-borgogna/90 transition-colors duration-300"
          >
            Vedi il profilo
          </a>
        </div>
      </div>
    </section>
  );
}
