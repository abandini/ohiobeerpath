# Ohio Beer Path - Complete Build & Deployment Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Ohio Beer Path brewery discovery application and prepare it for production deployment.

**Architecture:** PHP-based web application with RESTful API, Google Maps integration, MySQL database, and PWA capabilities. Frontend uses Bootstrap 5 with vanilla JavaScript for brewery discovery, search, and itinerary building.

**Tech Stack:** PHP 7.4+, MySQL, JavaScript ES6+, Bootstrap 5, Google Maps API, Python 3 (data processing), PWA (Service Worker + Manifest)

---

## Task 1: Git Repository Cleanup

**Files:**
- Review: All untracked files (40+ files)
- Modify: `.gitignore` (create if needed)
- Commit: All project files

**Step 1: Create .gitignore file**

Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/.gitignore`

```
# Environment variables
.env
config.local.php

# macOS
.DS_Store
.AppleDouble
.LSOverride

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/

# Node
node_modules/
npm-debug.log
yarn-error.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log

# Backup files
*.bak
*.tmp
*~
```

**Step 2: Review untracked files**

Run: `cd /Users/billburkey/CascadeProjects/ohiobrewpath && git status`

Expected: List of untracked files including all PHP files, includes/, api/, assets/, data scripts

**Step 3: Stage all project files**

Run:
```bash
cd /Users/billburkey/CascadeProjects/ohiobrewpath
git add .gitignore
git add includes/ api/ assets/
git add *.php
git add *.py *.js
git add requirements.txt site.webmanifest robots.txt sitemap.xml
git add offline.html
```

**Step 4: Review staged files**

Run: `git status`

Expected: ~45 files staged for commit, excluding .DS_Store and other ignored files

**Step 5: Commit project foundation**

Run:
```bash
git commit -m "feat: add complete application structure

- Add PHP pages (index, brewery, regions, nearby, itinerary, etc.)
- Add API endpoints (breweries, search, analytics)
- Add includes directory with reusable components
- Add assets (JS, CSS, images, data)
- Add data processing scripts (Python & JavaScript)
- Add PWA support (service worker, manifest, offline page)
- Add SEO configuration (robots.txt, sitemap)
- Add 351 Ohio breweries dataset (JSON)
- Add .gitignore for proper version control"
```

Expected: Large commit with all foundation files

---

## Task 2: Environment Configuration

**Files:**
- Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/.env.example`
- Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/.env` (local only)
- Modify: `/Users/billburkey/CascadeProjects/ohiobrewpath/includes/config.php`

**Step 1: Create .env.example template**

Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/.env.example`

```
# Database Configuration
DB_HOST=localhost
DB_NAME=ohiobrewpath
DB_USER=root
DB_PASS=

# Google Maps API
GOOGLE_MAPS_API_KEY=your_api_key_here

# Site Configuration
SITE_URL=https://ohiobeerpath.com
DEFAULT_REGION=central

# Cache Settings
CACHE_ENABLED=true
CACHE_DURATION=3600

# Environment
APP_ENV=production
DEBUG=false
```

**Step 2: Create local .env file**

Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/.env`

```
# Database Configuration
DB_HOST=localhost
DB_NAME=ohiobrewpath
DB_USER=root
DB_PASS=

# Google Maps API - Replace with your actual key
GOOGLE_MAPS_API_KEY=AIzaSyBr7c_NnuwqNW3-dMPCNJAVTpKBQ2RULqI

# Site Configuration
SITE_URL=http://localhost:8000
DEFAULT_REGION=central

# Cache Settings
CACHE_ENABLED=true
CACHE_DURATION=3600

# Environment
APP_ENV=development
DEBUG=true
```

**Step 3: Update config.php to use .env**

Modify: `/Users/billburkey/CascadeProjects/ohiobrewpath/includes/config.php`

Add at the top (before existing code):

```php
<?php
// Load environment variables from .env file
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// Existing config with fallbacks to environment variables
define('DB_HOST', $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'ohiobrewpath');
define('DB_USER', $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '');
define('GOOGLE_MAPS_API_KEY', $_ENV['GOOGLE_MAPS_API_KEY'] ?? getenv('GOOGLE_MAPS_API_KEY') ?: 'AIzaSyBr7c_NnuwqNW3-dMPCNJAVTpKBQ2RULqI');
define('SITE_URL', $_ENV['SITE_URL'] ?? getenv('SITE_URL') ?: 'https://ohiobeerpath.com');
define('DEFAULT_REGION', $_ENV['DEFAULT_REGION'] ?? getenv('DEFAULT_REGION') ?: 'central');
define('CACHE_ENABLED', filter_var($_ENV['CACHE_ENABLED'] ?? getenv('CACHE_ENABLED') ?: 'true', FILTER_VALIDATE_BOOLEAN));
define('CACHE_DURATION', (int)($_ENV['CACHE_DURATION'] ?? getenv('CACHE_DURATION') ?: 3600));
define('APP_ENV', $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'production');
define('DEBUG', filter_var($_ENV['DEBUG'] ?? getenv('DEBUG') ?: 'false', FILTER_VALIDATE_BOOLEAN));
```

**Step 4: Test configuration loading**

Run: `php -r "require 'includes/config.php'; echo 'DB_HOST: ' . DB_HOST . PHP_EOL; echo 'SITE_URL: ' . SITE_URL . PHP_EOL;"`

Expected:
```
DB_HOST: localhost
SITE_URL: http://localhost:8000
```

**Step 5: Commit environment configuration**

Run:
```bash
git add .env.example includes/config.php
git commit -m "feat: add environment variable support

- Add .env.example template
- Update config.php to load from .env file
- Support fallback to getenv() for production
- Add local .env to .gitignore"
```

---

## Task 3: Database Setup

**Files:**
- Review: `/Users/billburkey/CascadeProjects/ohiobrewpath/setup-database.php`
- Execute: Database initialization script
- Test: Database connection

**Step 1: Review setup-database.php structure**

Run: `head -50 /Users/billburkey/CascadeProjects/ohiobrewpath/setup-database.php`

Expected: See database creation SQL and table schema

**Step 2: Check if database exists**

Run: `mysql -u root -e "SHOW DATABASES LIKE 'ohiobrewpath';"`

Expected: Empty result (database doesn't exist yet) or existing database

**Step 3: Run database setup script**

Run: `php /Users/billburkey/CascadeProjects/ohiobrewpath/setup-database.php`

Expected:
```
Creating database...
Database 'ohiobrewpath' created successfully
Creating tables...
Table 'breweries' created successfully
Table 'regions' created successfully
Table 'analytics' created successfully
Importing brewery data from JSON...
Imported 351 breweries
Database setup complete!
```

**Step 4: Verify database tables**

Run: `mysql -u root ohiobrewpath -e "SHOW TABLES;"`

Expected:
```
+-------------------------+
| Tables_in_ohiobrewpath  |
+-------------------------+
| analytics               |
| breweries               |
| regions                 |
+-------------------------+
```

**Step 5: Verify brewery data loaded**

Run: `mysql -u root ohiobrewpath -e "SELECT COUNT(*) as total FROM breweries;"`

Expected:
```
+-------+
| total |
+-------+
|   351 |
+-------+
```

**Step 6: Test database connection in PHP**

Create temporary test file: `/Users/billburkey/CascadeProjects/ohiobrewpath/test-db.php`

```php
<?php
require_once 'includes/config.php';
require_once 'includes/db.php';

try {
    $db = getDB();
    $stmt = $db->query("SELECT COUNT(*) as count FROM breweries");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Database connection successful!\n";
    echo "Breweries in database: " . $result['count'] . "\n";
} catch (Exception $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}
```

**Step 7: Run database connection test**

Run: `php /Users/billburkey/CascadeProjects/ohiobrewpath/test-db.php`

Expected:
```
Database connection successful!
Breweries in database: 351
```

**Step 8: Clean up test file**

Run: `rm /Users/billburkey/CascadeProjects/ohiobrewpath/test-db.php`

**Step 9: Commit database setup documentation**

Run:
```bash
git add setup-database.php
git commit -m "docs: verify database setup script

- Confirm database initialization works
- Verify 351 breweries imported
- Test database connection functionality"
```

---

## Task 4: Start Local Development Server

**Files:**
- None (PHP built-in server)
- Test: All main pages load correctly

**Step 1: Start PHP development server**

Run: `cd /Users/billburkey/CascadeProjects/ohiobrewpath && php -S localhost:8000`

Expected: Server starts on http://localhost:8000

**Step 2: Test homepage loads**

Open new terminal and run: `curl -s http://localhost:8000/ | head -20`

Expected: HTML output starting with `<!DOCTYPE html>`

**Step 3: Test API endpoints**

Run: `curl -s http://localhost:8000/api/breweries.php | head -50`

Expected: JSON output with brewery data

**Step 4: Test search endpoint**

Run: `curl -s "http://localhost:8000/api/search.php?q=columbus" | head -50`

Expected: JSON output with Columbus area breweries

**Step 5: Document development server usage**

Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/docs/DEVELOPMENT.md`

```markdown
# Development Guide

## Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Python 3.7+ (for data processing scripts)
- Google Maps API key

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/abandini/ohiobeerpath.git
   cd ohiobeerpath
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your settings:
   - Set your Google Maps API key
   - Configure database credentials

4. Install Python dependencies (for data scripts):
   ```bash
   pip install -r requirements.txt
   ```

5. Set up the database:
   ```bash
   php setup-database.php
   ```

## Running Locally

Start the PHP development server:

```bash
php -S localhost:8000
```

Visit http://localhost:8000 in your browser.

## Project Structure

```
ohiobrewpath/
├── index.php                    # Homepage
├── brewery.php                  # Individual brewery page
├── regions.php                  # Regional listings
├── breweries.php                # All breweries page
├── nearby.php                   # Find nearby breweries
├── itinerary.php                # Tour builder
├── api/                         # REST API endpoints
│   ├── breweries.php            # Get breweries
│   ├── search.php               # Search breweries
│   └── analytics.php            # Track analytics
├── includes/                    # Reusable components
│   ├── config.php               # Configuration
│   ├── db.php                   # Database utilities
│   └── [components]             # UI components
├── assets/                      # Static files
│   ├── js/                      # JavaScript files
│   ├── css/                     # Stylesheets
│   └── images/                  # Images
└── breweries.json               # Brewery data (351 breweries)
```

## API Endpoints

### GET /api/breweries.php
Get all breweries or filter by region.

Query parameters:
- `region` - Filter by region (central, northeast, etc.)

### GET /api/search.php
Search breweries by name, city, or ZIP code.

Query parameters:
- `q` - Search query

### POST /api/analytics.php
Track user interactions.

## Data Processing

Python scripts for maintaining brewery data:

- `update_breweries.py` - Update brewery information
- `geocode_breweries.py` - Geocode addresses
- `qa_brewery_data.py` - Data quality checks

## Testing

Run data quality checks:

```bash
python qa_brewery_data.py
```

## Google Maps API

The application requires a Google Maps API key with the following APIs enabled:
- Maps JavaScript API
- Geocoding API
- Directions API

Set your key in `.env`:
```
GOOGLE_MAPS_API_KEY=your_key_here
```
```

**Step 6: Commit development documentation**

Run:
```bash
git add docs/DEVELOPMENT.md
git commit -m "docs: add development guide

- Add setup instructions
- Document project structure
- List API endpoints
- Add local development instructions"
```

---

## Task 5: API Endpoint Testing

**Files:**
- Test: `/Users/billburkey/CascadeProjects/ohiobrewpath/api/breweries.php`
- Test: `/Users/billburkey/CascadeProjects/ohiobrewpath/api/search.php`
- Test: `/Users/billburkey/CascadeProjects/ohiobrewpath/api/analytics.php`

**Step 1: Test breweries API - Get all breweries**

Run: `curl -s http://localhost:8000/api/breweries.php | python3 -m json.tool | head -30`

Expected: JSON array with brewery objects, each containing name, address, coordinates, etc.

**Step 2: Test breweries API - Filter by region**

Run: `curl -s "http://localhost:8000/api/breweries.php?region=central" | python3 -m json.tool | head -30`

Expected: JSON array with only Central Ohio breweries

**Step 3: Test search API - Search by city**

Run: `curl -s "http://localhost:8000/api/search.php?q=Cleveland" | python3 -m json.tool | head -30`

Expected: JSON array with Cleveland area breweries

**Step 4: Test search API - Search by brewery name**

Run: `curl -s "http://localhost:8000/api/search.php?q=Great+Lakes" | python3 -m json.tool`

Expected: JSON array with Great Lakes Brewing Company

**Step 5: Test analytics API - POST request**

Run:
```bash
curl -X POST http://localhost:8000/api/analytics.php \
  -H "Content-Type: application/json" \
  -d '{"event": "brewery_view", "brewery_id": "test-123", "timestamp": "2025-11-23T10:00:00Z"}'
```

Expected: JSON response `{"success": true}`

**Step 6: Verify analytics recorded in database**

Run: `mysql -u root ohiobrewpath -e "SELECT * FROM analytics ORDER BY id DESC LIMIT 5;"`

Expected: Recent analytics events including the test event

**Step 7: Create API test script**

Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/test-api.sh`

```bash
#!/bin/bash

# API Testing Script for Ohio Beer Path

BASE_URL="http://localhost:8000"
FAIL_COUNT=0

echo "==================================="
echo "Ohio Beer Path - API Test Suite"
echo "==================================="
echo ""

# Test 1: Get all breweries
echo "Test 1: GET /api/breweries.php"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/test1.json "$BASE_URL/api/breweries.php")
if [ "$RESPONSE" -eq 200 ]; then
    COUNT=$(cat /tmp/test1.json | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
    echo "✓ PASS - Returned $COUNT breweries"
else
    echo "✗ FAIL - HTTP $RESPONSE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 2: Filter by region
echo "Test 2: GET /api/breweries.php?region=central"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/test2.json "$BASE_URL/api/breweries.php?region=central")
if [ "$RESPONSE" -eq 200 ]; then
    COUNT=$(cat /tmp/test2.json | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
    echo "✓ PASS - Returned $COUNT Central Ohio breweries"
else
    echo "✗ FAIL - HTTP $RESPONSE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 3: Search by city
echo "Test 3: GET /api/search.php?q=Cleveland"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/test3.json "$BASE_URL/api/search.php?q=Cleveland")
if [ "$RESPONSE" -eq 200 ]; then
    COUNT=$(cat /tmp/test3.json | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
    echo "✓ PASS - Found $COUNT results for Cleveland"
else
    echo "✗ FAIL - HTTP $RESPONSE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 4: Search by brewery name
echo "Test 4: GET /api/search.php?q=Great+Lakes"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/test4.json "$BASE_URL/api/search.php?q=Great+Lakes")
if [ "$RESPONSE" -eq 200 ]; then
    COUNT=$(cat /tmp/test4.json | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
    echo "✓ PASS - Found $COUNT results for 'Great Lakes'"
else
    echo "✗ FAIL - HTTP $RESPONSE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 5: Analytics POST
echo "Test 5: POST /api/analytics.php"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/test5.json \
  -X POST "$BASE_URL/api/analytics.php" \
  -H "Content-Type: application/json" \
  -d '{"event": "test_event", "brewery_id": "test-123"}')
if [ "$RESPONSE" -eq 200 ]; then
    SUCCESS=$(cat /tmp/test5.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))")
    if [ "$SUCCESS" = "True" ]; then
        echo "✓ PASS - Analytics event recorded"
    else
        echo "✗ FAIL - Success = false"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
else
    echo "✗ FAIL - HTTP $RESPONSE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Summary
echo "==================================="
if [ $FAIL_COUNT -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ $FAIL_COUNT test(s) failed"
    exit 1
fi
```

**Step 8: Make test script executable and run**

Run:
```bash
chmod +x /Users/billburkey/CascadeProjects/ohiobrewpath/test-api.sh
/Users/billburkey/CascadeProjects/ohiobrewpath/test-api.sh
```

Expected:
```
===================================
Ohio Beer Path - API Test Suite
===================================

Test 1: GET /api/breweries.php
✓ PASS - Returned 351 breweries

Test 2: GET /api/breweries.php?region=central
✓ PASS - Returned XX Central Ohio breweries

Test 3: GET /api/search.php?q=Cleveland
✓ PASS - Found XX results for Cleveland

Test 4: GET /api/search.php?q=Great+Lakes
✓ PASS - Found X results for 'Great Lakes'

Test 5: POST /api/analytics.php
✓ PASS - Analytics event recorded

===================================
✓ All tests passed!
```

**Step 9: Commit API testing script**

Run:
```bash
git add test-api.sh
git commit -m "test: add API endpoint test suite

- Add bash script to test all API endpoints
- Test breweries GET with and without filters
- Test search functionality
- Test analytics POST endpoint
- Verify HTTP status codes and responses"
```

---

## Task 6: PWA Service Worker Completion

**Files:**
- Review: `/Users/billburkey/CascadeProjects/ohiobrewpath/service-worker.js`
- Modify: Service worker cache configuration
- Test: Offline functionality

**Step 1: Review current service worker**

Run: `head -100 /Users/billburkey/CascadeProjects/ohiobrewpath/service-worker.js`

Expected: See service worker with cache configuration

**Step 2: Update service worker with complete cache list**

Modify: `/Users/billburkey/CascadeProjects/ohiobrewpath/service-worker.js`

Replace cache list with comprehensive version:

```javascript
const CACHE_NAME = 'ohio-beer-path-v1';
const urlsToCache = [
  '/',
  '/index.php',
  '/breweries.php',
  '/regions.php',
  '/nearby.php',
  '/itinerary.php',
  '/about.php',
  '/offline.html',
  '/assets/css/styles.css',
  '/assets/css/mobile.css',
  '/assets/js/main.js',
  '/assets/js/core.js',
  '/assets/js/map-loader.js',
  '/assets/js/breweries.js',
  '/assets/js/search.js',
  '/assets/js/itinerary.js',
  '/assets/js/pwa.js',
  '/breweries.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Network failed, return offline page
          return caches.match('/offline.html');
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

**Step 3: Verify PWA manifest is complete**

Run: `cat /Users/billburkey/CascadeProjects/ohiobrewpath/site.webmanifest`

Expected: See complete manifest with name, icons, theme colors

**Step 4: Update manifest if needed**

Modify: `/Users/billburkey/CascadeProjects/ohiobrewpath/site.webmanifest`

Ensure it contains:

```json
{
  "name": "Ohio Beer Path",
  "short_name": "OhioBeerPath",
  "description": "Discover Ohio's craft breweries and plan your brewery tour",
  "icons": [
    {
      "src": "/assets/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#d97706",
  "background_color": "#ffffff",
  "orientation": "portrait-primary"
}
```

**Step 5: Test service worker registration in browser**

Open browser to http://localhost:8000 and run in DevTools console:

```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations.length);
  registrations.forEach(reg => console.log('SW Scope:', reg.scope));
});
```

Expected: See service worker registered for http://localhost:8000/

**Step 6: Test offline functionality**

In browser DevTools:
1. Go to Application > Service Workers
2. Check "Offline" checkbox
3. Navigate to http://localhost:8000/breweries.php

Expected: Page loads from cache or shows offline.html

**Step 7: Commit PWA improvements**

Run:
```bash
git add service-worker.js site.webmanifest
git commit -m "feat: complete PWA functionality

- Update service worker with comprehensive cache list
- Add proper offline fallback handling
- Verify manifest configuration
- Test offline mode functionality"
```

---

## Task 7: Frontend Testing & Polish

**Files:**
- Test: All JavaScript files load without errors
- Test: Google Maps integration works
- Test: Search functionality works
- Test: Itinerary builder works

**Step 1: Check browser console for errors**

Open http://localhost:8000 in browser and check DevTools Console

Expected: No JavaScript errors

**Step 2: Test Google Maps loading**

Navigate to http://localhost:8000/ and verify map appears

Expected: Interactive Google Maps with brewery markers

**Step 3: Test search functionality**

1. Type "Cleveland" in search box
2. Click search or press Enter

Expected: Results show Cleveland area breweries

**Step 4: Test itinerary builder**

1. Navigate to http://localhost:8000/itinerary.php
2. Click "Add to Itinerary" on a brewery
3. Verify brewery appears in itinerary list
4. Drag to reorder
5. Click "Get Directions"

Expected:
- Brewery added to list
- Drag-and-drop reordering works
- Directions link opens Google Maps

**Step 5: Test regional filtering**

Navigate to http://localhost:8000/regions.php?region=central

Expected: Only Central Ohio breweries displayed

**Step 6: Test nearby breweries**

Navigate to http://localhost:8000/nearby.php and allow location access

Expected: Breweries sorted by distance from current location

**Step 7: Test mobile responsive design**

In browser DevTools, toggle device toolbar (mobile view)

Expected:
- Layout adapts to mobile screen
- Bottom navigation appears
- Touch-friendly buttons

**Step 8: Create frontend test checklist**

Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/docs/TESTING.md`

```markdown
# Testing Checklist

## Browser Compatibility

Test in the following browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Core Functionality

### Homepage (`index.php`)
- [ ] Page loads without errors
- [ ] Google Maps displays with brewery markers
- [ ] Clicking marker opens brewery info window
- [ ] Search box accepts input
- [ ] Regional navigation links work

### Brewery Listings (`breweries.php`)
- [ ] All breweries display in cards
- [ ] Brewery cards show: name, address, hours, amenities
- [ ] "View Details" button links to brewery page
- [ ] Filters work (region, amenities)

### Regional View (`regions.php`)
- [ ] Region parameter filters correctly
- [ ] Map centers on region
- [ ] Only breweries in selected region shown

### Search (`search.php` via search box)
- [ ] Search by brewery name works
- [ ] Search by city works
- [ ] Search by ZIP code works
- [ ] Results display correctly
- [ ] "No results" message shows when appropriate

### Nearby Breweries (`nearby.php`)
- [ ] Location permission prompt appears
- [ ] Breweries sorted by distance
- [ ] Distance displayed for each brewery
- [ ] Map shows user location + breweries

### Itinerary Builder (`itinerary.php`)
- [ ] "Add to Itinerary" button adds brewery
- [ ] Itinerary list displays added breweries
- [ ] Drag-and-drop reordering works
- [ ] "Remove" button removes brewery
- [ ] "Get Directions" opens route in Google Maps
- [ ] Itinerary persists in localStorage
- [ ] "Clear All" clears itinerary

### Individual Brewery (`brewery.php`, `view-brewery.php`)
- [ ] Brewery details load correctly
- [ ] Map shows brewery location
- [ ] Hours formatted properly
- [ ] Amenities displayed
- [ ] Phone number clickable (mobile)
- [ ] Website link works
- [ ] "Add to Itinerary" button works

## API Endpoints

- [ ] GET /api/breweries.php returns all breweries
- [ ] GET /api/breweries.php?region=central filters by region
- [ ] GET /api/search.php?q=term searches correctly
- [ ] POST /api/analytics.php records events

## PWA Features

- [ ] Service worker registers successfully
- [ ] Offline page loads when no connection
- [ ] Cached pages load offline
- [ ] "Add to Home Screen" prompt appears (mobile)
- [ ] Installed app opens in standalone mode

## Performance

- [ ] Initial page load < 3 seconds
- [ ] Lighthouse score > 80 (Performance)
- [ ] Images lazy load
- [ ] Maps load asynchronously

## SEO

- [ ] Meta tags present on all pages
- [ ] Open Graph tags for social sharing
- [ ] robots.txt accessible
- [ ] sitemap.xml accessible and valid
- [ ] Page titles descriptive and unique

## Accessibility

- [ ] Keyboard navigation works
- [ ] Images have alt text
- [ ] Color contrast sufficient
- [ ] Form labels present
- [ ] ARIA labels where appropriate

## Mobile

- [ ] Touch targets > 44px
- [ ] Bottom navigation works
- [ ] Swipe gestures work (where applicable)
- [ ] No horizontal scroll
- [ ] Viewport meta tag set correctly
```

**Step 9: Commit testing documentation**

Run:
```bash
git add docs/TESTING.md
git commit -m "docs: add comprehensive testing checklist

- Add browser compatibility checklist
- Document core functionality tests
- Add API endpoint verification
- Include PWA feature testing
- Add performance and SEO checks
- Document accessibility requirements"
```

---

## Task 8: Production Deployment Preparation

**Files:**
- Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/docs/DEPLOYMENT.md`
- Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/.htaccess` (for Apache)
- Review: Security configurations

**Step 1: Create .htaccess for production**

Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/.htaccess`

```apache
# Ohio Beer Path - Production Configuration

# Enable Rewrite Engine
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Remove www
RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

# Remove .php extension
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}\.php -f
RewriteRule ^(.*)$ $1.php [L]

# Custom Error Pages
ErrorDocument 404 /404.html
ErrorDocument 500 /500.html

# Security Headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "strict-origin-when-cross-origin"

# Cache Control
<filesMatch "\.(ico|jpg|jpeg|png|gif|webp)$">
  Header set Cache-Control "max-age=2592000, public"
</filesMatch>

<filesMatch "\.(css|js)$">
  Header set Cache-Control "max-age=604800, public"
</filesMatch>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Disable Directory Browsing
Options -Indexes

# Protect sensitive files
<FilesMatch "\.(env|git|gitignore|md|log|bak)$">
  Order allow,deny
  Deny from all
</FilesMatch>
```

**Step 2: Create 404 error page**

Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/404.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found | Ohio Beer Path</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
    <div class="container text-center py-5">
        <h1 class="display-1">404</h1>
        <h2>Page Not Found</h2>
        <p class="lead">Sorry, the brewery you're looking for seems to be on a different path.</p>
        <a href="/" class="btn btn-primary btn-lg mt-3">Back to Home</a>
    </div>
</body>
</html>
```

**Step 3: Create deployment documentation**

Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/docs/DEPLOYMENT.md`

```markdown
# Deployment Guide

## Prerequisites

- Web server with PHP 7.4+ (Apache or Nginx)
- MySQL 5.7+ database
- SSL certificate (Let's Encrypt recommended)
- Google Maps API key with production restrictions

## Pre-Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Set `APP_ENV=production` and `DEBUG=false`
- [ ] Configure production database credentials
- [ ] Add production Google Maps API key
- [ ] Review and restrict API key to production domain
- [ ] Set correct `SITE_URL` in `.env`
- [ ] Verify all sensitive data in `.gitignore`
- [ ] Run security audit on codebase
- [ ] Test all API endpoints
- [ ] Run data quality checks
- [ ] Backup database before deployment

## Deployment Steps

### 1. Server Setup

```bash
# SSH into production server
ssh user@yourdomain.com

# Navigate to web root
cd /var/www/html

# Clone repository
git clone https://github.com/abandini/ohiobeerpath.git
cd ohiobeerpath
```

### 2. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Edit with production values
nano .env
```

Update these values:
```
DB_HOST=localhost
DB_NAME=ohiobrewpath_prod
DB_USER=your_db_user
DB_PASS=your_secure_password
GOOGLE_MAPS_API_KEY=your_production_api_key
SITE_URL=https://ohiobeerpath.com
APP_ENV=production
DEBUG=false
```

### 3. Database Setup

```bash
# Create production database
mysql -u root -p -e "CREATE DATABASE ohiobrewpath_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create database user
mysql -u root -p -e "CREATE USER 'ohiobeer_user'@'localhost' IDENTIFIED BY 'secure_password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON ohiobrewpath_prod.* TO 'ohiobeer_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

# Run database setup
php setup-database.php
```

### 4. File Permissions

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/html/ohiobeerpath

# Set directory permissions
find /var/www/html/ohiobeerpath -type d -exec chmod 755 {} \;

# Set file permissions
find /var/www/html/ohiobeerpath -type f -exec chmod 644 {} \;

# Protect .env file
chmod 600 .env
```

### 5. Apache Configuration

Create: `/etc/apache2/sites-available/ohiobeerpath.conf`

```apache
<VirtualHost *:80>
    ServerName ohiobeerpath.com
    ServerAlias www.ohiobeerpath.com
    DocumentRoot /var/www/html/ohiobeerpath

    <Directory /var/www/html/ohiobeerpath>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/ohiobeerpath_error.log
    CustomLog ${APACHE_LOG_DIR}/ohiobeerpath_access.log combined
</VirtualHost>
```

Enable site:
```bash
sudo a2ensite ohiobeerpath.conf
sudo a2enmod rewrite headers deflate
sudo systemctl restart apache2
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-apache

# Get certificate
sudo certbot --apache -d ohiobeerpath.com -d www.ohiobeerpath.com

# Auto-renewal is configured automatically
```

### 7. Verify Deployment

```bash
# Test PHP syntax
php -l index.php

# Test database connection
php -r "require 'includes/config.php'; require 'includes/db.php'; \$db = getDB(); echo 'DB OK';"

# Test API endpoints
curl https://ohiobeerpath.com/api/breweries.php
curl https://ohiobeerpath.com/api/search.php?q=columbus
```

## Post-Deployment

### DNS Configuration

Point domain to server IP:
- A Record: `@` → `your_server_ip`
- A Record: `www` → `your_server_ip`

### Google Maps API Key Restrictions

In Google Cloud Console:
1. Application restrictions: HTTP referrers
2. Add: `https://ohiobeerpath.com/*`
3. API restrictions: Enable only required APIs
   - Maps JavaScript API
   - Geocoding API
   - Directions API

### Monitoring

Set up monitoring for:
- Uptime monitoring
- SSL certificate expiration
- Database backups
- Error logs
- Analytics tracking

### Backups

Configure automated backups:

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u ohiobeer_user -p ohiobrewpath_prod > /backups/db_$DATE.sql
gzip /backups/db_$DATE.sql

# Keep last 30 days
find /backups -name "db_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```
0 2 * * * /usr/local/bin/backup-db.sh
```

## Troubleshooting

### Issue: "Database connection failed"
- Check database credentials in `.env`
- Verify MySQL service is running: `sudo systemctl status mysql`
- Check database user permissions

### Issue: "Google Maps not loading"
- Verify API key in `.env`
- Check API key restrictions in Google Cloud Console
- Check browser console for error messages

### Issue: "500 Internal Server Error"
- Check error logs: `tail -f /var/log/apache2/ohiobeerpath_error.log`
- Verify file permissions
- Check PHP error logs

### Issue: "Images not loading"
- Verify file permissions on `/assets/images/`
- Check `.htaccess` configuration
- Verify correct paths in HTML/PHP files

## Rollback Plan

```bash
# If deployment fails, rollback to previous version
cd /var/www/html/ohiobeerpath
git log --oneline -10  # Find previous commit
git reset --hard <previous-commit-hash>
sudo systemctl restart apache2
```

## Performance Optimization

### Enable OPcache (PHP)

Edit `/etc/php/7.4/apache2/php.ini`:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
```

### MySQL Optimization

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
innodb_buffer_pool_size = 256M
query_cache_type = 1
query_cache_size = 32M
```

### Content Delivery Network (CDN)

Consider using Cloudflare for:
- DDoS protection
- Global CDN
- SSL/TLS
- Caching
- Analytics

## Security Hardening

- [ ] Change default database port
- [ ] Implement rate limiting
- [ ] Configure fail2ban
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Review and audit access logs weekly
- [ ] Implement CSP (Content Security Policy) headers
- [ ] Enable MySQL audit logging
- [ ] Regular penetration testing

## Updates & Maintenance

```bash
# Pull latest changes
cd /var/www/html/ohiobeerpath
git pull origin main

# Run any database migrations (if needed)
php migrations/run.php

# Clear any application cache
php clear-cache.php

# Restart services
sudo systemctl restart apache2
```
```

**Step 4: Run final security check**

Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/security-check.sh`

```bash
#!/bin/bash

echo "==================================="
echo "Security Check for Ohio Beer Path"
echo "==================================="
echo ""

ISSUES=0

# Check 1: .env file not in git
echo "Check 1: Verifying .env is not tracked by git..."
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "✗ FAIL - .env file is tracked by git"
    ISSUES=$((ISSUES + 1))
else
    echo "✓ PASS - .env file not tracked"
fi
echo ""

# Check 2: .gitignore includes sensitive files
echo "Check 2: Verifying .gitignore includes sensitive files..."
if grep -q "\.env" .gitignore && grep -q "config\.local\.php" .gitignore; then
    echo "✓ PASS - .gitignore properly configured"
else
    echo "✗ FAIL - .gitignore missing sensitive file patterns"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check 3: No hardcoded credentials in PHP files
echo "Check 3: Checking for hardcoded credentials..."
HARDCODED=$(grep -r "password.*=.*['\"]" --include="*.php" . | grep -v "getenv\|ENV\|\$_ENV" | wc -l)
if [ "$HARDCODED" -eq 0 ]; then
    echo "✓ PASS - No hardcoded credentials found"
else
    echo "✗ WARNING - Found $HARDCODED potential hardcoded credentials"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check 4: Database file permissions (if .env exists)
if [ -f .env ]; then
    echo "Check 4: Checking .env file permissions..."
    PERMS=$(stat -f "%A" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
    if [ "$PERMS" = "600" ] || [ "$PERMS" = "400" ]; then
        echo "✓ PASS - .env permissions are restrictive ($PERMS)"
    else
        echo "✗ WARNING - .env permissions are $PERMS (should be 600 or 400)"
        ISSUES=$((ISSUES + 1))
    fi
    echo ""
fi

# Check 5: No debug output in production code
echo "Check 5: Checking for debug statements..."
DEBUG=$(grep -r "var_dump\|print_r\|var_export" --include="*.php" . | grep -v "^#" | wc -l)
if [ "$DEBUG" -eq 0 ]; then
    echo "✓ PASS - No debug statements found"
else
    echo "✗ WARNING - Found $DEBUG debug statements"
    echo "  (Review and remove before production deployment)"
fi
echo ""

# Summary
echo "==================================="
if [ $ISSUES -eq 0 ]; then
    echo "✓ Security check passed!"
    exit 0
else
    echo "✗ Found $ISSUES security issues"
    echo "  Please review and fix before deployment"
    exit 1
fi
```

**Step 5: Run security check**

Run:
```bash
chmod +x /Users/billburkey/CascadeProjects/ohiobrewpath/security-check.sh
/Users/billburkey/CascadeProjects/ohiobrewpath/security-check.sh
```

Expected: All checks pass or only minor warnings

**Step 6: Commit production files**

Run:
```bash
git add .htaccess 404.html docs/DEPLOYMENT.md security-check.sh
git commit -m "feat: add production deployment configuration

- Add .htaccess with security headers and URL rewriting
- Add 404 error page
- Add comprehensive deployment documentation
- Add security check script
- Document server setup, SSL, and monitoring"
```

---

## Task 9: Final Documentation & README

**Files:**
- Update: `/Users/billburkey/CascadeProjects/ohiobrewpath/README.md`
- Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/CONTRIBUTING.md`
- Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/LICENSE`

**Step 1: Update README with comprehensive project information**

Modify: `/Users/billburkey/CascadeProjects/ohiobrewpath/README.md`

Replace with:

```markdown
# Ohio Beer Path 🍺

Discover Ohio's craft breweries and plan your perfect brewery tour.

**Live Site:** [ohiobeerpath.com](https://ohiobeerpath.com) *(pending deployment)*

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

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **Backend:** PHP 7.4+, MySQL 5.7+
- **APIs:** Google Maps API (Maps, Geocoding, Directions)
- **PWA:** Service Worker, Web App Manifest
- **Data Processing:** Python 3.7+

## Getting Started

### Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Google Maps API key
- Python 3.7+ (optional, for data processing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/abandini/ohiobeerpath.git
   cd ohiobeerpath
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Google Maps API key:
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

3. Set up the database:
   ```bash
   php setup-database.php
   ```

4. Start the development server:
   ```bash
   php -S localhost:8000
   ```

5. Open http://localhost:8000 in your browser

## Documentation

- [Development Guide](docs/DEVELOPMENT.md) - Local development setup
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Testing Guide](docs/TESTING.md) - QA checklist
- [Contributing](CONTRIBUTING.md) - How to contribute

## Project Structure

```
ohiobeerpath/
├── index.php                # Homepage
├── breweries.php            # All breweries listing
├── regions.php              # Regional brewery view
├── nearby.php               # Find nearby breweries
├── itinerary.php            # Brewery tour builder
├── api/                     # REST API endpoints
├── includes/                # Reusable PHP components
├── assets/                  # Static files (CSS, JS, images)
├── breweries.json           # Brewery database (351 breweries)
└── docs/                    # Documentation
```

## API Endpoints

### GET /api/breweries.php
Get all breweries or filter by region.
```bash
curl "http://localhost:8000/api/breweries.php?region=central"
```

### GET /api/search.php
Search breweries by name, city, or ZIP code.
```bash
curl "http://localhost:8000/api/search.php?q=Cleveland"
```

### POST /api/analytics.php
Track user interactions (for analytics).

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

- [ ] User accounts and saved itineraries
- [ ] Brewery reviews and ratings
- [ ] Events calendar
- [ ] Beer style filtering
- [ ] Brewery check-ins
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
```

**Step 2: Create CONTRIBUTING.md**

Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/CONTRIBUTING.md`

```markdown
# Contributing to Ohio Beer Path

Thank you for your interest in contributing to Ohio Beer Path! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/abandini/ohiobeerpath/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Browser/device information

### Suggesting Features

1. Check [Issues](https://github.com/abandini/ohiobeerpath/issues) for existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Any implementation ideas

### Updating Brewery Data

To add, update, or correct brewery information:

1. Fork the repository
2. Update `breweries.json` with accurate information
3. Run data quality check: `python qa_brewery_data.py`
4. Submit a pull request with a clear description of changes

### Code Contributions

#### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ohiobeerpath.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Set up your local environment (see [DEVELOPMENT.md](docs/DEVELOPMENT.md))

#### Coding Standards

**PHP:**
- Follow PSR-12 coding standard
- Use meaningful variable and function names
- Add comments for complex logic
- Sanitize all user inputs
- Use prepared statements for database queries

**JavaScript:**
- Use ES6+ syntax
- Use `const` and `let` (avoid `var`)
- Add JSDoc comments for functions
- Handle errors gracefully
- Use meaningful variable names

**CSS:**
- Follow BEM methodology
- Mobile-first approach
- Comment complex selectors
- Group related styles

#### Testing

Before submitting:
- Test all functionality manually
- Run API tests: `./test-api.sh`
- Test on mobile devices
- Check browser console for errors
- Verify no PHP errors: `php -l yourfile.php`

#### Commit Messages

Use conventional commit format:
```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Example:
```
feat(search): add ZIP code search functionality

- Add ZIP code pattern matching
- Update search API to handle ZIP codes
- Add tests for ZIP code search

Closes #123
```

#### Pull Request Process

1. Update documentation if needed
2. Add your changes to the PR description
3. Link related issues
4. Ensure all tests pass
5. Request review from maintainers

### Data Quality

When updating brewery data:

- **Accuracy:** Verify all information is current
- **Completeness:** Include all required fields
- **Consistency:** Follow existing data format
- **Sources:** Cite sources when possible

Required fields:
- `name` - Official brewery name
- `address` - Street address
- `city` - City name
- `state` - "Ohio"
- `zip` - ZIP code
- `lat` - Latitude (decimal degrees)
- `lng` - Longitude (decimal degrees)
- `region` - Ohio region classification

Optional fields:
- `phone` - Phone number
- `website` - Official website URL
- `hours` - Business hours
- `amenities` - Array of amenities

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy toward others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information

## Questions?

Feel free to open an issue with the "question" label or contact the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Ohio Beer Path! 🍺
```

**Step 3: Create LICENSE file**

Create: `/Users/billburkey/CascadeProjects/ohiobrewpath/LICENSE`

```
MIT License

Copyright (c) 2025 Ohio Beer Path

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Step 4: Commit final documentation**

Run:
```bash
git add README.md CONTRIBUTING.md LICENSE
git commit -m "docs: add comprehensive project documentation

- Update README with complete project overview
- Add contributing guidelines
- Add MIT License
- Document features, tech stack, and API
- Add installation and development instructions"
```

---

## Task 10: Final Verification & Git Push

**Files:**
- Review: All commits
- Test: Complete application functionality
- Push: All changes to GitHub

**Step 1: Review all commits**

Run: `git log --oneline --graph --all -20`

Expected: See all commits from this implementation plan

**Step 2: Run complete test suite**

Run:
```bash
cd /Users/billburkey/CascadeProjects/ohiobrewpath
./test-api.sh
./security-check.sh
```

Expected: All tests pass

**Step 3: Verify all pages load**

Test each page:
```bash
curl -I http://localhost:8000/ | head -1
curl -I http://localhost:8000/breweries.php | head -1
curl -I http://localhost:8000/regions.php | head -1
curl -I http://localhost:8000/nearby.php | head -1
curl -I http://localhost:8000/itinerary.php | head -1
```

Expected: All return `HTTP/1.1 200 OK`

**Step 4: Check git status**

Run: `git status`

Expected:
```
On branch main
Your branch is ahead of 'origin/main' by X commits.
  (use "git push" to publish your local commits)

nothing to commit, working tree clean
```

**Step 5: Push to GitHub**

Run: `git push origin main`

Expected: All commits successfully pushed

**Step 6: Verify GitHub repository**

Visit: https://github.com/abandini/ohiobeerpath

Expected: See all files and updated README displayed

**Step 7: Create deployment tag**

Run:
```bash
git tag -a v1.0.0 -m "Release v1.0.0 - Complete Ohio Beer Path application

- 351 Ohio breweries database
- Interactive Google Maps integration
- Search and filtering functionality
- Itinerary builder for brewery tours
- PWA support with offline functionality
- RESTful API endpoints
- Mobile responsive design
- Complete documentation"

git push origin v1.0.0
```

Expected: Tag created and pushed to GitHub

**Step 8: Create GitHub Release**

1. Go to https://github.com/abandini/ohiobeerpath/releases
2. Click "Create a new release"
3. Select tag: v1.0.0
4. Title: "Ohio Beer Path v1.0.0 - Initial Release"
5. Description:

```markdown
# Ohio Beer Path v1.0.0

🎉 Initial release of Ohio Beer Path - Your guide to Ohio's craft breweries!

## Features

- **351 Ohio Breweries** - Complete database with addresses, hours, and amenities
- **Interactive Maps** - Google Maps with brewery markers and directions
- **Search & Filter** - Find breweries by name, city, ZIP, or region
- **Itinerary Builder** - Plan custom brewery tours with drag-and-drop
- **Nearby Search** - Find breweries near your current location
- **PWA Support** - Install as mobile app, works offline
- **Mobile Optimized** - Responsive design for all devices

## Installation

See [README.md](https://github.com/abandini/ohiobeerpath/blob/main/README.md) for installation instructions.

## Documentation

- [Development Guide](docs/DEVELOPMENT.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Testing Guide](docs/TESTING.md)
- [Contributing](CONTRIBUTING.md)

## What's Included

- Complete PHP application
- RESTful API endpoints
- Frontend JavaScript & CSS
- 351 brewery dataset (JSON)
- Data processing scripts
- Comprehensive documentation

## Next Steps

Ready for production deployment! See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment instructions.

**Drink responsibly!** 🍺
```

6. Click "Publish release"

---

## Completion Checklist

**Project Setup:**
- [x] Git repository cleaned up and all files committed
- [x] Environment configuration with .env support
- [x] Database setup and data imported
- [x] Local development server tested

**Core Functionality:**
- [x] API endpoints tested and working
- [x] Frontend JavaScript error-free
- [x] Google Maps integration working
- [x] Search functionality operational
- [x] Itinerary builder functional
- [x] PWA features implemented

**Documentation:**
- [x] README.md comprehensive and clear
- [x] DEVELOPMENT.md with setup instructions
- [x] DEPLOYMENT.md with production steps
- [x] TESTING.md with QA checklist
- [x] CONTRIBUTING.md with guidelines
- [x] LICENSE file added

**Quality Assurance:**
- [x] API test suite passing
- [x] Security check passing
- [x] All pages load without errors
- [x] Mobile responsive design verified

**Deployment Preparation:**
- [x] Production .htaccess configured
- [x] Security headers implemented
- [x] Error pages created
- [x] Deployment documentation complete

**Version Control:**
- [x] All changes committed with clear messages
- [x] Code pushed to GitHub
- [x] Release tag created (v1.0.0)
- [x] GitHub Release published

---

## Next Steps After Completion

1. **Get Google Maps API Key** (if not already have one)
   - Go to Google Cloud Console
   - Enable Maps JavaScript API, Geocoding API, Directions API
   - Create API key with proper restrictions

2. **Acquire Domain** (if not already owned)
   - Register ohiobeerpath.com or ohiobeerpath.org
   - Configure DNS settings

3. **Set Up Hosting**
   - Choose hosting provider (DigitalOcean, AWS, shared hosting, etc.)
   - Follow deployment guide in docs/DEPLOYMENT.md

4. **Deploy to Production**
   - Follow all steps in docs/DEPLOYMENT.md
   - Run all tests in production environment
   - Set up SSL certificate
   - Configure backups

5. **Marketing & Launch**
   - Submit to Ohio brewery directories
   - Social media announcement
   - Local brewery partnerships
   - SEO optimization

6. **Monitor & Maintain**
   - Set up uptime monitoring
   - Review analytics
   - Update brewery data regularly
   - Respond to user feedback

---

**Total Estimated Time:** 8-10 hours for complete implementation
**Skill Level Required:** Intermediate (PHP, JavaScript, MySQL, Git)
**Dependencies:** PHP 7.4+, MySQL 5.7+, Google Maps API key
