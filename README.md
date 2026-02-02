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

**Esempio Supabase (locale / migrate):**
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public&sslmode=require"
```

**Supabase su Vercel (produzione):** usa il **Transaction pooler** (non Session) per evitare "max clients reached - pool_size". In Supabase: Settings → Database → Connection string → **Transaction** (porta 6543). Esempio:
```env
DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```
Prisma è configurato come singleton con pool ridotto in produzione (`lib/prisma.ts`).

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

**Regola:** lo schema DB si aggiorna via **Supabase** (Dashboard / SQL Editor). In repo **non** si eseguono `prisma migrate` né `prisma db seed` in locale (la connessione da locale può fallire per TLS). Il repo resta coerente con il DB reale facendo **pull** dello schema.

- **Schema:** modifiche al DB via Supabase SQL Editor; i file SQL si versionano in `supabase/migrations/`.
- **Allineare il repo al DB:** da un ambiente che riesce a connettersi (es. Vercel, CI): `npm run db:pull` → commit di `prisma/schema.prisma`.
- **Evento Cena Tullpukuna:** eseguire su Supabase SQL Editor il contenuto di `supabase/seed-events.sql` (UPSERT idempotente).

**Dettaglio completo:** vedi **[docs/DB_WORKFLOW.md](docs/DB_WORKFLOW.md)** (come applicare migration SQL, come fare db pull, come inserire l’evento).

#### Visualizzare i dati del database

Per aprire Prisma Studio (interfaccia grafica per visualizzare e modificare i dati):

```bash
npx prisma studio
```

Si aprirà un'interfaccia web su `http://localhost:5555` dove puoi vedere e modificare Event, Reservation e FenamMember.

#### Note sul Database

**Eventi nel Frontend:**
Gli eventi sono letti dal database tramite `lib/events.ts` (getEvents, getEventBySlug, getNextUpcomingEvent). L’evento Cena Tullpukuna si inserisce/aggiorna con `supabase/seed-events.sql` su Supabase (non `db:seed` in locale). Prenotazioni con capienza e protezione overbooking via API `/api/reservations`.

**Campo `phone` in FenamMember:**
Nel schema Prisma, `phone` è definito come opzionale (`String?`), ma nell'API `/api/reservations` è richiesto come regola di business per la validazione dei dati. La prenotazione richiede sessione FeNAM (cookie firmato da handoff). Vedi `.env.example` per `FENAM_LOGIN_URL` e `FENAM_HANDOFF_SECRET`; il ritorno da FeNAM avviene via POST a `/api/auth/fenam/handoff` (nessun token in query).

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

2. **Database:** le migrazioni si applicano su Supabase (SQL Editor); il repo non esegue migrate/seed in locale. In deploy è sufficiente `prisma generate` (già in `postinstall`). Opzionale: `prisma migrate deploy` se vuoi applicare la cartella `prisma/migrations/` dal build.
   
   **Nota per Vercel:** Vercel esegue automaticamente `prisma generate` durante il build (`postinstall`). Non è obbligatorio eseguire `prisma migrate deploy` se lo schema è già aggiornato su Supabase.

3. **Verifica il build locale**:
   ```bash
   npm run build
   ```

### Deployment su Vercel (Consigliato)

1. **Connetti il repository** a Vercel
2. **Configura le variabili d'ambiente** nel dashboard Vercel:
   - `DATABASE_URL`
   - `BLOB_READ_WRITE_TOKEN` (se necessario)
3. **Build Command:** `npm run build` (default). Non serve `prisma migrate deploy` se lo schema è gestito su Supabase (vedi `docs/DB_WORKFLOW.md`).
4. **Deploy!** Vercel eseguirà `npm install` (che include `prisma generate`).

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
- `npm run prisma:generate` - Genera Prisma Client (eseguito da `postinstall`)
- `npm run db:pull` - Allinea `prisma/schema.prisma` al DB reale (da ambiente connesso; vedi `docs/DB_WORKFLOW.md`)
- `npm run prisma:studio` - Apre Prisma Studio
- `npm run prisma:migrate` - Prisma migrate dev (non usato in locale: schema via Supabase)
- `npm run prisma:migrate:deploy` - Applica migrazioni esistenti (opzionale in deploy)
- `npm run db:seed` - Seed via Prisma (non usato in locale: usare `supabase/seed-events.sql` su Supabase)

## Documentazione

Vedi `DOCS_PROJECT_STATE.md` per la documentazione completa del progetto.

