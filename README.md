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
Gli eventi visualizzati nel frontend attualmente arrivano da mock data (`lib/mockEvents.ts`), non dal database. Il database è comunque pronto per ospitare gli eventi tramite il modello `Event` e può essere popolato tramite seed o API future.

**Campo `phone` in FenamMember:**
Nel schema Prisma, `phone` è definito come opzionale (`String?`), ma nelle API (`/api/fenam/register` e `/api/reservations`) è richiesto come regola di business per la validazione dei dati.

### 4. Avvia il server di sviluppo

```bash
npm run dev
```

Visita `http://localhost:3000/it` per vedere l'applicazione.

## Documentazione

Vedi `DOCS_PROJECT_STATE.md` per la documentazione completa del progetto.

