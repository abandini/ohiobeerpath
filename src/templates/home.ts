import { layout, getSiteBranding } from './layout';
import type { Brewery, SubdomainContext } from '../types';
import { hashCode, jsonLd, sourcedQuote, escapeAttr, escapeHtml, excerpt } from './utils';

interface HomePageOptions {
  subdomain?: SubdomainContext;
}

export interface HomeStats {
  total: number;
  regions: number;
  states?: string[];   // full state names covered by the directory, e.g. ['Ohio', 'Michigan']
  updatedAt?: string;  // ISO date of the most recent brewery record change
}

// Human-readable "A, B and C" list
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// Quotable one-paragraph answer for people and answer engines: what the site is,
// how many breweries it covers, where, and when the data last changed.
export function homeSummary(stats: HomeStats, siteName: string, isMultiState: boolean, stateName: string): string {
  const where = isMultiState
    ? (stats.states && stats.states.length ? joinNames(stats.states) : 'the Midwest and Great Lakes states')
    : stateName;
  const updated = stats.updatedAt
    ? ` Listings last updated ${new Date(stats.updatedAt + (stats.updatedAt.length === 10 ? 'T00:00:00Z' : '')).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}.`
    : '';
  return `${siteName} is a free directory and trip planner covering ${stats.total.toLocaleString('en-US')} craft breweries in ${where}, organized into ${stats.regions} regions, with hours, addresses, amenities and route-optimized tours.${updated}`;
}

export function homePage(featuredBreweries: Brewery[], stats: HomeStats, options: HomePageOptions = {}): string {
  const subdomain = options.subdomain;
  const branding = getSiteBranding(subdomain);
  const stateName = subdomain?.stateName || 'Ohio';
  const isMultiState = subdomain?.isMultiState ?? false;
  // getSiteBranding() treats "no subdomain context" as the multi-state brand; the summary follows it
  const summaryMultiState = subdomain ? subdomain.isMultiState : true;
  const stateAbbrevToName: Record<string, string> = {
    OH: 'Ohio', MI: 'Michigan', PA: 'Pennsylvania',
    IN: 'Indiana', KY: 'Kentucky', WV: 'West Virginia'
  };
  // Generate a "Brewery of the Day" based on current date
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const breweryOfDay = featuredBreweries[dayOfYear % featuredBreweries.length];
  const breweryOfDayState = breweryOfDay ? (stateAbbrevToName[breweryOfDay.state || ''] || stateName) : stateName;
  const spotlightQuote = breweryOfDay ? sourcedQuote(breweryOfDay) : null;

  const content = `
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="hero-content">
      <h1>${branding.heroTitle}</h1>
      <p class="hero-subtitle">${branding.tagline}</p>
      <p class="hero-summary" style="max-width:720px;margin:0 auto 1rem;font-size:1.05rem;line-height:1.55;opacity:.92">${homeSummary(stats, branding.siteName, summaryMultiState, stateName)}</p>

      <div class="hero-stats">
        <div class="hero-stat">
          <span class="hero-stat-value">${stats.total}</span>
          <span class="hero-stat-label">Breweries</span>
        </div>
        <div class="hero-stat">
          <span class="hero-stat-value">${stats.regions}</span>
          <span class="hero-stat-label">Regions</span>
        </div>
      </div>

      <!-- Search Component -->
      <div class="search-container mt-4">
        <div class="search-input-wrapper">
          <input
            type="text"
            class="search-input"
            placeholder="Search by name, city, or region..."
            id="searchInput"
            role="combobox"
            aria-label="Search breweries by name, city, or region"
            aria-expanded="false"
            aria-controls="searchResults"
            aria-autocomplete="list"
            autocomplete="off"
          >
          <i class="bi bi-search search-icon"></i>
        </div>
        <div id="searchResults" class="search-results" role="listbox" aria-label="Search results" aria-live="polite"></div>
      </div>
    </div>
  </section>

  <!-- Quick Region Filters -->
  <section class="container my-4">
    ${isMultiState ? `
    <!-- Multi-state: Show state selector -->
    <div class="state-selector-cta text-center">
      <p class="lead mb-3">Choose a state to explore breweries</p>
      <div class="region-quick-filters">
        <a href="https://ohio.brewerytrip.com" class="region-chip">
          <i class="bi bi-geo-alt"></i> Ohio
        </a>
        <a href="https://michigan.brewerytrip.com" class="region-chip">
          <i class="bi bi-geo-alt"></i> Michigan
        </a>
        <a href="https://indiana.brewerytrip.com" class="region-chip">
          <i class="bi bi-geo-alt"></i> Indiana
        </a>
        <a href="https://kentucky.brewerytrip.com" class="region-chip">
          <i class="bi bi-geo-alt"></i> Kentucky
        </a>
        <a href="https://pennsylvania.brewerytrip.com" class="region-chip">
          <i class="bi bi-geo-alt"></i> Pennsylvania
        </a>
        <a href="/nearby" class="region-chip highlight">
          <i class="bi bi-crosshair"></i> Near Me
        </a>
      </div>
    </div>
    ` : `
    <!-- State-specific: Show regional filters -->
    <div class="region-quick-filters">
      <a href="/regions/central" class="region-chip">
        <i class="bi bi-geo-alt"></i> Central ${stateName}
      </a>
      <a href="/regions/northeast" class="region-chip">
        <i class="bi bi-geo-alt"></i> Northeast
      </a>
      <a href="/regions/northwest" class="region-chip">
        <i class="bi bi-geo-alt"></i> Northwest
      </a>
      <a href="/regions/southwest" class="region-chip">
        <i class="bi bi-geo-alt"></i> Southwest
      </a>
      <a href="/regions/southeast" class="region-chip">
        <i class="bi bi-geo-alt"></i> Southeast
      </a>
      <a href="/nearby" class="region-chip highlight">
        <i class="bi bi-crosshair"></i> Near Me
      </a>
    </div>
    `}
  </section>

  <!-- Brewery of the Day -->
  ${breweryOfDay ? `
  <section class="container my-5">
    <div class="featured-spotlight">
      <div class="spotlight-badge">
        <i class="bi bi-star-fill"></i> Brewery of the Day
      </div>
      <div class="spotlight-content">
        <div class="spotlight-info">
          <span class="spotlight-region">${(breweryOfDay.region || breweryOfDayState).toUpperCase()}</span>
          <h2 class="spotlight-title">${breweryOfDay.name}</h2>
          <p class="spotlight-location">
            <i class="bi bi-geo-alt-fill"></i> ${breweryOfDay.city}, ${breweryOfDayState}
            ${breweryOfDay.brewery_type ? `<span class="mx-2">•</span>${breweryOfDay.brewery_type}` : ''}
          </p>
          <p class="spotlight-description">
            ${spotlightQuote
              ? `<q cite="${escapeAttr(spotlightQuote.sourceUrl)}" title="From ${escapeAttr(spotlightQuote.host)}">${escapeHtml(excerpt(spotlightQuote.quote, 150))}</q>`
              : escapeHtml(`${breweryOfDay.name} is a ${breweryOfDay.brewery_type || 'craft'} brewery in ${breweryOfDay.city}, ${breweryOfDayState}.`)}
          </p>
          <div class="spotlight-actions">
            <a href="/brewery/${breweryOfDay.id}" class="btn btn-warning btn-lg">
              <i class="bi bi-arrow-right-circle"></i> Explore Now
            </a>
            <button class="btn btn-outline-dark" onclick="addToTour(${breweryOfDay.id})">
              <i class="bi bi-plus-circle"></i> Add to Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
  ` : ''}

  <!-- Featured Breweries -->
  <section class="container my-5">
    <div class="section-header">
      <h2><i class="bi bi-collection text-warning"></i> Featured Breweries</h2>
      <a href="/breweries" class="view-all-link">View All ${stats.total} <i class="bi bi-arrow-right"></i></a>
    </div>
    <div class="row g-4">
      ${featuredBreweries.map(brewery => breweryCard(brewery, stateName)).join('')}
    </div>
  </section>

  <!-- CTA Section -->
  <section class="cta-section">
    <div class="container">
      <div class="cta-content">
        <h2>Plan Your Perfect Brewery Tour</h2>
        <p>Add breweries to your tour, get optimized routes, and never miss a great craft beer spot.</p>
        <div class="cta-buttons">
          <a href="/breweries" class="btn btn-light btn-lg">
            <i class="bi bi-search"></i> Browse Breweries
          </a>
          <a href="/nearby" class="btn btn-warning btn-lg">
            <i class="bi bi-geo-alt-fill"></i> Find Near Me
          </a>
          <a href="/itinerary" class="btn btn-outline-light btn-lg">
            <i class="bi bi-map"></i> My Tour
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section class="container my-5">
    <h2 class="text-center mb-4">How It Works</h2>
    <div class="row g-4">
      <div class="col-md-4">
        <div class="how-it-works-card">
          <div class="how-icon">
            <i class="bi bi-search"></i>
          </div>
          <h3>1. Discover</h3>
          <p>Browse ${stats.total} craft breweries across ${stats.regions} ${isMultiState ? 'regions' : stateName + ' regions'}. Filter by location, amenities, and more.</p>
        </div>
      </div>
      <div class="col-md-4">
        <div class="how-it-works-card">
          <div class="how-icon">
            <i class="bi bi-plus-circle"></i>
          </div>
          <h3>2. Build Your Tour</h3>
          <p>Add your favorite breweries to your personal tour list. Save as many as you want.</p>
        </div>
      </div>
      <div class="col-md-4">
        <div class="how-it-works-card">
          <div class="how-icon">
            <i class="bi bi-map"></i>
          </div>
          <h3>3. Optimize & Go</h3>
          <p>Get AI-optimized routes to visit all your breweries efficiently. Happy trails!</p>
        </div>
      </div>
    </div>
  </section>


  <script>
    // State context for dynamic content
    const currentStateName = '${stateName}';
    const isMultiState = ${isMultiState};

    // Live search functionality
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;

    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      const query = this.value.trim();

      if (query.length < 2) {
        searchResults.classList.remove('active');
        searchInput.setAttribute('aria-expanded', 'false');
        return;
      }

      searchTimeout = setTimeout(async () => {
        try {
          const response = await fetch('/api/breweries?search=' + encodeURIComponent(query));
          const data = await response.json();

          if (data.breweries && data.breweries.length > 0) {
            searchResults.innerHTML = data.breweries.slice(0, 8).map(b =>
              '<a href="/brewery/' + b.id + '" class="search-result-item" role="option">' +
                '<i class="bi bi-cup-straw text-warning"></i>' +
                '<div>' +
                  '<strong>' + b.name + '</strong>' +
                  '<br><small class="text-muted">' + b.city + ', ' + (b.region || currentStateName) + '</small>' +
                '</div>' +
              '</a>'
            ).join('');
            searchResults.classList.add('active');
            searchInput.setAttribute('aria-expanded', 'true');
          } else {
            searchResults.innerHTML = '<div class="p-3 text-muted">No breweries found</div>';
            searchResults.classList.add('active');
            searchInput.setAttribute('aria-expanded', 'true');
          }
        } catch (err) {
          // Silently handle fetch errors (can happen during page navigation)
          // Only log in development for debugging
          if (window.location.hostname === 'localhost') {
            console.warn('Search fetch issue:', err);
          }
        }
      }, 300);
    });

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove('active');
        searchInput.setAttribute('aria-expanded', 'false');
      }
    });

    // Tour badge is updated by global updateTourBadge() from layout
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof updateTourBadge === 'function') updateTourBadge();
    });
  </script>
  `;

  // HowTo schema for the "How It Works" section (AEO optimization)
  const howToSchema = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Plan Your Perfect Brewery Tour`,
    description: `Plan an optimized craft brewery tour across ${isMultiState ? 'multiple states' : stateName} using Brewery Trip.`,
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Discover Breweries',
        text: `Browse ${stats.total} craft breweries across ${stats.regions} ${isMultiState ? 'regions' : stateName + ' regions'}. Filter by location, amenities, and more.`
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Build Your Tour',
        text: 'Add your favorite breweries to your personal tour list. Save as many as you want.'
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Optimize & Go',
        text: 'Get AI-optimized routes to visit all your breweries efficiently. Happy trails!'
      }
    ]
  });

  // FAQ schema for common questions (AEO optimization)
  const faqSchema = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How many craft breweries are there in ${isMultiState ? 'the region' : stateName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `There are ${stats.total} craft breweries across ${stats.regions} regions listed on Brewery Trip. Browse them all at brewerytrip.com/breweries.`
        }
      },
      {
        '@type': 'Question',
        name: 'How do I plan a brewery tour?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use Brewery Trip to discover breweries, add your favorites to your tour list, then get AI-optimized routes to visit them all efficiently. You can filter by region, amenities like dog-friendly patios or food trucks, and brewery type.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I find breweries near my location?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Use the "Near Me" feature on Brewery Trip to find craft breweries close to your current location. The app uses your GPS to show nearby breweries sorted by distance.'
        }
      }
    ]
  });

  const contentWithSchema = content + `
    <script type="application/ld+json">${howToSchema}</script>
    <script type="application/ld+json">${faqSchema}</script>
  `;

  return layout('Home', contentWithSchema, { subdomain });
}

function breweryCard(brewery: Brewery, stateName: string = 'Ohio'): string {
  const amenities = brewery.amenities?.slice(0, 3) || [];
  const remaining = (brewery.amenities?.length || 0) - 3;

  // Generate gradient based on brewery name
  const hue = Math.abs(hashCode(brewery.name)) % 360;
  const gradient = `linear-gradient(135deg, hsl(${hue}, 70%, 40%) 0%, hsl(${(hue + 40) % 360}, 60%, 30%) 100%)`;

  const stateNames: Record<string, string> = { OH: 'Ohio', MI: 'Michigan', PA: 'Pennsylvania', IN: 'Indiana', KY: 'Kentucky', WV: 'West Virginia' };
  const displayState = stateNames[brewery.state || ''] || brewery.state_province || stateName;
  const regionLabel = brewery.region || displayState;

  return `
  <div class="col-md-6 col-lg-4">
    <div class="brewery-card">
      <div class="card-img-placeholder" style="background: ${gradient};">
        <i class="bi bi-cup-straw"></i>
        <span class="brewery-region-badge">${regionLabel}</span>
      </div>

      <div class="card-body">
        <h3 class="card-title">${brewery.name}</h3>
        <p class="card-subtitle">
          <span class="brewery-type-pill">${brewery.brewery_type || 'Brewery'}</span>
          <span class="brewery-location"><i class="bi bi-geo-alt"></i> ${brewery.city}${displayState !== stateName ? ', ' + displayState : ''}</span>
        </p>

        ${amenities.length > 0 ? `
          <div class="amenity-tags">
            ${amenities.map(a => `<span class="amenity-tag"><i class="bi bi-check-circle"></i> ${a}</span>`).join('')}
            ${remaining > 0 ? `<span class="amenity-tag">+${remaining}</span>` : ''}
          </div>
        ` : ''}

        <a href="/brewery/${brewery.id}" class="btn btn-warning w-100 mt-3">
          View Details
        </a>
      </div>
    </div>
  </div>`;
}
