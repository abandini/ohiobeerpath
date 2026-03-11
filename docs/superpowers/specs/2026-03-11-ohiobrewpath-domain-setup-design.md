# Phase 1: ohiobrewpath.com Domain Setup

**Date:** 2026-03-11
**Status:** Approved
**Project:** ohiobrewpath (https://github.com/abandini/ohiobrewpath)

## Summary

Add ohiobrewpath.com as a second domain on the existing ohio-beer-path Cloudflare Worker. Same backend, differentiated branding. Ohio Brew Path becomes the "little brother" — a focused Ohio craft beer authority site that cross-promotes the multi-state BreweryTrip.com.

## Strategic Context

- **brewerytrip.com** = multi-state trip planner (6 states, 1,300+ breweries)
- **ohiobrewpath.com** = Ohio-deep craft beer authority (442 Ohio breweries)
- Same Cloudflare Worker serves both domains
- Differentiated branding prevents SEO cannibalization
- EMD (exact-match domain) advantage for "ohio brew path" searches
- Two SERP slots for Ohio brewery queries instead of one

## Architecture

### Approach: Same Worker, Hostname-Aware Branding

No new infrastructure. The worker detects which domain the request came from and adjusts branding accordingly. All routes, API endpoints, database queries, caching, and assets are shared.

```
                    ┌──────────────────────┐
                    │   Cloudflare DNS     │
                    └──────┬───────┬───────┘
                           │       │
              ohiobrewpath.com   brewerytrip.com
              *.brewerytrip.com
                           │       │
                    ┌──────┴───────┴───────┐
                    │  ohio-beer-path       │
                    │  Cloudflare Worker    │
                    │                       │
                    │  subdomainMiddleware  │
                    │  ├─ ohiobrewpath.com  │
                    │  │  → Ohio + OBP brand│
                    │  ├─ ohio.brewerytrip  │
                    │  │  → Ohio + BT brand │
                    │  ├─ brewerytrip.com   │
                    │  │  → Multi-state     │
                    │  └─ *.brewerytrip.com │
                    │     → State-specific  │
                    └───────────────────────┘
```

## Changes Required

### 1. wrangler.toml — Add Route

```toml
[[routes]]
pattern = "ohiobrewpath.com/*"
zone_name = "ohiobrewpath.com"
```

**Cloudflare Zone ID:** dd39d550117c780b68a4beb4c8fc3bcb
**Account ID:** ec81afc4dc58b34ce34e7ad19fd6fbdd

DNS must have an AAAA record pointing to `100::` (Cloudflare Workers proxy) or a proxied A record.

### 2. src/types.ts — Extend SubdomainContext

Add `brandDomain` field to `SubdomainContext`:

```typescript
export interface SubdomainContext {
  stateSubdomain: string | null;
  stateName: string | null;
  stateAbbreviation: string | null;
  isMultiState: boolean;
  baseUrl: string;
  brandDomain: 'brewerytrip' | 'ohiobrewpath';  // NEW
}
```

### 3. src/middleware/subdomain.ts — Detect ohiobrewpath.com

Extend hostname detection:

- If host includes `ohiobrewpath.com`:
  - Set state to Ohio (OH)
  - Set `isMultiState: false`
  - Set `brandDomain: 'ohiobrewpath'`
  - Set `baseUrl: 'https://ohiobrewpath.com'`
- All other existing logic unchanged
- Default `brandDomain: 'brewerytrip'` for all other hostnames

### 4. src/templates/layout.ts — Branch Branding

Extend `getSiteBranding()`:

```
if brandDomain === 'ohiobrewpath':
  siteName: "Ohio Brew Path"
  tagline: "Your Guide to Ohio's Craft Breweries"
  heroTitle: "Explore Ohio's Craft Beer Scene"
  crossPromo: { text: "Planning a multi-state trip?", url: "https://brewerytrip.com", cta: "Visit BreweryTrip.com" }
else if state-specific subdomain:
  siteName: "{State} Brewery Trip"
  (existing logic)
else:
  siteName: "Brewery Trip"
  (existing logic)
```

### 5. src/templates/home.ts — Cross-Promotion CTA

When `brandDomain === 'ohiobrewpath'`, add a cross-promotion section:
- Subtle banner or card in the footer area
- "Exploring beyond Ohio? BreweryTrip.com covers 6 states with route planning."
- Links to brewerytrip.com (not ohio.brewerytrip.com — avoid cannibalization)

### 6. SEO Differentiation

| Element | ohiobrewpath.com | ohio.brewerytrip.com |
|---------|-----------------|---------------------|
| Site name | Ohio Brew Path | Ohio Brewery Trip |
| Meta description | "Ohio's definitive craft beer guide. Explore 442 breweries by vibe, city, and trail." | "Plan your Ohio brewery road trip. Find breweries, build routes, explore Ohio craft beer." |
| Schema.org WebSite name | Ohio Brew Path | Ohio Brewery Trip |
| OG site_name | Ohio Brew Path | Ohio Brewery Trip |
| Canonical | self (ohiobrewpath.com/...) | self (ohio.brewerytrip.com/...) |
| robots.txt | Allow all | Allow all |
| Sitemap | /sitemap.xml (Ohio only) | /sitemap.xml (Ohio only) |

### 7. Canonical URL Strategy

- ohiobrewpath.com pages are canonical to themselves
- ohio.brewerytrip.com pages are canonical to themselves
- No cross-domain canonical tags (content is branded differently)
- Google will see them as related but distinct properties

## Files Modified

| File | Type of Change |
|------|---------------|
| `wrangler.toml` | Add route for ohiobrewpath.com |
| `src/types.ts` | Add `brandDomain` to SubdomainContext |
| `src/middleware/subdomain.ts` | Detect ohiobrewpath.com hostname |
| `src/templates/layout.ts` | Branch branding on brandDomain |
| `src/templates/home.ts` | Cross-promotion CTA |

## What Does NOT Change

- All API routes (`/api/*`)
- Database queries and schema
- Asset serving (R2, KV caching)
- Authentication (Untappd OAuth)
- All other templates (brewery detail, trails, events, etc. — they inherit branding from layout.ts)
- Service worker, PWA manifest (these use `getSiteBranding()` already)

## Testing

1. Deploy and verify ohiobrewpath.com serves Ohio content with "Ohio Brew Path" branding
2. Verify ohio.brewerytrip.com still serves Ohio content with "Ohio Brewery Trip" branding
3. Verify brewerytrip.com still serves multi-state content
4. Check canonical URLs are self-referencing per domain
5. Verify cross-promotion CTA appears on ohiobrewpath.com only
6. Check OG tags differ between the two Ohio-focused domains

## Rollback

Remove the `[[routes]]` entry from wrangler.toml and redeploy. The domain simply stops resolving to the worker. Zero risk.

## Future Phases (Not in Scope)

- Phase 2: Data update (314→442 breweries, ratings)
- Phase 3: SEO content pages (city landing pages, vibe filter pages)
- Phase 4: Digital passport system
- Phase 5: Monetization (enhanced listings, affiliates)
- Phase 6: User acquisition campaigns
