"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageLightboxProps {
  images: Array<{ src: string; name: string; alt?: string }>;
  trigger: React.ReactNode;
  initialIndex?: number;
}

/**
 * Componente Lightbox per visualizzare immagini in modal fullscreen.
 * Supporta navigazione tra immagini con frecce e chiusura con ESC.
 */
export default function ImageLightbox({
  images,
  trigger,
  initialIndex = 0,
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Assicuriamoci che images sia sempre un array valido
  const validImages = images && images.length > 0 ? images : [];
  const imagesLength = validImages.length;

  // Gestione navigazione da tastiera
  useEffect(() => {
    if (!open || imagesLength === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex((prev) => prev - 1);
      } else if (e.key === "ArrowRight" && currentIndex < imagesLength - 1) {
        e.preventDefault();
        setCurrentIndex((prev) => prev + 1);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex, imagesLength]);

  // Calcoli per il rendering - sempre eseguiti dopo gli hooks
  const currentImage = imagesLength > 0 ? validImages[currentIndex] : null;
  const hasPrevious = currentIndex > 0 && imagesLength > 0;
  const hasNext = currentIndex < imagesLength - 1 && imagesLength > 0;

  const goToPrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setCurrentIndex(initialIndex);
    }
  };

  // Render senza return condizionale - gestiamo il caso vuoto nel JSX
  return (
    <>
      {imagesLength === 0 || !currentImage ? (
        <>{trigger}</>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          <DialogContent
            className="max-w-7xl w-full h-[95vh] p-0 bg-black/95 border-none overflow-hidden"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Immagine principale */}
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={currentImage.src}
                  alt={currentImage.alt || currentImage.name || "Gallery image"}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              {/* Pulsante chiudi */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigazione precedente */}
              {hasPrevious && (
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                  aria-label="Immagine precedente"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}

              {/* Navigazione successiva */}
              {hasNext && (
                <button
                  onClick={goToNext}
                  className="absolute right-4 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                  aria-label="Immagine successiva"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}

              {/* Indicatore posizione */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
                {currentIndex + 1} / {imagesLength}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
