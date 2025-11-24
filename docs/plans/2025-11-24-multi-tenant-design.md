# Multi-Tenant BeerPath Design Document

**Date:** 2025-11-24
**Project:** Ohio Beer Path → Multi-Tenant BeerPath Platform
**Goal:** Transform single-state Ohio app into scalable multi-tenant brewery discovery platform

---

## Executive Summary

This design transforms Ohio Beer Path into a multi-tenant platform capable of serving multiple states/regions with distinct branding while maintaining a unified codebase. The approach balances immediate visual improvements with long-term architectural scalability.

**Key Decisions:**
- **Routing:** Path-based (`/ohio`, `/pennsylvania`) not subdomains
- **Database:** Single shared database with state filtering
- **Theming:** CSS custom properties loaded from database per state
- **Deployment:** Incremental phases, ship improvements as we build
- **Design:** Modern, mobile-first with authentic craft beer aesthetic

---

## Section 1: Architecture & Multi-Tenant Foundation

### URL Routing Structure

**Current State:**
```
beerpath.com/
├── index.php
├── breweries.php
├── regions.php
├── nearby.php
└── itinerary.php
```

**Multi-Tenant Target:**
```
beerpath.com/
├── / (root) → auto-redirects to /ohio (or state picker when multi-state)
└── /{state}/
    ├── /ohio/
    ├── /pennsylvania/
    └── /colorado/
        ├── (home)
        ├── breweries
        ├── regions
        ├── nearby
        └── itinerary
```

### Database Schema Changes

**New `states` Table:**
```sql
CREATE TABLE states (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(50) UNIQUE NOT NULL,        -- 'ohio', 'pennsylvania'
  name VARCHAR(100) NOT NULL,               -- 'Ohio', 'Pennsylvania'
  active BOOLEAN DEFAULT true,

  -- Theming
  theme_primary_color VARCHAR(7),           -- '#d97706' (amber)
  theme_accent_color VARCHAR(7),            -- '#16a34a' (hops green)
  theme_hero_image VARCHAR(255),

  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  tagline VARCHAR(255),

  -- Stats
  brewery_count INT DEFAULT 0,
  region_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Update `breweries` Table:**
```sql
ALTER TABLE breweries
  ADD COLUMN state_id INT,
  ADD FOREIGN KEY (state_id) REFERENCES states(id);

-- Migrate existing Ohio data
INSERT INTO states (slug, name, theme_primary_color, theme_accent_color, tagline)
  VALUES ('ohio', 'Ohio', '#d97706', '#16a34a', 'Plan Your Ultimate Brewery Tour');

UPDATE breweries SET state_id = (SELECT id FROM states WHERE slug = 'ohio');
```

### State Detection Flow

```
1. User visits beerpath.com
   ↓
2. Check localStorage for 'last_state'
   ↓
3. If found → redirect to /{last_state}
   If not found → check available states
   ↓
4. If single state (Ohio only) → redirect to /ohio
   If multiple states → show state picker
   ↓
5. User lands on /ohio (or chosen state)
   ↓
6. All pages load state-specific data:
   - Breweries filtered by state_id
   - Theme colors loaded from states table
   - Hero images state-specific
```

---

## Section 2: Visual Design System & Craft Beer Aesthetic

### Core Design Philosophy

**"Modern brewery discovery that feels authentically local"**
- Clean, fast mobile-first interface (utility wins)
- Warm craft beer color palette (amber, gold, hops green)
- Real brewery photography (authentic, not stock)
- Subtle texture and depth (premium without overdoing it)

### Color System (CSS Custom Properties)

**Universal Base Colors:**
```css
:root {
  /* Neutrals - used across all states */
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-text-primary: #1f2937;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;

  /* Semantic colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

**State-Specific Theme Colors (loaded from database):**
```css
/* Ohio theme (default) */
:root[data-state="ohio"] {
  --color-primary: #d97706;        /* Amber beer */
  --color-primary-light: #fbbf24;  /* Light amber */
  --color-primary-dark: #b45309;   /* Dark amber */
  --color-primary-rgb: 217, 119, 6;
  --color-accent: #16a34a;         /* Hops green */
  --color-accent-light: #22c55e;   /* Light green */
}

/* Pennsylvania theme (future) */
:root[data-state="pennsylvania"] {
  --color-primary: #dc2626;        /* Deep red */
  --color-primary-light: #f87171;
  --color-primary-dark: #991b1b;
  --color-primary-rgb: 220, 38, 38;
  --color-accent: #0891b2;         /* Blue */
  --color-accent-light: #06b6d4;
}
```

### Typography

**Font Stack:**
```css
:root {
  /* Headings - Bold, modern, readable */
  --font-heading: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Body - Clean, highly readable */
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Mono - For addresses, hours */
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;

  /* Sizes (fluid typography) */
  --text-xs: clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.3vw, 1rem);
  --text-base: clamp(1rem, 0.95rem + 0.3vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.3rem + 0.8vw, 2rem);
  --text-3xl: clamp(2rem, 1.7rem + 1.2vw, 2.5rem);
  --text-4xl: clamp(2.5rem, 2rem + 2vw, 3.5rem);
}
```

### Component Styling Philosophy

**Before/After Comparison:**

**Old (Generic Bootstrap):**
- Default blue (#007bff)
- Flat white cards
- Standard shadows
- 8px border radius

**New (Craft Beer Aesthetic):**
- Amber/gold primary (#d97706)
- Gradient backgrounds
- Layered shadows with depth
- 12-16px border radius
- Subtle grain texture overlays
- Hover animations with color shifts

---

## Section 3: Hero, Navigation & Key Components

### Hero Section (State-Specific)

**Dynamic Hero with State Theming:**
- Background image from `states.theme_hero_image`
- Gradient overlay blending state primary color
- Parallax effect on desktop
- Stat badges showing brewery/region counts
- Integrated search component
- Responsive heights (600px desktop, 500px mobile)

**Hero Features:**
- Glass-morphism stat badges
- Text shadows for readability
- Animated gradient overlay
- State-specific tagline from database

### Navigation (State-Aware)

**Top Navigation Components:**
- Logo with state badge indicator
- Desktop horizontal nav links
- Mobile hamburger menu (optional)
- State switcher dropdown (appears when multi-state)
- Itinerary counter badge

**Navigation Features:**
- Sticky positioning with backdrop blur
- Smooth transitions on hover
- Active state indicators
- Touch-friendly tap targets (44px minimum)

### Mobile Bottom Navigation

**Bottom Nav Bar (Mobile Only):**
- Fixed to bottom of viewport
- 5 key actions: Home, Breweries, Search, Nearby, Tour
- Icon + label layout
- Active state highlighting
- Badge counter on "My Tour"
- Hidden on desktop (>768px)

**Implementation:**
```html
<nav class="bottom-nav" aria-label="Mobile navigation">
  <a href="/ohio" class="bottom-nav-item">
    <i class="bi bi-house-fill"></i>
    <span>Home</span>
  </a>
  <a href="/ohio/breweries" class="bottom-nav-item">
    <i class="bi bi-building"></i>
    <span>Breweries</span>
  </a>
  <button class="bottom-nav-item" data-action="search">
    <i class="bi bi-search"></i>
    <span>Search</span>
  </button>
  <a href="/ohio/nearby" class="bottom-nav-item">
    <i class="bi bi-geo-alt-fill"></i>
    <span>Nearby</span>
  </a>
  <a href="/ohio/itinerary" class="bottom-nav-item">
    <i class="bi bi-journal-text"></i>
    <span>My Tour</span>
    <span class="badge">3</span>
  </a>
</nav>
```

---

## Section 4: Brewery Cards & Interactive Components

### Enhanced Brewery Card Design

**Card Features:**
- 220px height images with cover fit
- Hover zoom effect on images
- Region badge overlay (top-right)
- Quick action buttons (appear on hover)
- Open/closed status indicator
- Amenity tags (max 3 visible + counter)
- Distance indicator (when location known)
- Subtle grain texture overlay

**Card Interactions:**
- Lift on hover (6px translateY)
- Border color shift to primary
- Enhanced shadow on hover
- Quick actions: Add to tour, Get directions
- Smooth cubic-bezier transitions

**Card Layout:**
```
┌─────────────────────────────┐
│  [Image with region badge]  │ 220px height
│  [Quick actions on hover]   │
├─────────────────────────────┤
│  Brewery Name               │
│  Type • Location            │
│  Distance: 2.5 mi          │
│                             │
│  [Amenity] [Amenity] [+2]  │
│                             │
│  🟢 Open now               │
│  ─────────────────────────  │
│  [View Details Button]     │
└─────────────────────────────┘
```

### Search Component Enhancement

**Search Features:**
- 50px border radius (pill shape)
- Glass-morphism background
- Icon on left (search)
- Clear button on right (appears when typing)
- Focus state with primary color border
- Large tap target (min 52px height)
- Autocomplete suggestions dropdown

**Search Styling:**
- Backdrop blur effect
- Elevated shadow
- Smooth focus transitions
- Primary color accent on focus

### Button System

**Button Variants:**
```css
.btn-primary {
  background: var(--color-primary);
  color: white;
  /* Amber/gold buttons */
}

.btn-secondary {
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  /* Outlined buttons */
}

.btn-ghost {
  background: var(--color-surface);
  color: var(--color-text-primary);
  /* Subtle buttons */
}

.btn-accent {
  background: var(--color-accent);
  color: white;
  /* Green accent buttons */
}
```

**Button Interactions:**
- 2px lift on hover
- Shadow increase
- Slight scale on active (0.98)
- Ripple effect on click (optional)

---

## Section 5: Implementation Phases

### Phase 1: Visual Design System (Ship Fast - 2-3 days)

**Goal:** Transform current Ohio site with craft beer aesthetic - NO routing changes yet

**Tasks:**
1. Add CSS custom properties system to `assets/css/styles.css`
2. Implement new color palette (amber/gold/green)
3. Add Outfit + Inter fonts via Google Fonts
4. Redesign brewery cards with new styling
5. Enhance hero section with better gradients and overlay
6. Update navigation with state badge and new styling
7. Add mobile bottom navigation
8. Improve search component styling (pill shape, glass effect)
9. Add subtle textures/grain overlays to cards
10. Update all buttons to new design system
11. Test responsive breakpoints

**Files Modified:**
- `assets/css/styles.css` (major rewrite)
- `assets/css/mobile.css` (bottom nav additions)
- `index.php` (add font links in head)
- `includes/navigation.php` (update nav structure)

**Result:** Ohio site looks beautiful and craft beer-themed, all URLs unchanged

**Commit:** "feat: craft beer visual design system"

**Testing Checklist:**
- [ ] Colors match design (amber primary, green accent)
- [ ] Typography loads correctly (Outfit + Inter)
- [ ] Brewery cards hover effects work
- [ ] Hero gradient displays properly
- [ ] Navigation sticky behavior works
- [ ] Mobile bottom nav appears on mobile only
- [ ] All pages still function normally
- [ ] No broken layouts on mobile/tablet/desktop

---

### Phase 2: Database Multi-Tenant Foundation (Backend - 1-2 days)

**Goal:** Add multi-tenant database structure, migrate Ohio data

**Tasks:**
1. Create `states` table with full schema
2. Add `state_id` column to `breweries` table
3. Insert Ohio as first state record with theme colors
4. Update all 351 Ohio breweries with `state_id = 1`
5. Create PHP helper functions:
   - `getStateBySlug($slug)` - Get state by URL slug
   - `getActiveStates()` - Get all active states
   - `getCurrentState()` - Get state from URL context
6. Update `includes/db.php` with state helper functions
7. Test state queries work correctly
8. Update brewery queries to filter by state_id
9. Add indexes for performance (`state_id`, `slug`)

**Database Migration Script:**
```sql
-- states table creation
-- breweries table alteration
-- Ohio data migration
-- Index creation
```

**Files Modified:**
- `database/migrations/002-multi-tenant.sql` (new file)
- `includes/db.php` (add helper functions)
- `setup-database.php` (update for multi-tenant)

**Result:** Database ready for multiple states, Ohio data properly linked

**Commit:** "feat: add multi-tenant database schema"

**Testing Checklist:**
- [ ] States table exists with correct schema
- [ ] Ohio state record created with theme colors
- [ ] All breweries have state_id set to Ohio
- [ ] Helper functions return correct data
- [ ] Queries filter by state correctly
- [ ] Foreign key constraints work
- [ ] Indexes improve query performance

---

### Phase 3: URL Routing & State Detection (Architecture - 2-3 days)

**Goal:** Implement `/ohio/` path routing, redirect old URLs

**Tasks:**
1. Update `.htaccess` with state routing rewrite rules
2. Create state detection logic in root `index.php`
3. Refactor all pages to be state-aware:
   - `breweries.php` → works at `/ohio/breweries`
   - `regions.php` → works at `/ohio/regions`
   - `nearby.php` → works at `/ohio/nearby`
   - `itinerary.php` → works at `/ohio/itinerary`
4. Add redirects for old URLs:
   - `/breweries.php` → `/ohio/breweries`
   - `/index.php` → `/ohio`
5. Implement localStorage state persistence
6. Update all internal links to include state slug
7. Update API endpoints to be state-aware
8. Test all pages under new routing structure

**.htaccess Routing Rules:**
```apache
RewriteEngine On

# State routing
RewriteRule ^([a-z]+)/?$ index.php?state=$1 [L,QSA]
RewriteRule ^([a-z]+)/([a-z-]+)$ $2.php?state=$1 [L,QSA]

# Old URL redirects
RewriteRule ^breweries\.php$ /ohio/breweries [R=301,L]
RewriteRule ^regions\.php$ /ohio/regions [R=301,L]
Reantml:parameter>
RewriteRule ^nearby\.php$ /ohio/nearby [R=301,L]
RewriteRule ^itinerary\.php$ /ohio/itinerary [R=301,L]
```

**State Detection Logic:**
```php
// index.php (root)
function detectAndRouteState() {
    $stateSlug = $_GET['state'] ?? null;

    if (!$stateSlug) {
        // Check localStorage via JavaScript
        // Fall back to single state or picker
        $states = getActiveStates();
        if (count($states) === 1) {
            redirect("/{$states[0]['slug']}");
        } else {
            showStatePicker();
        }
    }

    $state = getStateBySlug($stateSlug);
    if (!$state) {
        show404();
    }

    return $state;
}
```

**Files Modified:**
- `.htaccess` (routing rules)
- `index.php` (state detection)
- All page files (breweries, regions, nearby, itinerary)
- `includes/navigation.php` (update links)
- API files (state-aware queries)

**Result:** Multi-tenant routing live, Ohio fully functional at `/ohio/*`

**Commit:** "feat: implement multi-tenant URL routing"

**Testing Checklist:**
- [ ] `/ohio` loads correctly
- [ ] `/ohio/breweries` shows Ohio breweries only
- [ ] Old URLs redirect properly
- [ ] State detection from URL works
- [ ] localStorage persistence works
- [ ] All internal links include state slug
- [ ] API endpoints filter by state
- [ ] 404 for invalid state slugs

---

### Phase 4: Dynamic State Theming (Polish - 1 day)

**Goal:** Load theme colors from database, prepare for state #2

**Tasks:**
1. Update `includes/config.php` to load current state theme
2. Generate CSS custom properties dynamically based on state
3. Inject theme variables in `<head>` section
4. Load state-specific hero images from database
5. Update meta tags with state-specific SEO content
6. Create state switcher UI component (hidden until multi-state)
7. Add theme preview functionality for testing
8. Test theme switching with mock Pennsylvania data

**Dynamic Theme Injection:**
```php
// In head section
<?php
$state = getCurrentState();
?>
<style>
:root {
  --color-primary: <?php echo $state['theme_primary_color']; ?>;
  --color-accent: <?php echo $state['theme_accent_color']; ?>;
  --hero-image: url('<?php echo $state['theme_hero_image']; ?>');
  /* RGB for rgba() usage */
  --color-primary-rgb: <?php echo hexToRgb($state['theme_primary_color']); ?>;
}
</style>
```

**Files Modified:**
- `includes/config.php` (load state theme)
- `includes/navigation.php` (add state switcher UI)
- All page templates (inject theme variables)
- `includes/seo-utils.php` (state-specific meta tags)

**Result:** System ready for Pennsylvania/Colorado with just database inserts

**Commit:** "feat: dynamic state theming system"

**Testing Checklist:**
- [ ] Theme colors load from database
- [ ] CSS variables inject correctly
- [ ] Hero images change per state
- [ ] Meta tags update per state
- [ ] State switcher UI exists (hidden)
- [ ] Can manually test with Pennsylvania mock data
- [ ] Theme changes without page refresh (SPA-like)

---

### Phase 5: State Picker & Multi-State Launch (Final Polish - 1 day)

**Goal:** Add state picker landing page, finalize multi-state features

**Tasks:**
1. Create state picker landing page (for when count > 1)
2. Build state switcher dropdown component
3. Implement smooth transitions between states
4. Add "Recently Viewed States" to switcher
5. Update documentation: `docs/ADDING_NEW_STATE.md`
6. Create state configuration template
7. Run full test suite across all features
8. Performance optimization (lazy loading, caching)
9. Deploy to Cloudflare Pages

**State Picker Design:**
```html
<section class="state-picker">
  <h1>Discover Craft Breweries</h1>
  <p>Which state are you exploring?</p>

  <div class="state-grid">
    <?php foreach($activeStates as $state): ?>
      <a href="/<?php echo $state['slug']; ?>" class="state-card">
        <img src="<?php echo $state['thumbnail']; ?>" alt="<?php echo $state['name']; ?>">
        <h3><?php echo $state['name']; ?></h3>
        <p><?php echo $state['brewery_count']; ?> breweries</p>
      </a>
    <?php endforeach; ?>
  </div>
</section>
```

**Files Created:**
- `state-picker.php` (landing page)
- `docs/ADDING_NEW_STATE.md` (documentation)
- `docs/STATE_TEMPLATE.md` (configuration template)

**Files Modified:**
- `index.php` (show picker when multi-state)
- `includes/navigation.php` (finalize state switcher)
- Testing scripts (comprehensive tests)

**Result:** Production-ready multi-tenant platform, ready for state #2

**Commit:** "feat: complete multi-tenant platform"

**Testing Checklist:**
- [ ] State picker displays when 2+ states active
- [ ] State switcher works in navigation
- [ ] Transitions between states are smooth
- [ ] localStorage remembers last state
- [ ] All 5 phases integrated correctly
- [ ] No regressions in Ohio functionality
- [ ] Performance is acceptable (<3s load)
- [ ] Mobile experience is excellent
- [ ] Ready to add Pennsylvania

---

## Adding New States

**Documentation: `docs/ADDING_NEW_STATE.md`**

To add a new state (e.g., Pennsylvania):

1. **Gather Data**
   - Compile brewery list for new state
   - Geocode all addresses
   - Classify into regions
   - Select hero images (3-5 photos)

2. **Database Insert**
```sql
INSERT INTO states (slug, name, theme_primary_color, theme_accent_color, theme_hero_image, tagline, meta_title, meta_description)
VALUES (
  'pennsylvania',
  'Pennsylvania',
  '#dc2626',  -- Deep red
  '#0891b2',  -- Blue
  '/assets/images/states/pennsylvania-hero.jpg',
  'Explore Pennsylvania\'s Rich Brewing Heritage',
  'Pennsylvania Craft Breweries | BeerPath',
  'Discover the best craft breweries in Pennsylvania. Plan your brewery tour through PA\'s historic beer scene.'
);
```

3. **Import Breweries**
```sql
INSERT INTO breweries (name, street, city, state, state_id, latitude, longitude, ...)
VALUES (...);
```

4. **Test**
   - Visit `/pennsylvania`
   - Verify theme colors load
   - Verify breweries display
   - Test all functionality

5. **Deploy**
   - Commit brewery data
   - Deploy to production
   - Update sitemap
   - Announce new state

**Time to add new state after platform complete:** 2-4 hours (data gathering is the bottleneck)

---

## Performance Considerations

### Optimization Strategies

**Database:**
- Index on `breweries.state_id` for fast filtering
- Index on `states.slug` for state lookups
- Consider caching state config in PHP session
- Brewery count updates via scheduled job

**Frontend:**
- Lazy load brewery card images
- Use `loading="lazy"` attribute
- Implement infinite scroll for large brewery lists
- Minify CSS/JS in production
- Use CDN for font files

**Caching:**
- Cache state configurations (rarely change)
- Cache brewery lists per state (update daily)
- Use browser cache for images (30 days)
- Consider Redis for high-traffic states

**Mobile:**
- Prioritize above-the-fold content
- Defer non-critical JavaScript
- Optimize images (WebP format)
- Test on 3G network speeds

---

## Security Considerations

**State Injection Prevention:**
- Whitelist state slugs from database
- Sanitize all user inputs
- Use prepared statements for queries
- Validate state exists before loading theme

**Theme Injection:**
- Validate color codes (hex format)
- Sanitize image URLs
- Escape all dynamic content
- CSP headers for XSS prevention

**Multi-Tenant Isolation:**
- Ensure queries always filter by state_id
- Test cross-state data leakage
- Audit API endpoints for state filtering
- Monitor for unauthorized state access

---

## Success Metrics

**Phase 1 Success:**
- Visual design matches mockup 90%+
- Mobile Lighthouse score >85
- No layout regressions
- User feedback positive on aesthetics

**Phase 3 Success:**
- All old URLs redirect correctly
- Zero broken links
- State routing works 100%
- Analytics shows no 404 spike

**Phase 5 Success:**
- Can add Pennsylvania in <4 hours
- Platform scales to 10+ states
- Performance remains <3s load time
- Multi-state users switch seamlessly

---

## Future Enhancements (Post-MVP)

**State-Level Features:**
- State-specific blog posts
- Local events calendar
- Brewery tours/packages
- State craft beer associations

**Advanced Theming:**
- Custom fonts per state
- Layout variations (urban vs rural feel)
- Seasonal themes
- Dark mode per state preference

**User Features:**
- User accounts (save itineraries across states)
- Cross-state brewery comparisons
- "Brewery Passport" (check-ins across states)
- Social features (share tours, reviews)

**Platform Features:**
- Admin dashboard for managing states
- Brewery submission form
- Analytics per state
- API for third-party integrations

---

## Conclusion

This design provides a clear path from single-state Ohio app to scalable multi-tenant platform. The incremental approach allows shipping improvements quickly while building toward the full vision.

**Key Strengths:**
- Visual improvements ship first (fast user value)
- Architecture scales to 50+ states
- Each phase is independently testable
- Low risk of breaking existing functionality
- Clear documentation for adding states

**Timeline:** 7-10 days total implementation
**Result:** Production-ready multi-tenant craft brewery discovery platform

---

**Next Step:** Begin Phase 1 implementation - Visual Design System
