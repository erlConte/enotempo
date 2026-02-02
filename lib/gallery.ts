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
