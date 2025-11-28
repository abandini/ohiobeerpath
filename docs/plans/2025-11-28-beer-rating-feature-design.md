# Beer Rating Feature Design

**Created:** 2025-11-28
**Status:** Approved

## Overview

A beer rating system integrated into the BreweryTrip itinerary experience. Users rate beers while visiting breweries on their trip, building a personal beer journal with photos and ratings. Ratings can be shared to Untappd, RateBeer, and social platforms with backlinks to BreweryTrip.

### Goals

1. Transform BreweryTrip from a planning tool into an engagement platform
2. Generate organic backlinks through social sharing
3. Build user-generated content that enriches brewery pages

## Core Flow

```
User on Active Itinerary
        ↓
    At a Brewery
        ↓
  Tap "Rate a Beer"
        ↓
┌─────────────────────────┐
│ • Snap/upload photo     │
│ • Enter beer name       │
│ • Select style (opt)    │
│ • Star rating (1-5)     │
│ • Tasting notes (opt)   │
└─────────────────────────┘
        ↓
    Save to BreweryTrip
        ↓
  "Share to Untappd" / "Share to RateBeer"
        ↓
  Opens share card with QR + backlink
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Authentication | Untappd OAuth | Solves auth + enables integration |
| Brewery check-in | Implicit (first rating creates visit) | Minimal friction |
| Required fields | Beer name + stars only | Fast to complete |
| Photo mode | Single (with retake) or multiple (user toggle) | User choice |
| Beer styles | Simplified ~30 default, comprehensive ~150 optional | User preference |
| External sharing | Share card (launch), API partnerships (pursue) | Don't block on approval |
| User history | Feed + stats | Engagement + gamification |
| Privacy | Ask on first rating | Transparent consent |

## Data Model

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  untappd_id TEXT UNIQUE,
  untappd_username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  privacy_default TEXT DEFAULT 'ask',
  style_preference TEXT DEFAULT 'simple',
  photo_mode TEXT DEFAULT 'single',
  created_at TEXT,
  last_login TEXT
);
```

### Brewery Visits Table

```sql
CREATE TABLE brewery_visits (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  brewery_id INTEGER REFERENCES breweries(id),
  itinerary_id TEXT,
  visited_at TEXT,
  created_at TEXT
);
```

### Beer Ratings Table

```sql
CREATE TABLE beer_ratings (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  visit_id TEXT REFERENCES brewery_visits(id),
  brewery_id INTEGER REFERENCES breweries(id),
  beer_name TEXT NOT NULL,
  beer_style TEXT,
  stars INTEGER NOT NULL,
  notes TEXT,
  abv REAL,
  is_public INTEGER DEFAULT 0,
  shared_to TEXT,
  created_at TEXT
);
```

### Rating Photos Table

```sql
CREATE TABLE rating_photos (
  id TEXT PRIMARY KEY,
  rating_id TEXT REFERENCES beer_ratings(id),
  photo_url TEXT,
  photo_url_original TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT
);
```

### Indexes

```sql
CREATE INDEX idx_ratings_user ON beer_ratings(user_id);
CREATE INDEX idx_ratings_brewery ON beer_ratings(brewery_id);
CREATE INDEX idx_ratings_public ON beer_ratings(is_public, created_at);
CREATE INDEX idx_visits_user ON brewery_visits(user_id);
```

## UI/UX Design

### Design Principles

- **Mobile-first** - Users are at the bar, phone in hand
- **One-thumb friendly** - Big tap targets, bottom-aligned actions
- **Camera-forward** - Photo is the hero moment
- **Minimal typing** - Smart defaults, autocomplete, dropdowns
- **Celebratory** - Satisfying animations on save/share

### Rating Flow

**Step 1: Camera Launch**
- Full-screen camera with frosted glass overlay
- Big circular capture button with pulse animation
- "Skip photo" link for quick ratings
- Toggle: Single | Multiple photos

**Step 2: Rate the Beer**
- Photo thumbnail with retake option
- Beer name input with autocomplete
- Style dropdown (optional)
- Large star rating (easy to tap)
- Labels under stars (Meh, OK, Amazing)
- Haptic feedback on selection

**Step 3: Celebration + Share**
- Confetti/particle animation on save
- Card preview of what was saved
- Share buttons: Untappd, RateBeer, Stories, More
- "More" opens full share sheet

### Share Card Design

Generated image for sharing:
- User's photo as hero
- Beer name and star rating
- Style and ABV
- Brewery name and location
- Tasting notes (if provided)
- QR code linking to BreweryTrip
- Branded footer with logo

## API Endpoints

### Authentication

```
GET  /api/auth/untappd          → Redirect to Untappd OAuth
GET  /api/auth/untappd/callback → Handle OAuth callback
POST /api/auth/logout           → Clear session
GET  /api/auth/me               → Get current user
```

### Ratings

```
POST   /api/ratings             → Create new rating
GET    /api/ratings             → List user's ratings
GET    /api/ratings/:id         → Get single rating
PUT    /api/ratings/:id         → Update rating
DELETE /api/ratings/:id         → Delete rating
```

### Photos

```
POST   /api/ratings/:id/photos  → Upload photo(s)
DELETE /api/photos/:id          → Delete a photo
```

### Brewery Ratings (Public)

```
GET    /api/breweries/:id/ratings → Recent public ratings
GET    /api/breweries/:id/popular → Popular beers
```

### User Profile

```
GET    /api/users/:id/stats     → User stats
PUT    /api/users/me/settings   → Update preferences
```

### Share

```
GET    /api/share/:ratingId     → Generate share card image
GET    /api/share/:ratingId/qr  → Generate QR code
```

## Technical Architecture

### Photo Upload Flow

1. Client compresses to ~2MB max
2. POST to /api/ratings/:id/photos
3. Worker receives file
4. Workers Image Resizing API processes:
   - Original → R2 (full-res backup)
   - 1200px → R2 (display size)
   - 400px → R2 (thumbnail)
   - Convert to WebP
5. Store URLs in rating_photos table
6. Return URLs to client

### Session Management

Using Cloudflare KV:
- Key: `session:{sessionId}`
- Value: `{ userId, untappdId, untappdToken, expiresAt }`
- TTL: 30 days
- Cookie: `bt_session={sessionId}` (HttpOnly, Secure, SameSite=Lax)

### Rate Limiting

Using KV with sliding window:
- Photo uploads: 20/hour per user
- Rating creation: 50/day per user
- Share card generation: 100/hour per IP

## Implementation Phases

### Phase 1: Foundation
- Database migrations
- Untappd OAuth integration
- Session management
- User settings page

### Phase 2: Core Rating
- Photo upload to R2 with resizing
- Rating creation API & UI
- Implicit brewery visit tracking
- Beer style dropdown

### Phase 3: History & Stats
- User rating feed
- Stats dashboard
- Brewery page: "Recent check-ins"
- "Popular beers" at each brewery

### Phase 4: Sharing
- Share card image generation
- QR code generation
- Deep links for Untappd/RateBeer
- Social share sheet

### Phase 5: Polish & Launch
- Celebration animations
- Haptic feedback
- Offline support
- Apply for API partnerships

## File Structure

```
src/
├── routes/
│   ├── auth.ts          # OAuth routes
│   └── ratings.ts       # Rating CRUD API
├── db/
│   ├── users.ts         # User queries
│   ├── ratings.ts       # Rating queries
│   └── visits.ts        # Visit queries
├── templates/
│   ├── rating-form.ts   # Rating UI
│   ├── rating-feed.ts   # History feed
│   ├── user-stats.ts    # Stats dashboard
│   └── share-card.ts    # Share image template
├── services/
│   ├── untappd.ts       # Untappd OAuth client
│   ├── image.ts         # Photo processing
│   └── share.ts         # Share card generation
└── middleware/
    └── auth.ts          # Session validation

migrations/
├── 0004_create_users.sql
├── 0005_create_visits.sql
├── 0006_create_ratings.sql
└── 0007_create_photos.sql
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Ratings per active user | 3+/month |
| Photo attachment rate | 60%+ |
| Share-to-external rate | 25%+ |
| Backlink clicks from shares | Track via UTM |
