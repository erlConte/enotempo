import { put } from "@vercel/blob";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// Carica variabili d'ambiente da .env.local
config({ path: path.join(process.cwd(), ".env.local") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Estrai argomenti dalla command line
const args = process.argv.slice(2);
let dirPath: string | null = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dir" && args[i + 1]) {
    dirPath = args[i + 1];
    break;
  }
}

if (!dirPath) {
  console.error("Errore: specifica la directory con --dir <PATH>");
  console.error("Esempio: npm run upload:gallery -- --dir \"C:\\path\\to\\gallery\"");
  process.exit(1);
}

// Verifica che BLOB_READ_WRITE_TOKEN sia presente
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("Errore: BLOB_READ_WRITE_TOKEN non trovato nelle variabili d'ambiente");
  console.error("Aggiungi BLOB_READ_WRITE_TOKEN al tuo file .env.local");
  process.exit(1);
}

// Estensioni immagine supportate
const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];

async function uploadGallery() {
  try {
    // Verifica che la directory esista
    if (!fs.existsSync(dirPath!)) {
      console.error(`Errore: la directory "${dirPath}" non esiste`);
      process.exit(1);
    }

    // Leggi tutti i file nella directory
    const files = fs.readdirSync(dirPath!);
    
    // Filtra solo le immagini
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log("Nessuna immagine trovata nella directory specificata");
      return;
    }

    // Ordina alfabeticamente per mantenere ordine stabile
    imageFiles.sort();

    console.log(`Trovate ${imageFiles.length} immagini da caricare...`);

    const galleryData: Array<{ src: string; name: string }> = [];

    // Carica ogni immagine su Vercel Blob
    for (const file of imageFiles) {
      const filePath = path.join(dirPath!, file);
      const blobPath = `gallery/${file}`;

      console.log(`Caricamento: ${file}...`);

      try {
        const buf = fs.readFileSync(filePath);
        const blob = await put(blobPath, new Blob([buf]), {
          access: "public",
          token,
        });

        galleryData.push({
          src: blob.url,
          name: file,
        });

        console.log(`✓ Caricato: ${file} -> ${blob.url}`);
      } catch (error) {
        console.error(`✗ Errore nel caricamento di ${file}:`, error);
      }
    }

    // Salva/aggiorna data/gallery.json
    const dataDir = path.join(__dirname, "..", "data");
    const galleryJsonPath = path.join(dataDir, "gallery.json");

    // Crea la directory data se non esiste
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Scrivi il file JSON
    fs.writeFileSync(
      galleryJsonPath,
      JSON.stringify(galleryData, null, 2),
      "utf-8"
    );

    console.log(`\n✓ Completato! ${galleryData.length} immagini caricate`);
    console.log(`✓ File salvato: ${galleryJsonPath}`);
  } catch (error) {
    console.error("Errore durante l'upload:", error);
    process.exit(1);
  }
}

uploadGallery();
