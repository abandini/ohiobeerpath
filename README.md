# Ohio Beer Path 🍺

Discover Ohio's craft breweries and plan your perfect brewery tour.

**Live Site:** [ohio-beer-path.bill-burkey.workers.dev](https://ohio-beer-path.bill-burkey.workers.dev)
**Production URL:** https://ohio-beer-path.bill-burkey.workers.dev

## Features

- **351 Ohio Breweries** - Comprehensive database of Ohio craft breweries
- **Interactive Maps** - Google Maps integration with brewery locations
- **Regional Browsing** - Explore breweries by Ohio region
- **Search** - Find breweries by name, city, or ZIP code
- **Itinerary Builder** - Create custom brewery tour routes
- **Nearby Search** - Find breweries near your current location
- **PWA Support** - Install as a mobile app, works offline
- **Mobile Optimized** - Responsive design for all devices

## Screenshots

*(Screenshots to be added after deployment)*

## Tech Stack

**Version 2.0 - Cloudflare Workers Architecture:**
- **Runtime:** Cloudflare Workers (Serverless)
- **Framework:** Hono.js (TypeScript)
- **Database:** D1 (SQLite on edge)
- **Storage:** R2 (Object storage)
- **Caching:** KV (Key-value store)
- **Frontend:** HTML5, CSS3, Bootstrap 5
- **APIs:** Google Maps API, Workers AI (embeddings + text generation)
- **AI Search:** Vectorize (semantic search via embeddings)
- **PWA:** Service Worker, Web App Manifest
- **CI/CD:** GitHub Actions

### Cloudflare Workers Architecture

Ohio Beer Path runs entirely on Cloudflare's edge network:

- **Workers:** Serverless functions for all logic
- **D1:** SQLite database with 351 Ohio breweries (+ neighboring states)
- **R2:** Static asset hosting (CSS, JS, images)
- **KV:** API response caching (1-hour TTL)
- **Workers AI:** Brewery recommendations, vibe analysis, description generation
- **Vectorize:** Semantic search via `@cf/baai/bge-base-en-v1.5` embeddings

**Performance:**
- Global latency: ~15ms (300+ edge locations)
- Auto-scaling: Infinite scale
- Zero downtime: Always available
- 99.99% uptime: Cloudflare SLA

**Deployment:**
- GitHub Actions CI/CD
- Auto-deploy on push to main
- Version tags trigger releases
- D1 migrations run automatically

See [CLOUDFLARE_MIGRATION.md](docs/CLOUDFLARE_MIGRATION.md) for migration details.

## Getting Started

### Prerequisites

- Node.js 18+
- Cloudflare account (free tier)
- Wrangler CLI (`npm install -g wrangler`)
- Google Maps API key (for map features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/abandini/ohiobeerpath.git
   cd ohiobeerpath
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up local D1 database:
   ```bash
   npm run db:migrate:local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:8787 in your browser

### Deployment

Deploy to Cloudflare Workers:

```bash
# Deploy to production
npm run deploy

# Apply migrations to production D1
wrangler d1 migrations apply ohio-beer-path-db --remote

# Upload assets to production R2
./scripts/upload-assets.sh
```

Or push to main branch - GitHub Actions will automatically deploy.

## Design System

Ohio Beer Path features a modern craft beer aesthetic with:

- **Color Palette:** Amber (#d97706) and Hops Green (#16a34a)
- **Typography:** Outfit (headings) + Inter (body)
- **Components:** Glass-morphism effects, subtle textures
- **Mobile-First:** Bottom navigation, 44px+ touch targets
- **Accessibility:** WCAG AA compliant, keyboard navigation

See [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) for complete design documentation.

## Documentation

- [Design System](docs/DESIGN_SYSTEM.md) - Color palette, typography, components
- [Development Guide](docs/DEVELOPMENT.md) - Local development setup
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Testing Guide](docs/TESTING.md) - QA checklist
- [Contributing](CONTRIBUTING.md) - How to contribute

## Project Structure

```
ohiobeerpath/
├── src/
│   ├── index.ts             # Hono app entry point, middleware + route mounting
│   ├── types.ts             # TypeScript types (Env, Brewery, etc.)
│   ├── db/                  # Database layer (D1 queries)
│   │   ├── breweries.ts     # Brewery CRUD + search + nearby
│   │   ├── ratings.ts       # Beer rating queries
│   │   ├── users.ts         # User management
│   │   └── visits.ts        # Check-in tracking
│   ├── middleware/           # Hono middleware
│   │   ├── assets.ts        # Serve static files from R2
│   │   ├── cache.ts         # KV cache for API responses
│   │   ├── cors.ts          # CORS headers
│   │   ├── auth.ts          # Authentication
│   │   └── subdomain.ts     # Subdomain routing
│   ├── routes/              # Route handlers
│   │   ├── api.ts           # JSON API endpoints (/api/*)
│   │   ├── pages.ts         # HTML page routes (/)
│   │   ├── admin.ts         # Admin dashboard (/admin/*)
│   │   ├── ratings.ts       # Rating endpoints
│   │   └── ...
│   ├── templates/           # Server-side HTML templates (TypeScript)
│   │   ├── layout.ts        # Base layout wrapper
│   │   ├── home.ts          # Homepage
│   │   ├── breweries.ts     # Brewery listing
│   │   ├── brewery.ts       # Brewery detail
│   │   ├── trails.ts        # Curated brewery trails
│   │   └── ...
│   └── services/            # Business logic
│       ├── session.ts       # Session management
│       ├── untappd.ts       # Untappd API integration
│       └── ...
├── assets/                  # Static files (uploaded to R2)
│   ├── css/                 # Stylesheets
│   └── js/                  # Client-side JavaScript
├── data/                    # Brewery data files (JSON)
├── migrations/              # D1 database migrations
├── scripts/                 # Build/deploy utilities
├── tests/                   # Vitest test suite
├── wrangler.toml            # Cloudflare Workers config
└── docs/                    # Documentation
```

## API Endpoints

### GET /api/breweries
Get all breweries or filter by region/city/search.
```bash
curl "https://ohio-beer-path.bill-burkey.workers.dev/api/breweries?region=central"
curl "https://ohio-beer-path.bill-burkey.workers.dev/api/breweries?city=Cleveland"
curl "https://ohio-beer-path.bill-burkey.workers.dev/api/breweries?search=brew"
```

### GET /api/breweries/:id
Get a single brewery by ID.
```bash
curl "https://ohio-beer-path.bill-burkey.workers.dev/api/breweries/1"
```

### GET /api/breweries/nearby
Find breweries near coordinates (lat/lng/radius in miles).
```bash
curl "https://ohio-beer-path.bill-burkey.workers.dev/api/breweries/nearby?lat=41.5&lng=-81.7&radius=25"
```

**Note:** All API responses are cached in KV for 1 hour. Check `X-Cache` header for HIT/MISS.

## Data

The brewery dataset includes:
- 351 Ohio craft breweries
- Complete address information
- Business hours
- Phone numbers and websites
- Geographic coordinates
- Regional classifications
- Amenities (tap rooms, tours, etc.)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Roadmap

- [x] User accounts and saved itineraries
- [x] Brewery reviews and ratings
- [x] Events calendar
- [x] AI-powered semantic search and recommendations
- [x] Multi-state expansion (OH, IN, KY, MI, PA, WV)
- [ ] Beer style filtering
- [ ] Social sharing features
- [ ] Mobile app (iOS/Android)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Brewery data sourced from public directories and brewery websites
- Google Maps Platform for mapping and directions
- Bootstrap team for the UI framework
- Ohio craft brewery community

## Contact

- **Website:** [ohiobeerpath.com](https://ohiobeerpath.com)
- **GitHub:** [github.com/abandini/ohiobeerpath](https://github.com/abandini/ohiobeerpath)
- **Issues:** [Report a bug or request a feature](https://github.com/abandini/ohiobeerpath/issues)

---

**Drink responsibly. Never drink and drive. Always have a designated driver or use rideshare services.**
