# EnoTempo

Progetto Next.js per ENOTEMPO - Esperienze enogastronomiche di qualità.

## Stack Tecnologico

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **next-intl** (it/en/es)

## Quick Start

### 1. Installazione dipendenze

```bash
npm install
```

### 2. Configurazione Database

Il progetto richiede un database PostgreSQL. Hai due opzioni:

#### Opzione A: Database Remoto (Consigliato - più semplice)

1. **Crea un account su [Supabase](https://supabase.com) o [Neon](https://neon.tech)**
2. **Crea un nuovo progetto** e ottieni la connection string
3. **Crea/modifica il file `.env.local`** nella root del progetto:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require"
```

**Esempio Supabase:**
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public&sslmode=require"
```

**Esempio Neon:**
```env
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require"
```

#### Opzione B: Database Locale

1. **Installa PostgreSQL** su Windows: [Download PostgreSQL](https://www.postgresql.org/download/windows/)
2. **Crea un database** (es. `enotempo`)
3. **Configura `.env.local`**:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/enotempo?schema=public"
```

### 3. Setup Database

Dopo aver configurato la `DATABASE_URL`, esegui le migrazioni:

#### Sviluppo Locale (Development)

Per creare e applicare migrazioni durante lo sviluppo:

```bash
npm run prisma:migrate
# oppure
npx prisma migrate dev
```

Questo comando:
- Crea una nuova migrazione se hai modificato `prisma/schema.prisma`
- Applica le migrazioni al database locale/remoto
- Genera il Prisma Client aggiornato

#### Produzione (Deploy)

Per applicare le migrazioni in produzione (es. Vercel, Supabase):

```bash
npx prisma migrate deploy
```

**Importante:** `migrate deploy`:
- Applica SOLO le migrazioni già create (non crea nuove migrazioni)
- È sicuro per l'uso in CI/CD e produzione
- Non modifica lo schema, solo applica le migrazioni pendenti

**Flusso consigliato:**
1. **Locale:** Modifica `prisma/schema.prisma` → `prisma migrate dev` → testa
2. **Commit:** Commit delle migrazioni nella cartella `prisma/migrations/`
3. **Produzione:** Nel deploy, esegui `prisma migrate deploy` come parte del build

Opzionalmente, popola il database con dati di esempio:

```bash
npm run db:seed
```

#### Visualizzare i dati del database

Per aprire Prisma Studio (interfaccia grafica per visualizzare e modificare i dati):

```bash
npx prisma studio
```

Si aprirà un'interfaccia web su `http://localhost:5555` dove puoi vedere e modificare Event, Reservation e FenamMember.

#### Note sul Database

**Eventi nel Frontend:**
Gli eventi sono letti dal database tramite `lib/events.ts` (getEvents, getEventBySlug, getNextUpcomingEvent). Il seed popola il primo evento reale (Cena a Tullpukuna). Prenotazioni con capienza e protezione overbooking via API `/api/reservations`.

**Campo `phone` in FenamMember:**
Nel schema Prisma, `phone` è definito come opzionale (`String?`), ma nelle API (`/api/fenam/register` e `/api/reservations`) è richiesto come regola di business per la validazione dei dati.

**File di configurazione ambiente:**
- `Next dev` usa `.env.local` per le variabili d'ambiente durante lo sviluppo
- `Prisma CLI` usa `.env` per le migrazioni e altre operazioni del database

### 4. Avvia il server di sviluppo

```bash
npm run dev
```

Visita `http://localhost:3000/it` per vedere l'applicazione.

## Deployment

### Preparazione per il Deployment

Il progetto è configurato per essere deployment-ready. Prima di fare il deploy:

1. **Configura le variabili d'ambiente** nella piattaforma di hosting (Vercel, Netlify, ecc.):
   - `DATABASE_URL`: Connection string PostgreSQL (obbligatorio)
   - `BLOB_READ_WRITE_TOKEN`: Token Vercel Blob (opzionale, solo se usi upload immagini)

2. **Esegui le migrazioni del database**:
   ```bash
   npm run prisma:migrate:deploy
   ```
   
   **Nota per Vercel:** Vercel esegue automaticamente `prisma generate` durante il build grazie allo script `postinstall`. Per le migrazioni, puoi:
   - Configurare un comando di build personalizzato: `npm run build && npm run prisma:migrate:deploy`
   - Oppure usare Vercel Postgres e configurare le migrazioni automatiche

3. **Verifica il build locale**:
   ```bash
   npm run build
   ```

### Deployment su Vercel (Consigliato)

1. **Connetti il repository** a Vercel
2. **Configura le variabili d'ambiente** nel dashboard Vercel:
   - `DATABASE_URL`
   - `BLOB_READ_WRITE_TOKEN` (se necessario)
3. **Configura il Build Command** (opzionale, se vuoi migrazioni automatiche):
   ```
   npm run build && npm run prisma:migrate:deploy
   ```
4. **Deploy!** Vercel eseguirà automaticamente `npm install` (che include `prisma generate`)

### Vercel Deploy Checklist

Prima di fare il deploy su Vercel, verifica:

1. **Variabili d'ambiente in Vercel Dashboard** (Settings → Environment Variables):
   - ✅ `DATABASE_URL`: Connection string PostgreSQL con **connection pooler** di Supabase
     - Formato: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
     - Configura per **Production** e **Preview**
   - ✅ `BLOB_READ_WRITE_TOKEN`: Token Vercel Blob (opzionale, solo se necessario per upload immagini)
     - Configura per **Production** e **Preview** se usato

2. **Migrazioni Database** (opzionale):
   - Se vuoi eseguire le migrazioni automaticamente durante il deploy, configura il **Build Command** in Vercel:
     ```
     npm run build && npm run prisma:migrate:deploy
     ```
   - Altrimenti, esegui manualmente dopo il primo deploy:
     ```bash
     npx prisma migrate deploy
     ```

3. **Verifica Build Locale**:
   ```bash
   npm run build
   npm run lint
   ```

**Note importanti:**
- ✅ Nessuna pagina fa query DB a build-time (solo API routes a runtime)
- ✅ Tutte le immagini sono su Vercel Blob Storage (nessun path `/public`)
- ✅ `next.config.mjs` è configurato per permettere `*.public.blob.vercel-storage.com`
- ✅ Nessuna dipendenza da file `.env` in produzione (solo `process.env.DATABASE_URL`)

### Variabili d'Ambiente Richieste

Crea un file `.env.local` per sviluppo locale (non committare) o configura nella piattaforma di hosting:

```env
# Database (obbligatorio)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require"

# Vercel Blob Storage (opzionale)
BLOB_READ_WRITE_TOKEN="your-token-here"
```

Vedi `.env.example` per un template completo (se disponibile).

### Script Disponibili

- `npm run dev` - Avvia il server di sviluppo
- `npm run build` - Build per produzione
- `npm run start` - Avvia il server di produzione
- `npm run lint` - Esegue il linter
- `npm run prisma:migrate` - Crea e applica migrazioni (sviluppo)
- `npm run prisma:migrate:deploy` - Applica migrazioni esistenti (produzione)
- `npm run prisma:studio` - Apre Prisma Studio
- `npm run db:seed` - Popola il database con dati di esempio

## Documentazione

Vedi `DOCS_PROJECT_STATE.md` per la documentazione completa del progetto.

