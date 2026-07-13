/**
 * Cancella .next prima di dev/build.
 *
 * Necessario perché il "recursive-delete" interno di Next.js scambia i file
 * OneDrive (reparse point "cloud files") per symlink e va in EINVAL quando
 * prova a fare readlink() su di essi — capita quasi ad ogni riavvio se il
 * progetto vive in una cartella sincronizzata OneDrive su Windows.
 * fs.rmSync nativo di Node non ha questo problema, quindi ripulendo qui
 * (prima che Next.js parta) la sua routine di pulizia trova la cartella già
 * assente e salta il codice che va in errore. Su Vercel/CI .next non esiste
 * ancora al primo avvio: force:true rende questa chiamata un no-op innocuo.
 */
const fs = require("fs");

try {
  fs.rmSync(".next", { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
} catch {
  // Non bloccare dev/build per un residuo di cache non cancellabile.
}
