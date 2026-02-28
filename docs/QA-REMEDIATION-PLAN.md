# QA Remediation Plan - Ohio Beer Path
**Date:** 2025-11-25
**Production URL:** https://ohio-beer-path.bill-burkey.workers.dev
**Status:** CRITICAL ISSUES IDENTIFIED

---

## Executive Summary

Comprehensive QA testing has identified **7 critical issues** and **5 high-priority issues** that prevent core functionality. The application is currently **NOT PRODUCTION READY** due to:
- PWA functionality completely broken (service worker & manifest 404s)
- Brewery detail pages returning raw JSON instead of HTML
- Static assets not uploaded to production R2 bucket

**Estimated Fix Time:** 2-3 hours
**Regression Test Time:** 1 hour
**Total Timeline:** 3-4 hours

---

## Issues Identified

### CRITICAL (P0) - Blocks Core Functionality

#### 1. Service Worker Returns 404
**Severity:** CRITICAL
**Impact:** PWA installation broken, offline functionality unavailable
**URL:** https://ohio-beer-path.bill-burkey.workers.dev/service-worker.js
**Status Code:** 404
**Console Error:**
```
Failed to load resource: the server responded with a status of 404
A bad HTTP response code (404) was received when fetching the script.
Failed to register a ServiceWorker
```

**Root Cause:**
- File exists locally but is empty (0 bytes)
- Upload script used `--local` instead of `--remote` flag
- File never uploaded to production R2 bucket

**Expected Behavior:** Service worker should return 200 and register successfully
**Actual Behavior:** 404 error, service worker registration fails

**Steps to Reproduce:**
1. Visit https://ohio-beer-path.bill-burkey.workers.dev/
2. Open DevTools Console
3. Observe service worker registration error

---

#### 2. Site Manifest Returns 404
**Severity:** CRITICAL
**Impact:** PWA installation broken, no app metadata, can't add to home screen
**URL:** https://ohio-beer-path.bill-burkey.workers.dev/site.webmanifest
**Status Code:** 404
**Console Error:**
```
Failed to load resource: the server responded with a status of 404
Manifest fetch from https://ohio-beer-path.bill-burkey.workers.dev/site.webmanifest failed
```

**Root Cause:**
- File exists locally but is empty (0 bytes)
- Upload script used `--local` instead of `--remote` flag
- File never uploaded to production R2 bucket

**Expected Behavior:** Manifest should return 200 with JSON metadata
**Actual Behavior:** 404 error, no PWA installation option

**Steps to Reproduce:**
1. Visit https://ohio-beer-path.bill-burkey.workers.dev/
2. Open DevTools → Application → Manifest
3. Observe manifest load error

---

#### 3. Brewery Detail Pages Return Raw JSON
**Severity:** CRITICAL
**Impact:** Users cannot view brewery details properly
**URL:** https://ohio-beer-path.bill-burkey.workers.dev/brewery/1
**Response:** Raw JSON object instead of HTML page

**Root Cause:**
- Route exists in `src/routes/pages.ts` line 29-31
- Template file `src/templates/brewery.ts` is MISSING
- Worker returns JSON as fallback

**Expected Behavior:** Formatted HTML page with brewery details, map, hours, amenities
**Actual Behavior:** Raw JSON dump in browser:
```json
{
  "id": 1,
  "name": "'77 Brew House",
  "city": "Navarre",
  "amenities": ["Tap Room", "Brewery Tours", "Beer to Go"],
  ...
}
```

**Steps to Reproduce:**
1. Visit https://ohio-beer-path.bill-burkey.workers.dev/breweries
2. Click "View Details" on any brewery card
3. Observe raw JSON instead of formatted page

---

#### 4. Missing Brewery Detail Template
**Severity:** CRITICAL
**Impact:** Related to issue #3
**File:** `src/templates/brewery.ts` does NOT EXIST

**Root Cause:**
- Template was planned but never created during migration
- Route handler expects template to exist
- Falls back to JSON response

**Expected:** HTML template with brewery layout
**Actual:** File missing from codebase

---

#### 5. Robots.txt Returns 404
**Severity:** HIGH
**Impact:** SEO issues, search engines can't read crawl directives
**URL:** https://ohio-beer-path.bill-burkey.workers.dev/robots.txt
**Status Code:** 404

**Root Cause:** Same as issues #1-2 (upload script issue)

---

### HIGH PRIORITY (P1) - Degrades User Experience

#### 6. Upload Script Uses Local Storage
**Severity:** HIGH
**Impact:** All static assets uploaded to dev storage, not production
**File:** `scripts/upload-assets.sh`
**Lines:** 8, 9, 12, 15, 16, 22

**Root Cause:**
- Missing `--remote` flag on all `wrangler r2 object put` commands
- Assets upload successfully but to local dev R2, not production
- Console shows: "Resource location: local"

**Expected:** Assets in production R2 bucket
**Actual:** Assets only in local development storage

---

#### 7. Empty Service Worker and Manifest Files
**Severity:** HIGH
**Impact:** Even if uploaded, files have no content
**Files:**
- `service-worker.js` - 0 bytes
- `site.webmanifest` - 0 bytes

**Root Cause:**
- Placeholder files created but never populated with actual code
- No PWA functionality implemented

**Expected:** Functional service worker and manifest JSON
**Actual:** Empty files that do nothing

---

#### 8. Missing Brewery Images
**Severity:** HIGH
**Impact:** All brewery cards show broken image placeholders
**Observation:** Cards have `<img>` tags but no actual brewery photos

**Root Cause:**
- Database has `image_url: null` for all breweries
- No brewery photos sourced or uploaded
- Placeholder images not created

**Expected:** Real brewery photos or quality placeholders
**Actual:** Generic broken image icons

---

#### 9. Regions Page Not Implemented
**Severity:** HIGH
**Impact:** Navigation link goes nowhere useful
**URL:** https://ohio-beer-path.bill-burkey.workers.dev/regions
**Testing:** Not yet tested (blocked by other issues)

**Root Cause:** Unknown - needs verification

---

#### 10. Nearby Page Not Implemented
**Severity:** HIGH
**Impact:** Geolocation features unavailable
**URL:** https://ohio-beer-path.bill-burkey.workers.dev/nearby
**Testing:** Not yet tested (blocked by other issues)

**Root Cause:** Unknown - needs verification

---

#### 11. My Tour / Itinerary Not Functional
**Severity:** MEDIUM
**Impact:** Users can't save breweries or plan routes
**URL:** https://ohio-beer-path.bill-burkey.workers.dev/itinerary
**Badge:** Shows "0" items

**Root Cause:** Unknown - needs verification
**Expected:** Add to tour buttons work, itinerary persists
**Actual:** Not yet tested

---

#### 12. No Favicon
**Severity:** LOW
**Impact:** No branded browser tab icon
**Expected:** Favicon displays in browser tab
**Actual:** Generic browser icon

---

## Fix Plan - Prioritized

### Phase 1: Critical Fixes (MUST FIX)
**ETA:** 1-2 hours

#### Fix 1.1: Create Brewery Detail Template
**File:** Create `src/templates/brewery.ts`
**Priority:** P0 - CRITICAL
**Assigned To:** Web Engineering Team

**Implementation:**
```typescript
// src/templates/brewery.ts
import { layout } from './layout';
import type { Brewery } from '../types';

export function breweryPage(brewery: Brewery): string {
  const content = `
    <div class="container py-5">
      <div class="row">
        <div class="col-lg-8">
          <div class="brewery-header mb-4">
            <span class="region-badge">${brewery.region || 'OHIO'}</span>
            <h1 class="display-4 mb-3">${brewery.name}</h1>
            <p class="lead">
              <i class="bi bi-geo-alt"></i> ${brewery.city}, Ohio
              ${brewery.phone ? `• <i class="bi bi-telephone"></i> ${brewery.phone}` : ''}
            </p>
            ${brewery.website_url ? `
              <a href="${brewery.website_url}" target="_blank" class="btn btn-primary">
                <i class="bi bi-globe"></i> Visit Website
              </a>
            ` : ''}
            <button class="btn btn-outline-primary ms-2" onclick="addToTour(${brewery.id})">
              <i class="bi bi-plus-circle"></i> Add to My Tour
            </button>
          </div>

          ${brewery.description ? `
            <div class="card mb-4">
              <div class="card-body">
                <h5 class="card-title">About</h5>
                <p>${brewery.description}</p>
              </div>
            </div>
          ` : ''}

          ${brewery.amenities && brewery.amenities.length > 0 ? `
            <div class="card mb-4">
              <div class="card-body">
                <h5 class="card-title">Amenities</h5>
                <div class="amenities-grid">
                  ${brewery.amenities.map(amenity => `
                    <span class="amenity-badge">
                      <i class="bi bi-check-circle"></i> ${amenity}
                    </span>
                  `).join('')}
                </div>
              </div>
            </div>
          ` : ''}

          ${brewery.hours ? `
            <div class="card mb-4">
              <div class="card-body">
                <h5 class="card-title">Hours</h5>
                <div class="hours-list">
                  ${Object.entries(brewery.hours).map(([day, hours]) => `
                    <div class="hours-row">
                      <span class="day">${day}</span>
                      <span class="time">${hours}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="col-lg-4">
          ${brewery.latitude && brewery.longitude ? `
            <div class="card mb-4">
              <div class="card-body">
                <h5 class="card-title">Location</h5>
                <div id="brewery-map" style="height: 300px; background: #e9ecef; border-radius: 8px;">
                  <p class="text-center pt-5">Map loading...</p>
                </div>
                <p class="mt-3 small">
                  ${brewery.street ? `${brewery.street}<br>` : ''}
                  ${brewery.city}, OH ${brewery.postal_code || ''}
                </p>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${brewery.latitude},${brewery.longitude}"
                   target="_blank" class="btn btn-sm btn-outline-primary w-100">
                  <i class="bi bi-map"></i> Get Directions
                </a>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <script>
      function addToTour(breweryId) {
        const tour = JSON.parse(localStorage.getItem('tour') || '[]');
        if (!tour.includes(breweryId)) {
          tour.push(breweryId);
          localStorage.setItem('tour', JSON.stringify(tour));
          alert('Added to your tour!');
          updateTourBadge();
        } else {
          alert('Already in your tour!');
        }
      }

      function updateTourBadge() {
        const tour = JSON.parse(localStorage.getItem('tour') || '[]');
        document.querySelectorAll('.tour-badge').forEach(badge => {
          badge.textContent = tour.length;
        });
      }
    </script>
  `;

  return layout(brewery.name, content);
}
```

**Test Case:**
- Visit /brewery/1
- Should show formatted HTML page with brewery details
- Should NOT show raw JSON

---

#### Fix 1.2: Populate Service Worker
**File:** `service-worker.js`
**Priority:** P0 - CRITICAL

**Implementation:**
```javascript
// service-worker.js
const CACHE_NAME = 'ohio-beer-path-v1';
const urlsToCache = [
  '/',
  '/breweries',
  '/assets/css/styles.css',
  '/assets/css/mobile.css',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

**Test Case:**
- Service worker should register successfully
- Console should show no errors
- PWA install prompt should appear

---

#### Fix 1.3: Populate Site Manifest
**File:** `site.webmanifest`
**Priority:** P0 - CRITICAL

**Implementation:**
```json
{
  "name": "Ohio Beer Path",
  "short_name": "Beer Path",
  "description": "Discover craft breweries across Ohio. Plan your ultimate brewery tour.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#d97706",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/assets/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/assets/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["food", "lifestyle", "travel"],
  "screenshots": [
    {
      "src": "/assets/images/screenshot-1.png",
      "sizes": "1280x720",
      "type": "image/png"
    }
  ]
}
```

**Test Case:**
- Manifest should load at /site.webmanifest
- PWA install should work on mobile
- Theme color should apply

---

#### Fix 1.4: Fix Upload Script
**File:** `scripts/upload-assets.sh`
**Priority:** P0 - CRITICAL

**Changes:**
Add `--remote` flag to ALL upload commands:

**Line 8:**
```bash
wrangler r2 object put $BUCKET_NAME/assets/css/styles.css --file=assets/css/styles.css --content-type=text/css --remote
```

**Line 9:**
```bash
wrangler r2 object put $BUCKET_NAME/assets/css/mobile.css --file=assets/css/mobile.css --content-type=text/css --remote
```

**Line 12:**
```bash
wrangler r2 object put $BUCKET_NAME/service-worker.js --file=service-worker.js --content-type=application/javascript --remote
```

**Line 15:**
```bash
wrangler r2 object put $BUCKET_NAME/site.webmanifest --file=site.webmanifest --content-type=application/manifest+json --remote
```

**Line 16:**
```bash
wrangler r2 object put $BUCKET_NAME/robots.txt --file=robots.txt --content-type=text/plain --remote
```

**Line 22 (inside loop):**
```bash
wrangler r2 object put $BUCKET_NAME/assets/images/$filename --file=$img --remote
```

**Test Case:**
- Run script
- All files should upload to REMOTE R2
- Console should NOT show "Resource location: local"
- Files should be accessible at production URL

---

### Phase 2: High Priority Fixes
**ETA:** 30-60 minutes

#### Fix 2.1: Create Offline Page
**File:** Create `offline.html`
**Priority:** P1

#### Fix 2.2: Create Placeholder Brewery Images
**Priority:** P1
**Action:** Source or generate brewery placeholder images

#### Fix 2.3: Implement Regions Page
**File:** Create `src/templates/regions.ts`
**Priority:** P1

#### Fix 2.4: Implement Nearby Page
**File:** Create `src/templates/nearby.ts`
**Priority:** P1

---

## Unit Test Plan

### Test Suite 1: Asset Serving
```typescript
// tests/assets.test.ts
describe('Static Assets', () => {
  test('service-worker.js returns 200', async () => {
    const res = await fetch('https://ohio-beer-path.bill-burkey.workers.dev/service-worker.js');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('javascript');
  });

  test('site.webmanifest returns 200', async () => {
    const res = await fetch('https://ohio-beer-path.bill-burkey.workers.dev/site.webmanifest');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('json');
  });

  test('CSS files return 200', async () => {
    const res = await fetch('https://ohio-beer-path.bill-burkey.workers.dev/assets/css/styles.css');
    expect(res.status).toBe(200);
  });
});
```

### Test Suite 2: Brewery Pages
```typescript
// tests/brewery-pages.test.ts
describe('Brewery Detail Pages', () => {
  test('brewery detail returns HTML not JSON', async () => {
    const res = await fetch('https://ohio-beer-path.bill-burkey.workers.dev/brewery/1');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const text = await res.text();
    expect(text).toContain('<!DOCTYPE html>');
    expect(text).not.toContain('{"id":');
  });

  test('brewery page has all sections', async () => {
    const res = await fetch('https://ohio-beer-path.bill-burkey.workers.dev/brewery/1');
    const html = await res.text();
    expect(html).toContain('Amenities');
    expect(html).toContain('Hours');
    expect(html).toContain('Add to My Tour');
  });
});
```

### Test Suite 3: PWA Functionality
```typescript
// tests/pwa.test.ts
describe('PWA Features', () => {
  test('service worker registers successfully', async () => {
    // Browser automation test
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    expect(registration).toBeDefined();
  });

  test('manifest has required fields', async () => {
    const res = await fetch('https://ohio-beer-path.bill-burkey.workers.dev/site.webmanifest');
    const manifest = await res.json();
    expect(manifest.name).toBe('Ohio Beer Path');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
```

---

## Regression Test Plan

### Manual Test Checklist

**Navigation:**
- [ ] Home page loads without errors
- [ ] Breweries page loads
- [ ] Regions page loads
- [ ] Nearby page loads
- [ ] My Tour page loads
- [ ] Individual brewery pages load as HTML
- [ ] All nav links work

**Assets:**
- [ ] Service worker returns 200
- [ ] Site manifest returns 200
- [ ] CSS files load correctly
- [ ] Images load (or placeholders show)
- [ ] Robots.txt returns 200
- [ ] No 404 errors in console

**Functionality:**
- [ ] Search on homepage works
- [ ] Filter by region on breweries page works
- [ ] Brewery search works
- [ ] View Details links go to formatted pages
- [ ] Add to Tour buttons work
- [ ] Tour badge updates
- [ ] PWA can be installed

**API Endpoints:**
- [ ] GET /api/breweries returns JSON
- [ ] GET /api/breweries?region=central works
- [ ] GET /api/breweries?search=dog works
- [ ] GET /api/breweries/1 returns single brewery
- [ ] GET /health returns 200

**Performance:**
- [ ] Page loads in < 3 seconds
- [ ] Assets have cache headers
- [ ] KV caching working (X-Cache headers)

---

## QA Sign-Off Criteria

**All of the following must be TRUE:**

✅ Zero critical (P0) issues remain
✅ All unit tests pass
✅ All regression tests pass
✅ No 404 errors in browser console
✅ Service worker registers successfully
✅ PWA can be installed on mobile
✅ All brewery detail pages show HTML
✅ All navigation links work
✅ API endpoints return correct data

**Sign-Off Requires:**
- QA Engineer approval
- 2+ browser testing (Chrome, Safari)
- Mobile testing (iOS/Android)
- Performance verification

---

## Deployment Plan

1. **Fix Phase 1 issues** (critical)
2. **Run unit tests locally**
3. **Commit fixes to git**
4. **Run corrected upload script**
5. **Deploy Worker** (`npm run deploy`)
6. **Run regression tests**
7. **Get QA sign-off**
8. **Tag release** (v2.0.1-hotfix)

---

## Success Metrics

**Before Fixes:**
- 7 critical issues
- 5 high-priority issues
- PWA: 0% functional
- Brewery pages: 0% functional

**After Fixes (Target):**
- 0 critical issues
- 0 high-priority issues
- PWA: 100% functional
- Brewery pages: 100% functional
- Test pass rate: 100%

---

**Document Owner:** QA Team
**Last Updated:** 2025-11-25
**Next Review:** After Phase 1 fixes deployed
