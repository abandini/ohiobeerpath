# Ohio Beer Path - Cloudflare Workers Migration Design

**Date:** 2025-11-26
**Status:** Approved
**Author:** Claude (AI Assistant)

## Overview

Migrate Ohio Beer Path from PHP/MySQL to Cloudflare Workers with full AI integration.

## Architecture

### Stack
- **Runtime:** Cloudflare Workers (NOT Pages)
- **Framework:** Hono (JSX templates, routing)
- **Database:** D1 (SQLite)
- **Storage:** R2 (images, assets)
- **Cache:** KV (responses, AI results)
- **AI:** Workers AI (LLM, embeddings)
- **Search:** Vectorize (semantic search)

### Rendering Strategy
- Server-rendered HTML via Hono JSX
- Progressive enhancement for interactivity
- API-first design for PWA offline support
- Edge caching via KV

## Pages & Routes

### Priority Order
1. **Regions** `/regions` - Browse by Ohio region
2. **Nearby** `/nearby` - Geolocation-based discovery
3. **Itinerary** `/itinerary` - Trip planning with AI optimization
4. **AI Features** - Search, recommendations, route planning
5. **Static Pages** - About, Blog, Privacy, Terms

### Existing (Working)
- `/` - Home page
- `/breweries` - All breweries list
- `/brewery/:id` - Single brewery detail
- `/api/breweries` - Brewery list API
- `/api/breweries/:id` - Single brewery API
- `/api/breweries/nearby` - Geolocation API

### To Implement
| Page | Route | Priority |
|------|-------|----------|
| Regions | `/regions`, `/regions/:region` | P1 |
| Nearby | `/nearby` | P1 |
| Itinerary | `/itinerary` | P2 |
| About | `/about` | P3 |
| Privacy | `/privacy` | P3 |
| Terms | `/terms` | P3 |

### API Endpoints to Implement
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/regions` | GET | List all regions with counts |
| `/api/itinerary/optimize` | POST | AI route optimization |
| `/api/ai/search` | GET | Semantic search with embeddings |
| `/api/ai/recommend` | GET | AI-powered recommendations |

## Workers AI Integration

### Vibe & Style Inference (Batch)
- **Trigger:** Daily cron at 3 AM UTC
- **Model:** `@cf/meta/llama-3-8b-instruct`
- **Process:** Extract atmosphere tags, style specialties, crowd type from descriptions
- **Storage:** `brewery_vibes` table in D1
- **Batch Size:** 10 breweries per cron run

### Smart Search (Real-time)
- **Model:** `@cf/baai/bge-base-en-v1.5` (768 dimensions)
- **Index:** Vectorize `brewery-embeddings`
- **Process:**
  1. Pre-compute embeddings for all breweries
  2. On search: embed query → vector similarity → return top 10
- **Fallback:** D1 LIKE query if Vectorize unavailable

### AI Route Planner (Real-time)
- **Model:** `@cf/meta/llama-3-8b-instruct`
- **Input:** List of brewery IDs from user itinerary
- **Output:** Optimized driving order with estimated times
- **Cache:** KV with 24h TTL (key: sorted brewery IDs hash)

### Cost Control
- Request counting in KV (`stats:ai:daily:{date}`)
- Daily budget cap via Worker secret
- Graceful degradation when budget exceeded

## Data Model

### Existing Tables (Keep As-Is)
```sql
breweries (
  id, name, brewery_type, street, address_2, address_3,
  city, state_province, postal_code, country,
  longitude, latitude, phone, website_url,
  state, region, amenities, description, hours, image_url,
  created_at, updated_at
)

analytics (
  id, event_type, brewery_id, data, user_agent, ip_address, created_at
)
```

### New Tables (Migration Required)
```sql
brewery_vibes (
  brewery_id INTEGER PRIMARY KEY REFERENCES breweries(id),
  atmosphere_tags TEXT,    -- JSON: ["cozy", "industrial"]
  style_specialties TEXT,  -- JSON: ["IPA", "Stout"]
  crowd_type TEXT,
  last_updated TEXT
)

user_itineraries (
  id TEXT PRIMARY KEY,           -- UUID from cookie
  breweries_json TEXT,           -- JSON: [1, 5, 12]
  optimized_route_json TEXT,     -- AI-generated route
  created_at TEXT,
  updated_at TEXT
)
```

## Storage Structure

### R2 Bucket: `ohio-beer-path-images`
```
images/breweries/{slug}.webp   - Hero images
images/icons/                  - PWA icons
images/og/                     - Social sharing images
```

### KV Namespace: `CACHE`
```
cache:breweries:all            - Full list (TTL: 1hr)
cache:breweries:region:{name}  - Regional lists (TTL: 1hr)
cache:route:{hash}             - Optimized routes (TTL: 24hr)
stats:ai:daily:{date}          - AI request counter
```

## Configuration

### wrangler.toml Bindings (Validated)
```toml
[[d1_databases]]
binding = "DB"
database_name = "ohio-beer-path-db"
database_id = "707e2a1f-3415-43e0-bd68-4de1bb89a66b"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "ohio-beer-path-images"

[[kv_namespaces]]
binding = "CACHE"
id = "276245328e284f3e8dbc4aba8355d12a"

[ai]
binding = "AI"

[[vectorize]]
binding = "VECTORIZE"
index_name = "brewery-embeddings"

[triggers]
crons = ["0 3 * * *"]
```

### Secrets (via `wrangler secret put`)
- `GOOGLE_MAPS_API_KEY` - Maps functionality

## Validation Results

| Component | Status | Notes |
|-----------|--------|-------|
| D1 Database | Active | 707e2a1f-3415-43e0-bd68-4de1bb89a66b |
| R2 Bucket | Active | ohio-beer-path-images |
| KV Namespace | Active | 276245328e284f3e8dbc4aba8355d12a |
| Workers AI | Tested | Text gen + embeddings working |
| Vectorize | Created | brewery-embeddings (768 dims) |
| Cron Trigger | Configured | 0 3 * * * |

## Implementation Order

1. **Database Migration** - Add `brewery_vibes` and `user_itineraries` tables
2. **Pages** - Implement missing pages (regions, nearby, itinerary, static)
3. **API Endpoints** - Add missing API routes
4. **Embeddings Pipeline** - Pre-compute and index brewery embeddings
5. **AI Features** - Implement search, recommendations, route planning
6. **Cron Handler** - Batch vibe inference
7. **Deploy & Test** - Push to production via GitHub Actions

## Deployment

- **Source:** GitHub `abandini/ohiobeerpath`
- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`)
- **Command:** `wrangler deploy`
