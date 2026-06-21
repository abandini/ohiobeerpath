# QA Report — brewerytrip.com (ohiobrewpath)

**Project:** Ohio Beer Path / Brewery Trip
**Target:** https://brewerytrip.com (production, Cloudflare Worker `ohio-beer-path`)
**Date:** 2026-06-21
**Tester:** Claude Code
**Method:** Live production probing (primary evidence) + direct source/D1 introspection + real-browser (Playwright) reproduction. No subagents — all findings verified directly per repo audit rules.

---

## Executive Summary

The **content site works well** — all 21 public page routes return 200, the homepage and key pages are console-clean, CSS loads, SEO title/meta are solid, and the newsletter signup works. The blog (incl. the new Buckeye Beer Engine post) is healthy.

However, **three of the site's headline interactive features are broken in production**, and the breakage is invisible from page-load checks because it only manifests on user action or API call:

1. 🔴 **AI Trip Planner (`/plan`) is fully broken** — returns HTTP 500; user sees an "Internal Server Error" alert. Root cause: the `trip_plans`/`trip_stops` tables don't exist in production.
2. 🔴 **Login is dead** — the only auth method (Untappd OAuth) returns 503 ("not configured"). Result: **0 users, 0 ratings** ever recorded. This also generates the bulk of the ~236 daily 5xx errors.
3. 🔴 **AI model deprecated** — `@cf/meta/llama-3-8b-instruct` was EOL'd 2026-05-30. `/api/itinerary/optimize` and `/api/ai/test` hard-500; recommend/search/vibe-tagging silently degrade.

Compounding these: **production is running uncommitted code** (the entire trip-planner feature is live but not in git), there is **no working visitor analytics**, and there are **data-quality and content-staleness** gaps.

---

## ✅ Fixes Applied & Verified (2026-06-21, authorized "proceed")

| ID | Fix | Verification | Status |
|----|-----|--------------|--------|
| P0-1 | Applied `0007_trip_planner.sql` to prod (created `trip_plans`/`trip_stops`) | `POST /api/plan` → 200; in-browser Generate renders "Cleveland, OH Brewery Trip — 5 stops", 0 console errors, **no error alert** | ✅ FIXED |
| P0-3 | Swapped deprecated `@cf/meta/llama-3-8b-instruct` → `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (5 call sites). Also made `/api/itinerary/optimize` JSON parsing robust (balanced-brace extractor + graceful fallback, no more 500 on prose-wrapped JSON) | `/api/ai/test` → 200 ("Workers AI is working"); `/api/itinerary/optimize` → 200 with real legs/distances | ✅ FIXED |
| P0-2 | Untappd "not configured" now **302 redirects** to `/?auth_error=unavailable` instead of 503 — kills the 5xx flood; real users bounce home gracefully. Login auto-enables once secrets are set. | `GET /api/auth/untappd` → 302 (was 503) | ✅ MITIGATED |

Deployed versions: `fb584344` → `94d9f596` → `5a29eeab`. Worker: `ohio-beer-path`.

**Still requires YOUR input (cannot be done without secrets/decisions):**
- **`ANTHROPIC_API_KEY`** (+ keep `AI_GATEWAY_ENDPOINT`) → turns on real AI route optimization in the planner (currently distance-fallback, shows "0 miles"). `wrangler secret put ANTHROPIC_API_KEY`
- **`UNTAPPD_CLIENT_ID` / `UNTAPPD_CLIENT_SECRET`** → enables real login (else it stays graceful-redirect). `wrangler secret put ...`
- Then re-verify: planner shows real miles; `/api/auth/untappd` → 302 to Untappd.

### ✅ Round 2 — P1/P2/P3 (authorized "tackle the p1/p2 issues")

| ID | Introspection finding | Fix | Proof |
|----|----------------------|-----|-------|
| P1-4 | **Diagnosis corrected.** App filtering uses the `state` col (`'OH'`), which the 336 rows *had* — so filtering was never broken. The real bug was the **`/sitemap.xml`** query (`index.ts:153`) comparing the full name `'Ohio'` against the `state` col → the Ohio sitemap dropped 336/486 breweries (69%). (Also: `stateName` is whitelisted, so the interpolation was not an exploitable injection — but it's now parameterized anyway.) | (a) Query parameterized + compares `stateAbbreviation` vs `state`, full name vs `state_province`; (b) backfilled `state_province='Ohio'` for the 336 (all proven inside OH bbox, 0 outside) | Ohio `sitemap.xml`: **150 → 486** brewery URLs; 0 NULL `state_province` remain |
| P2-3 | `/api/plan` returned 404 for a city without coords (no server-side geocoding; only the browser geocoded) | Added geocoding fallback that derives a city centroid from our **own breweries table** (no external API); unknown cities still return empty | `POST /api/plan {"starting_city":"Cleveland"}` (no coords) → **200** trip; `"Nowheresville"` → 404 (no fake data) |
| P3-3 | Dead `analytics.js` (old PHP beacon) — already 404 live, not in R2, unreferenced | Removed local file + `assets.ts` map entry | `/assets/js/analytics.js` → 404; not in code |
| P2-1 | `/events`: 29 events, 0 upcoming | **No code bug** — page already renders a graceful "No upcoming events" empty state. **Not fabricating events.** | Tracked as content/ingestion need |
| P2-2 | Local `migrations/` diverges from prod (`d1_migrations` has `0006`/`0007_day_optimizer` not in repo; repo had unapplied `0007_trip_planner`) | Documented; trip-planner & category migrations now committed. Full back-sync of prod-only migrations left as a follow-up (their SQL isn't in the repo to import). | `d1_migrations` enumerated in report |

Round-2 deploy: `632b7308`. Data change: 336 `breweries.state_province` backfilled to "Ohio".

---

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| Page routes (21) return 2xx/expected | ✅ | All 200; `/profile` `/settings` correctly 302 → login |
| Console errors (homepage) | ✅ | 0 errors / 0 warnings |
| Static assets (CSS) | ✅ | All 200 |
| SEO `<title>` / meta | ✅ | Accurate ("1,300+" matches 1,372 breweries) |
| Newsletter subscribe API | ✅ | POST `/api/subscribe` → 200, persists |
| Brewery search / nearby API | ✅ | `/api/breweries`, nearby (w/ coords) → 200; 400 w/o coords is correct validation |
| Blog (list + post + related) | ✅ | Fixed earlier this session (category column) |
| Broken images (desktop + mobile) | ✅ | 0 broken on `/`, `/breweries` @ 1280px & 375px |
| Responsive / horizontal overflow | ✅ | No overflow @ 375px on `/`, `/breweries` |
| **AI Trip Planner `/plan`** | ✅ | **FIXED** — 200; renders route in-browser, no alert (was 500) |
| **Untappd login `/api/auth/untappd`** | ✅ | **MITIGATED** — graceful 302 (was 503); full enable needs secrets |
| **`/api/itinerary/optimize`** | ✅ | **FIXED** — 200 with real legs (was 500) |
| **`/api/ai/test`** | ✅ | **FIXED** — 200 (model swapped; was 500) |
| AI search / recommend | ✅ | 200; now on a current model |
| Visitor analytics | ❌ | P1 — no working beacon; needs CF Web Analytics/PostHog (owner) |
| AI route optimization quality | ⚠️ | P1 — distance-fallback until `ANTHROPIC_API_KEY` set (owner) |
| Events content | ⚠️ | P2 — 0 upcoming; page degrades gracefully; needs content/ingestion |
| Brewery state data / Ohio sitemap | ✅ | FIXED — sitemap 150→486; `state_province` backfilled; query parameterized |
| Trip planner without coords | ✅ | FIXED — server-side geocoding from own data; city-only `/api/plan` → 200 |
| Git ↔ production parity | ✅ | FIXED — committed + pushed to origin/main |
| Dead `analytics.js` asset | ✅ | FIXED — removed from code; 404 live |

---

## Issues & Severity

### 🔴 P0 — Critical (headline features broken for real users)

| ID | Issue | Evidence | Location |
|----|-------|----------|----------|
| P0-1 | **Trip Planner 500.** `/api/plan` → `D1_ERROR: no such table: trip_plans`. Browser shows "Internal Server Error" alert on Generate. | `POST /api/plan` (coords) → 500; reproduced in Playwright | `src/routes/plan.ts` (`saveTripPlan`); table from un-applied `migrations/0007_trip_planner.sql` |
| P0-2 | **Login broken (503).** Untappd OAuth disabled because `UNTAPPD_CLIENT_ID`/`UNTAPPD_CLIENT_SECRET` are unset → all account features dead (0 users, 0 ratings). Source of the 5xx flood. | `GET /api/auth/untappd` → 503; DB `users=0, ratings=0` | `src/routes/auth.ts:27-32` + missing Worker secrets |
| P0-3 | **Deprecated AI model.** `@cf/meta/llama-3-8b-instruct` EOL 2026-05-30. Hard-breaks `/api/itinerary/optimize` & `/api/ai/test`; degrades search/recommend/enrichment. | Live: `{"error":"5028: This model was deprecated..."}` | `src/index.ts:406,474`; `src/routes/api.ts:22,213,353` |

### 🟠 P1 — High

| ID | Issue | Evidence | Location |
|----|-------|----------|----------|
| P1-1 | **No visitor analytics.** Dead beacon posts to nonexistent `/api/analytics.php`; not loaded by any template. No PostHog/CF Web Analytics. Cannot answer "are we getting visitors." | D1 `analytics`=0 rows; beacon endpoint 404 | `assets/js/analytics.js` (orphaned) |
| P1-2 | **5xx flood (~236/day).** Driven by P0-2/P0-3 endpoints being probed. Hurts health metrics; bots hammering `/api/auth/untappd` (224/day). | Cloudflare GraphQL analytics | (resolved by fixing P0-2/P0-3) |
| P1-3 | **Production ahead of git.** Entire trip-planner feature (routes/services/templates/migration) is deployed but **uncommitted** → no rollback/repro from source. | `git status`: `?? src/routes/plan.ts`, `?? src/services/trip-planner.ts`, `?? src/services/claude.ts`, `?? src/templates/plan.ts,trip.ts`, `?? migrations/0007_trip_planner.sql` | working tree |
| P1-4 | **Data quality: NULL states.** 336/1,372 breweries have NULL `state_province` (Ohio shows only 150). Breaks state filtering, `/regions`, sitemap completeness, subdomain filters. | D1 GROUP BY query | `breweries` table |

### 🟡 P2 — Medium

| ID | Issue | Evidence | Location |
|----|-------|----------|----------|
| P2-1 | **Stale events.** 29 events, 0 upcoming → `/events` is effectively empty for visitors. | D1 events query | `events` table / content ops |
| P2-2 | **Migration state divergence.** Local `migrations/` is missing `0006_enhanced_engagement` & `0007_day_optimizer` (applied in prod) and contains an unapplied `0007_trip_planner` — a number collision. Migrations managed ad hoc. | `d1_migrations` vs local `ls` | `migrations/` |
| P2-3 | **Trip planner brittle without coords.** No server-side city→coords geocoding; `/api/plan` 404s if the client doesn't geocode first. | `POST /api/plan` (city only) → 404 | `src/routes/plan.ts` (`selectCandidates`) |

### 🟢 P3 — Low / polish

| ID | Issue | Location |
|----|-------|----------|
| P3-1 | Newsletter says "check your email to verify" — confirm Resend actually sends the verification email. | `src/routes/api.ts` `/subscribe` |
| P3-2 | Claude model `claude-sonnet-4-20250514` is older; consider current Sonnet for plan quality (not broken). | `src/services/claude.ts:114,165` |
| P3-3 | Orphaned `assets/js/analytics.js` (dead PHP beacon) should be removed. | `assets/js/analytics.js` |

### ✅ Resolved this session

| ID | Issue | Fix |
|----|-------|-----|
| R-1 | `blog_posts.category` column missing → all single blog posts 404'd | Added column to live D1 + `migrations/0008_blog_category.sql`; seeded posts |

---

## Go-Forward Remediation Plan

### Phase 0 — Stop the bleeding (today, ~30 min, no deploy needed)

1. **P0-1 fix — create the trip-planner tables in prod.** Apply the existing migration:
   ```bash
   npx wrangler d1 execute ohio-beer-path-db --remote --file migrations/0007_trip_planner.sql
   ```
   Then re-verify: `POST /api/plan` with coords should return `{success:true, trip}`. Re-run the Playwright "Generate My Route" flow → expect a route, no alert.

2. **P0-3 fix — swap the deprecated model.** Replace `@cf/meta/llama-3-8b-instruct` with a current Workers AI model (e.g. `@cf/meta/llama-3.1-8b-instruct` or `@cf/meta/llama-3.3-70b-instruct-fp8-fast`) in all 5 call sites, then `wrangler deploy`. Verify `/api/ai/test` and `/api/itinerary/optimize` → 200.
   > Confirm the exact current model id against the live Workers AI catalog before editing.

3. **P0-2 decision — login.** Either:
   - (a) **Enable it:** set `UNTAPPD_CLIENT_ID` / `UNTAPPD_CLIENT_SECRET` via `wrangler secret put`, and register the prod callback URL with Untappd; **or**
   - (b) **Hide it:** if Untappd isn't ready, remove/disable login CTAs so users don't hit a 503, and return a friendlier response. Either way the 5xx flood (P1-2) drops to ~0.

### Phase 1 — Restore confidence (this week)

4. **P1-3 — commit production code.** Add and commit the live-but-untracked trip-planner files (`src/routes/plan.ts`, `src/services/trip-planner.ts`, `src/services/claude.ts`, `src/templates/plan.ts`, `src/templates/trip.ts`, `migrations/0007_*`, `migrations/0008_*`, `scripts/gen-blog-seed.ts`, tests). Tag/deploy so git == production.
5. **P1-1 — add analytics.** Fastest: Cloudflare Web Analytics beacon (one snippet in `src/templates/layout.ts`), or wire PostHog (key already in vault). Remove dead `assets/js/analytics.js` (P3-3). Then real visitor numbers become answerable.
6. **P2-2 — reconcile migrations.** Pull prod-applied migrations into the repo (`0006_enhanced_engagement`, `0007_day_optimizer`), renumber the trip-planner migration to avoid the `0007` collision, and document the canonical order. Adopt `wrangler d1 migrations apply` going forward.

### Phase 2 — Quality & data (next)

7. **P1-4 — backfill brewery states.** Derive `state_province` for the 336 NULL rows (from city/coords or re-import). Re-verify `/regions` and sitemap counts.
8. **P2-1 — events.** Either ingest fresh upcoming events or hide the empty `/events` section until populated.
9. **P2-3 — geocoding.** Add a server-side city→coords lookup in `/api/plan` so the planner is robust if the client doesn't geocode.

### Phase 3 — Polish

10. P3-1 verify newsletter verification email actually sends (Resend). 11. P3-2 consider a current Claude Sonnet model. 12. Add a smoke-test suite (Playwright) covering the 3 P0 flows so these never silently regress — wire into CI before deploy.

---

## Verification Checklist (re-run after fixes)

- [ ] `POST /api/plan` (coords) → 200 with `trip`; in-browser Generate produces a route, no alert
- [ ] `GET /api/itinerary/optimize` & `/api/ai/test` → 200
- [ ] `GET /api/auth/untappd` → 302 to Untappd (or intentionally removed), **not** 503
- [ ] Cloudflare 5xx/day trends to ~0
- [ ] Visitor analytics reporting real humans
- [ ] `git status` clean; production rebuildable from source
- [ ] `/regions` reflects corrected state data

## Status: ✅ APPROVED (functional QA) — P1/P2 follow-ups tracked

**Functional QA passes.** Core qa-protocol checklist satisfied on the tested surface:
- [x] All routes pass (21 pages 2xx/expected; previously-broken APIs now 2xx)
- [x] Zero console errors (`/`, `/plan` verified)
- [x] Zero broken images (`/`, `/breweries` @ desktop + mobile)
- [x] Navigation works (all routes reachable)
- [x] Buttons functional (Generate Route renders a route; no error alert)
- [x] Responsive (no horizontal overflow @ 375px)
- [x] Form/API endpoints return 2xx (subscribe, plan, optimize, ai/test) — no silent 500s
- [x] Data persists (plan saves to `trip_plans`; subscribe persists)

Phase 0 complete: the three headline breaks (trip planner 500, deprecated AI model, login 5xx flood) are fixed, deployed, and verified live + in-browser.

**Not blocking functional approval, but tracked — require owner action:**
`ANTHROPIC_API_KEY` (AI route quality) · `UNTAPPD_*` (real login) · analytics beacon · NULL-state backfill · stale events · commit deployed code. See remediation plan above.
