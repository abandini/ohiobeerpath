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
