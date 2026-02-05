/**
 * Dati gallery da data/gallery.json. Usato da gallery page e pagina evento (es. Tullpukuna).
 */

import fs from "fs";
import path from "path";

export interface GalleryItem {
  src: string;
  name: string;
}

export function getGalleryItems(): GalleryItem[] {
  try {
    const filePath = path.join(process.cwd(), "data", "gallery.json");
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as GalleryItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Prime N immagini per uso in pagina evento (es. hero + gallery) */
export function getGallerySlice(count: number): GalleryItem[] {
  return getGalleryItems().slice(0, Math.max(0, count));
}

/**
 * Riempie la gallery fino a raggiungere almeno `minCount` immagini,
 * duplicando deterministicamente se necessario per evitare spazi vuoti nella griglia.
 */
export function getFilledGallery(minCount: number): GalleryItem[] {
  const items = getGalleryItems();
  if (items.length === 0) return [];
  if (items.length >= minCount) return items.slice(0, minCount);
  
  // Duplica deterministicamente fino a raggiungere minCount
  const filled: GalleryItem[] = [];
  for (let i = 0; i < minCount; i++) {
    filled.push(items[i % items.length]);
  }
  return filled;
}
