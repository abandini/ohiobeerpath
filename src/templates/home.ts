import { layout, getSiteBranding } from './layout';
import type { Brewery, SubdomainContext } from '../types';

interface HomePageOptions {
  subdomain?: SubdomainContext;
}

export function homePage(featuredBreweries: Brewery[], stats: { total: number, regions: number }, options: HomePageOptions = {}): string {
  const subdomain = options.subdomain;
  const branding = getSiteBranding(subdomain);
  const stateName = subdomain?.stateName || 'Ohio';
  const isMultiState = subdomain?.isMultiState ?? false;
  // Generate a "Brewery of the Day" based on current date
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const breweryOfDay = featuredBreweries[dayOfYear % featuredBreweries.length];

  const content = `
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="hero-content">
      <h1>${branding.heroTitle}</h1>
      <p class="hero-subtitle">${branding.tagline}</p>

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
          >
          <i class="bi bi-search search-icon"></i>
        </div>
        <div id="searchResults" class="search-results"></div>
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
          <span class="spotlight-region">${(breweryOfDay.region || stateName).toUpperCase()}</span>
          <h2 class="spotlight-title">${breweryOfDay.name}</h2>
          <p class="spotlight-location">
            <i class="bi bi-geo-alt-fill"></i> ${breweryOfDay.city}, ${stateName}
            ${breweryOfDay.brewery_type ? `<span class="mx-2">•</span>${breweryOfDay.brewery_type}` : ''}
          </p>
          <p class="spotlight-description">
            ${breweryOfDay.description && breweryOfDay.description !== 'N/A'
              ? breweryOfDay.description.substring(0, 150) + '...'
              : `Discover ${breweryOfDay.name}, a craft brewery in ${breweryOfDay.city}, ${stateName}. Experience their unique selection of handcrafted beers.`}
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

  <style>
    .hero-subtitle {
      font-size: 1.5rem;
      opacity: 0.9;
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      max-height: 400px;
      overflow-y: auto;
      z-index: 100;
      display: none;
    }

    .search-results.active {
      display: block;
    }

    .search-result-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #eee;
      text-decoration: none;
      color: inherit;
      transition: background 0.2s;
    }

    .search-result-item:hover {
      background: #fef3c7;
    }

    .search-result-item:last-child {
      border-bottom: none;
    }

    .region-quick-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
    }

    .region-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 25px;
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s;
    }

    .region-chip:hover {
      border-color: #d97706;
      color: #d97706;
      transform: translateY(-2px);
    }

    .region-chip.highlight {
      background: #d97706;
      border-color: #d97706;
      color: white;
    }

    .region-chip.highlight:hover {
      background: #b45309;
      border-color: #b45309;
      color: white;
    }

    .featured-spotlight {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 20px;
      padding: 2rem;
      position: relative;
      overflow: hidden;
    }

    .spotlight-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: #d97706;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .spotlight-region {
      display: inline-block;
      background: rgba(0,0,0,0.1);
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 0.5rem;
    }

    .spotlight-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: #92400e;
      margin-bottom: 0.5rem;
    }

    .spotlight-location {
      color: #78350f;
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }

    .spotlight-description {
      color: #92400e;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      max-width: 600px;
    }

    .spotlight-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .view-all-link {
      color: #d97706;
      text-decoration: none;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .view-all-link:hover {
      color: #b45309;
    }

    .brewery-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      transition: transform 0.2s, box-shadow 0.2s;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .brewery-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }

    .card-img-placeholder {
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 3rem;
      position: relative;
    }

    .card-img-placeholder::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%);
    }

    .brewery-region-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(0,0,0,0.6);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      z-index: 1;
    }

    .card-body {
      padding: 1.25rem;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .card-subtitle {
      color: #6b7280;
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
    }

    .amenity-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: auto;
    }

    .amenity-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: #f3f4f6;
      color: #6b7280;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
    }

    .cta-section {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
      padding: 4rem 0;
      margin-top: 3rem;
    }

    .cta-content {
      text-align: center;
      color: white;
    }

    .cta-content h2 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 1rem;
    }

    .cta-content p {
      font-size: 1.25rem;
      opacity: 0.9;
      margin-bottom: 2rem;
    }

    .cta-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .how-it-works-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      height: 100%;
    }

    .how-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 2rem;
      color: #92400e;
    }

    .how-it-works-card h3 {
      font-weight: 700;
      margin-bottom: 0.75rem;
    }

    .how-it-works-card p {
      color: #6b7280;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .spotlight-title {
        font-size: 1.75rem;
      }

      .cta-content h2 {
        font-size: 1.75rem;
      }

      .cta-buttons {
        flex-direction: column;
      }

      .cta-buttons .btn {
        width: 100%;
      }
    }
  </style>

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
        return;
      }

      searchTimeout = setTimeout(async () => {
        try {
          const response = await fetch('/api/breweries?search=' + encodeURIComponent(query));
          const data = await response.json();

          if (data.breweries && data.breweries.length > 0) {
            searchResults.innerHTML = data.breweries.slice(0, 8).map(b =>
              '<a href="/brewery/' + b.id + '" class="search-result-item">' +
                '<i class="bi bi-cup-straw text-warning"></i>' +
                '<div>' +
                  '<strong>' + b.name + '</strong>' +
                  '<br><small class="text-muted">' + b.city + ', ' + (b.region || currentStateName) + '</small>' +
                '</div>' +
              '</a>'
            ).join('');
            searchResults.classList.add('active');
          } else {
            searchResults.innerHTML = '<div class="p-3 text-muted">No breweries found</div>';
            searchResults.classList.add('active');
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
      }
    });

    // Add to tour function
    function addToTour(breweryId) {
      try {
        const tour = JSON.parse(localStorage.getItem('brewery_tour') || '[]');
        if (!tour.includes(breweryId)) {
          tour.push(breweryId);
          localStorage.setItem('brewery_tour', JSON.stringify(tour));
          showToast('Added to your tour!', 'success');
          updateTourBadge();
        } else {
          showToast('Already in your tour', 'info');
        }
      } catch (error) {
        console.error('Error adding to tour:', error);
      }
    }

    function updateTourBadge() {
      try {
        const tour = JSON.parse(localStorage.getItem('brewery_tour') || '[]');
        document.querySelectorAll('.badge').forEach(badge => {
          badge.textContent = tour.length;
        });
      } catch (error) {}
    }

    function showToast(message, type = 'info') {
      const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };
      const toast = document.createElement('div');
      toast.style.cssText =
        'position: fixed; bottom: 20px; right: 20px; z-index: 9999;' +
        'background: ' + (colors[type] || colors.info) + '; color: white;' +
        'padding: 1rem 1.5rem; border-radius: 8px; font-weight: 500;' +
        'box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    document.addEventListener('DOMContentLoaded', updateTourBadge);
  </script>
  `;

  return layout('Home', content, { subdomain });
}

function breweryCard(brewery: Brewery, stateName: string = 'Ohio'): string {
  const amenities = brewery.amenities?.slice(0, 3) || [];
  const remaining = (brewery.amenities?.length || 0) - 3;

  // Generate gradient based on brewery name
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  const hue = Math.abs(hashCode(brewery.name)) % 360;
  const gradient = `linear-gradient(135deg, hsl(${hue}, 70%, 40%) 0%, hsl(${(hue + 40) % 360}, 60%, 30%) 100%)`;

  return `
  <div class="col-md-6 col-lg-4">
    <div class="brewery-card">
      <div class="card-img-placeholder" style="background: ${gradient};">
        <i class="bi bi-cup-straw"></i>
        <span class="brewery-region-badge">${brewery.region || stateName}</span>
      </div>

      <div class="card-body">
        <h3 class="card-title">${brewery.name}</h3>
        <p class="card-subtitle">
          ${brewery.brewery_type || 'Brewery'} • ${brewery.city}
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
