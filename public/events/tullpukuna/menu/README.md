# Immagini Menu Tullpukuna

## Istruzioni per il caricamento delle immagini

1. **Carica le immagini del menu** in questa cartella (`public/events/tullpukuna/menu/`)

2. **Formato suggerito per i nomi file:**
   - `menu-1.jpg` (o `.png`, `.webp`)
   - `menu-2.jpg`
   - `menu-3.jpg`
   - ecc.

3. **Dopo aver caricato le immagini**, aggiorna l'array `TULLPUKUNA_MENU_IMAGES` nel file:
   ```
   app/[locale]/cene/[slug]/page.tsx
   ```

4. **Esempio di configurazione:**
   ```typescript
   const TULLPUKUNA_MENU_IMAGES: Array<{ src: string; name: string; alt?: string }> = [
     { src: "/events/tullpukuna/menu/menu-1.jpg", name: "menu-1.jpg", alt: "Menu Tullpukuna - Antipasti" },
     { src: "/events/tullpukuna/menu/menu-2.jpg", name: "menu-2.jpg", alt: "Menu Tullpukuna - Primi" },
     { src: "/events/tullpukuna/menu/menu-3.jpg", name: "menu-3.jpg", alt: "Menu Tullpukuna - Secondi" },
   ];
   ```

5. **Formati supportati:** JPG, PNG, WebP

6. **Dimensioni consigliate:** 
   - Larghezza: 1200-2000px
   - Formato: 4:3 o 16:9 per migliore visualizzazione nella gallery

## Note

- Le immagini verranno visualizzate automaticamente nella sezione "Immagini del Menu" della pagina evento
- Le immagini supportano la visualizzazione in lightbox con navigazione tra immagini
- Dopo il deploy su Vercel, le immagini saranno accessibili pubblicamente tramite il path `/events/tullpukuna/menu/`
