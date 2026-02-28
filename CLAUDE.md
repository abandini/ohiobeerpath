# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ohio Beer Path is a Progressive Web App (PWA) running on Cloudflare's edge network. It catalogs 351 Ohio craft breweries with interactive maps, search, and itinerary planning.

**Live Site:** https://ohio-beer-path.bill-burkey.workers.dev

## Architecture

### Cloudflare Workers Stack

This is a **serverless edge application** running globally across 300+ Cloudflare data centers:

- **Runtime:** Cloudflare Workers (V8 isolates)
- **Framework:** Hono.js (lightweight web framework)
- **Language:** TypeScript
- **Database:** D1 (SQLite on the edge)
- **Storage:** R2 (object storage for static assets)
- **Cache:** KV (key-value store, 1-hour TTL)
- **AI:** Workers AI (`@cf/baai/bge-base-en-v1.5` embeddings, `@cf/meta/llama-3-8b-instruct` text)
- **Vector Search:** Vectorize (`brewery-embeddings` index)

### Bindings (wrangler.toml)

The Worker has these bindings defined in `wrangler.toml`:

```typescript
// Available in all handlers via c.env
interface Env {
  DB: D1Database;           // Database: 707e2a1f-3415-43e0-bd68-4de1bb89a66b
  IMAGES: R2Bucket;         // R2 bucket: ohio-beer-path-images
  CACHE: KVNamespace;       // KV namespace: 276245328e284f3e8dbc4aba8355d12a
  AI: Ai;                   // Workers AI binding
  VECTORIZE: VectorizeIndex; // brewery-embeddings index
  GOOGLE_MAPS_API_KEY: string;
  ENVIRONMENT: string;
  ADMIN_USER?: string;
  ADMIN_PASS?: string;
}
```

### Request Flow

1. **Request hits Cloudflare edge** (nearest of 300+ locations)
2. **Middleware stack** (order matters):
   - CORS middleware (`src/middleware/cors.ts`)
   - Asset serving (`src/middleware/assets.ts`) - serves from R2
   - Cache middleware (`src/middleware/cache.ts`) - checks KV cache
3. **Routing** (`src/index.ts`):
   - `/api/*` → API routes (JSON responses)
   - `/*` → Page routes (HTML responses)
4. **Database queries** → D1 (SQLite)
5. **Response** → Cached in KV if API, served to client

### Route Architecture

**CRITICAL:** There are TWO separate route handlers:

1. **API Routes** (`src/routes/api.ts`):
   - Mount at `/api`
   - Return JSON
   - Cached in KV (1-hour TTL)
   - Examples: `/api/breweries`, `/api/brewery/:id`

2. **Page Routes** (`src/routes/pages.ts`):
   - Mount at `/`
   - Return HTML (server-side rendered via templates)
   - NOT cached
   - Examples: `/`, `/breweries`, `/brewery/:id`

**Note:** `/brewery/:id` returns HTML, while `/api/brewery/:id` returns JSON for the SAME brewery. This dual-route pattern enables both web browsing and API consumption.

3. **Admin Routes** (`src/routes/admin.ts`):
   - Mount at `/admin`
   - Protected by basic auth (ADMIN_USER/ADMIN_PASS)
   - Dashboard, brewery management, subscriber management
   - Examples: `/admin`, `/admin/breweries`, `/admin/subscribers`

### AI Features

The app uses Workers AI and Vectorize for intelligent features:

**API Endpoints:**
- `POST /api/ai/recommendations` - Get brewery recommendations by vibe (cozy, lively, family-friendly)
- `GET /api/ai/search?q=...` - Semantic search using vector embeddings
- `POST /api/admin/seed-embeddings` - Generate embeddings for all breweries
- `POST /api/admin/enrich-descriptions` - AI-generate missing brewery descriptions

**Cron Job:** Daily at 3 AM UTC, `processVibeInference()` batch-processes brewery vibe analysis.

**Models Used:**
- `@cf/baai/bge-base-en-v1.5` - 768-dimension embeddings for semantic search
- `@cf/meta/llama-3-8b-instruct` - Text generation for descriptions and vibe analysis

### Template System

Templates are TypeScript functions in `src/templates/` that return HTML strings:

- `layout.ts` - Base layout wrapper (nav, footer, meta tags, favicon)
- `home.ts` - Homepage with featured breweries
- `breweries.ts` - Brewery listing page
- `brewery.ts` - Single brewery detail page
- `itinerary.ts` - Tour builder page
- `trails.ts` - Curated brewery trails
- `blog.ts` - Blog list and post pages
- `admin.ts` - Admin dashboard templates

**Key pattern:**
```typescript
export function breweryPage(brewery: Brewery): string {
  const content = `...HTML template...`;
  return layout(`${brewery.name} | Ohio Beer Path`, content);
}
```

Templates include inline `<style>` and `<script>` tags for component-specific behavior.

### Database Layer

All database queries are in `src/db/breweries.ts`:

- `getAllBreweries()` - Fetch all breweries
- `getBreweriesByRegion()` - Filter by region
- `getBreweriesByCity()` - Filter by city
- `getBreweryById()` - Single brewery
- `getNearbyBreweries()` - Haversine distance calculation
- `searchBreweries()` - Text search

**Important:** `parseBrewery()` helper parses JSON fields (`amenities`, `hours`) stored as text in D1.

## Development Commands

### Local Development

```bash
# Start local dev server (port 8787)
npm run dev

# Run with fresh database
npm run db:migrate:local
npm run dev
```

### Database Management

```bash
# Create new D1 database (one-time setup)
npm run db:create

# Apply migrations to LOCAL database
npm run db:migrate:local

# Apply migrations to PRODUCTION database
npm run db:migrate
# OR: wrangler d1 migrations apply ohio-beer-path-db --remote

# Import breweries from JSON (generates migration)
npm run db:import

# Full local setup: import + migrate
npm run db:import:apply
```

**Database files:**
- `migrations/0001_initial_schema.sql` - Table definitions
- `migrations/0002_import_breweries.sql` - Brewery data INSERT statements
- `scripts/import-to-d1.ts` - JSON → SQL converter

### Static Assets

Assets are stored in R2 bucket (`ohio-beer-path-images`):

```bash
# Upload ALL assets to production R2
./scripts/upload-assets.sh

# Includes: CSS, JS, service-worker.js, site.webmanifest, robots.txt, images
```

**CRITICAL:** The upload script uses `--remote` flag to upload to production R2. Without this flag, assets upload to local dev storage and will NOT be accessible in production.

### Deployment

```bash
# Deploy to production
npm run deploy
# OR: wrangler deploy

# Full production deployment (assets + code + migrations)
npm run deploy
wrangler d1 migrations apply ohio-beer-path-db --remote
./scripts/upload-assets.sh
```

**GitHub Actions:** Automatic deployment on push to `main` branch or version tags (`.github/workflows/deploy.yml`).

### Testing

```bash
# Run tests (Vitest)
npm test

# Type check
npm run typecheck
```

**QA Scripts:** Several Puppeteer-based test scripts exist for comprehensive testing:
- `test_production.js` - Full regression test suite
- `capture_screenshots.js` - Screenshot capture utility
- `verify_structure.js` - HTML structure verification
- `test_pwa.js` - PWA functionality tests

## Key Design Patterns

### 1. Middleware Order Matters

Middleware executes in registration order in `src/index.ts`:

```typescript
app.use('*', cors());            // 1. Enable CORS
app.use('*', serveAssets());     // 2. Serve static files from R2
app.use('*', cacheMiddleware()); // 3. Check/populate KV cache
```

Changing this order will break functionality.

### 2. Cache Strategy

**API endpoints only** are cached in KV:
- Key: `cache:${c.req.url}`
- TTL: 3600 seconds (1 hour)
- Header: `X-Cache: HIT` or `MISS`

**Page routes** are NOT cached (always fresh HTML).

### 3. Asset Serving

Static assets are served from R2 bucket via `src/middleware/assets.ts`:

```typescript
// Matches: /assets/*, /service-worker.js, /site.webmanifest, etc.
// Returns: File from R2 with proper Content-Type headers
```

If R2 file doesn't exist, middleware calls `next()` and request continues to routes.

### 4. JSON Field Parsing

D1 doesn't support native JSON types, so `amenities` and `hours` are stored as TEXT and parsed in application code:

```typescript
function parseBrewery(brewery: any): Brewery {
  return {
    ...brewery,
    amenities: brewery.amenities ? JSON.parse(brewery.amenities) : [],
    hours: brewery.hours ? JSON.parse(brewery.hours) : {}
  };
}
```

**Always use `parseBrewery()`** when returning brewery data from D1.

### 5. PWA Setup

Progressive Web App features:
- `service-worker.js` - Caching strategy, offline support
- `site.webmanifest` - App metadata, icons, shortcuts
- Both files served from R2 root

The service worker caches:
- Core pages: `/`, `/breweries`
- CSS files
- Offline fallback page

## Common Gotchas

### 1. Local vs Remote D1

- `wrangler dev` uses **local** D1 (`.wrangler/state/v3/d1/`)
- `wrangler deploy` uses **remote** D1 (Cloudflare)
- Migrations are SEPARATE between local and remote
- Always run `--local` for dev, `--remote` for production

### 2. R2 Upload Requires --remote Flag

The upload script MUST use `--remote` flag:

```bash
# WRONG - uploads to local dev storage
wrangler r2 object put ohio-beer-path-images/asset.css --file=asset.css

# CORRECT - uploads to production R2
wrangler r2 object put ohio-beer-path-images/asset.css --file=asset.css --remote
```

### 3. Route Mounting Order

API routes are mounted BEFORE page routes to prevent conflicts:

```typescript
app.route('/api', apiRoutes);  // Must come first
app.route('/', pageRoutes);    // Catch-all routes last
```

If reversed, `/api/breweries` would match the page route handler.

### 4. TypeScript Types

`src/types.ts` defines the `Env` interface used throughout. When accessing bindings:

```typescript
// CORRECT
const breweries = await breweriesDB.getAllBreweries(c.env);

// WRONG - TypeScript error
const breweries = await breweriesDB.getAllBreweries(c.DB);
```

Pass the entire `c.env` object, not individual bindings.

## Cloudflare-Specific Considerations

### Workers Runtime Limitations

- No Node.js globals (`process`, `fs`, etc.)
- No long-running processes (50ms CPU time limit)
- No WebSocket servers (clients only)
- Use `nodejs_compat` flag for some Node APIs

### D1 (SQLite) Considerations

- Read-replicated globally (writes to primary)
- SQL syntax is SQLite, not MySQL/PostgreSQL
- No stored procedures or triggers
- Maximum 10MB database size (free tier)
- Use prepared statements (always bind parameters)

### R2 Storage

- Eventually consistent (may take seconds to propagate)
- No directory structure (flat key namespace)
- Use `/` in keys to simulate folders: `assets/css/styles.css`
- Maximum 5TB per bucket (free tier: 10GB)

### KV Namespace

- Eventually consistent (60 seconds globally)
- Key limit: 512 bytes
- Value limit: 25MB
- Best for read-heavy workloads
- NOT suitable for transactional data

## Production URLs

- **Worker:** https://ohio-beer-path.bill-burkey.workers.dev
- **D1 Database:** `707e2a1f-3415-43e0-bd68-4de1bb89a66b`
- **R2 Bucket:** `ohio-beer-path-images`
- **KV Namespace:** `276245328e284f3e8dbc4aba8355d12a`

## Environment Setup

### Prerequisites

1. **Node.js 18+** (Workers use Node-compatible APIs)
2. **Wrangler CLI:** `npm install -g wrangler`
3. **Cloudflare account** (free tier sufficient)
4. **Authenticated Wrangler:** `wrangler login`

### First-Time Setup

```bash
# 1. Clone and install
git clone <repo>
cd ohiobeerpath
npm install

# 2. Setup local database
npm run db:migrate:local

# 3. Start dev server
npm run dev

# 4. Open http://localhost:8787
```

### Secrets Management

Secrets are set via Wrangler CLI (NOT in wrangler.toml):

```bash
# Set production secret
wrangler secret put GOOGLE_MAPS_API_KEY
# Enter secret when prompted

# List secrets (values hidden)
wrangler secret list
```

Secrets are available in `c.env.SECRET_NAME` at runtime.

## Documentation

Comprehensive docs in `docs/`:
- `DESIGN_SYSTEM.md` - Color palette, typography, components
- `CLOUDFLARE_MIGRATION.md` - PHP → Workers migration details
- `DEVELOPMENT.md` - Detailed development setup
- `DEPLOYMENT.md` - Production deployment guide
- `TESTING.md` - QA checklist and test cases
- `QA-REMEDIATION-PLAN.md` - Recent QA testing results

## Data Schema

Brewery table in D1 (`migrations/0001_initial_schema.sql`):

```sql
CREATE TABLE breweries (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT,
  latitude REAL,
  longitude REAL,
  phone TEXT,
  website_url TEXT,
  amenities TEXT,  -- JSON array as TEXT
  hours TEXT,      -- JSON object as TEXT
  description TEXT,
  -- ... additional fields
);
```

**351 breweries** imported from `breweries.json` via migration `0002_import_breweries.sql`.

Additional tables:
- `brewery_vibes` - AI-inferred atmosphere/crowd data
- `trails` - Curated brewery trails
- `reviews`, `check_ins` - User engagement
- `email_subscribers` - Newsletter signups
- `shared_tours` - Saved/shared tour itineraries
- `blog_posts` - Blog content
- `events` - Brewery events

## Recent Changes (Nov 2025)

- **Favicon:** Embedded as base64 in `layout.ts` to avoid R2 404 issues
- **Website URLs:** `website_url` field cleared (contained fake auto-generated URLs) - "Visit Website" button hidden when null
- **AI Descriptions:** Background enrichment running to AI-generate missing brewery descriptions
- **Vectorize:** Semantic search enabled via `brewery-embeddings` index
