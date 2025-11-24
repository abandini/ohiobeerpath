import { layout } from './layout';
import type { Brewery } from '../types';

export function homePage(featuredBreweries: Brewery[], stats: { total: number, regions: number }): string {
  const content = `
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="hero-content">
      <h1>Discover Ohio's Craft Beer Scene</h1>
      <p>Plan Your Ultimate Brewery Tour</p>

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
          <button class="search-clear" aria-label="Clear search">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Featured Breweries -->
  <section class="container my-5">
    <h2 class="mb-4">Featured Breweries</h2>
    <div class="row g-4">
      ${featuredBreweries.map(brewery => breweryCard(brewery)).join('')}
    </div>
  </section>`;

  return layout('Home', content);
}

function breweryCard(brewery: Brewery): string {
  const amenities = brewery.amenities?.slice(0, 3) || [];
  const remaining = (brewery.amenities?.length || 0) - 3;

  return `
  <div class="col-md-6 col-lg-4">
    <div class="brewery-card grain-texture">
      <img
        src="${brewery.image_url || '/assets/images/brewery-placeholder.jpg'}"
        class="card-img-top"
        alt="${brewery.name}"
      >
      <span class="brewery-region-badge">${brewery.region || 'Ohio'}</span>

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

        <a href="/brewery/${brewery.id}" class="btn btn-primary w-100 mt-3">
          View Details
        </a>
      </div>
    </div>
  </div>`;
}
