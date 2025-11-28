import { layout } from './layout';
import type { Brewery, SubdomainContext } from '../types';

// Generate consistent color from string
const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

interface FilterOptions {
  region?: string;
  amenity?: string;
  search?: string;
  subdomain?: SubdomainContext;
}

export function breweriesPage(breweries: Brewery[], filters: FilterOptions = {}): string {
  const { region, amenity, search, subdomain } = filters;

  // Get state name for heading (default to "All" for multi-state)
  const stateName = subdomain?.stateName || 'All';
  const stateLabel = subdomain?.isMultiState ? '' : `${stateName} `;

  // Available amenity filters
  const amenityFilters = [
    { value: 'dog-friendly', label: 'Dog Friendly', icon: '🐕' },
    { value: 'child-friendly', label: 'Child Friendly', icon: '👨‍👩‍👧' },
    { value: 'food', label: 'Food Available', icon: '🍔' },
    { value: 'live-music', label: 'Live Music', icon: '🎵' },
    { value: 'outdoor', label: 'Outdoor Seating', icon: '☀️' },
    { value: 'tours', label: 'Brewery Tours', icon: '🏭' },
  ];

  const content = `
  <style>
    .brewery-grid-card {
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      background: white;
      height: 100%;
    }
    .brewery-grid-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    .brewery-card-header {
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .brewery-card-header .beer-icon {
      font-size: 3rem;
      opacity: 0.9;
    }
    .brewery-card-header .region-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .brewery-card-body {
      padding: 1.25rem;
    }
    .brewery-card-body h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 0.25rem;
    }
    .brewery-card-body .meta {
      color: #666;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    .brewery-card-body .description {
      font-size: 0.85rem;
      color: #555;
      line-height: 1.5;
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .view-btn {
      display: block;
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #D97706, #B45309);
      color: white;
      text-decoration: none;
      text-align: center;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .view-btn:hover {
      background: linear-gradient(135deg, #B45309, #92400E);
      color: white;
    }
    .filter-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      margin-bottom: 2rem;
    }
    .amenity-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .amenity-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      border: 2px solid #e5e7eb;
      background: white;
      color: #374151;
    }
    .amenity-tag:hover {
      border-color: #D97706;
      color: #D97706;
    }
    .amenity-tag.active {
      background: #D97706;
      border-color: #D97706;
      color: white;
    }
    .active-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .active-filter {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      background: #fef3c7;
      border-radius: 20px;
      font-size: 0.8rem;
      color: #92400e;
    }
    .clear-filter {
      cursor: pointer;
      font-weight: bold;
    }
  </style>

  <div class="container my-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 style="font-weight: 800; color: #1a1a2e;">${stateLabel}Breweries</h1>
      <span class="badge" style="background: #D97706; font-size: 0.9rem; padding: 8px 16px;">${breweries.length} breweries</span>
    </div>

    ${(region || amenity || search) ? `
    <div class="active-filters">
      ${region ? `<span class="active-filter">${region} <a href="/breweries${amenity ? '?amenity=' + amenity : ''}${search ? (amenity ? '&' : '?') + 'search=' + search : ''}" class="clear-filter">&times;</a></span>` : ''}
      ${amenity ? `<span class="active-filter">${amenityFilters.find(a => a.value === amenity)?.label || amenity} <a href="/breweries${region ? '?region=' + region : ''}${search ? (region ? '&' : '?') + 'search=' + search : ''}" class="clear-filter">&times;</a></span>` : ''}
      ${search ? `<span class="active-filter">"${search}" <a href="/breweries${region ? '?region=' + region : ''}${amenity ? (region ? '&' : '?') + 'amenity=' + amenity : ''}" class="clear-filter">&times;</a></span>` : ''}
      <a href="/breweries" class="text-muted small ms-2">Clear all</a>
    </div>
    ` : ''}

    <!-- Filters -->
    <div class="filter-card">
      <form method="GET" action="/breweries" id="filterForm">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label fw-semibold">Region</label>
            <select name="region" class="form-select" onchange="this.form.submit()">
              <option value="">All Regions</option>
              <option value="northeast" ${region === 'northeast' ? 'selected' : ''}>Northeast Ohio</option>
              <option value="northwest" ${region === 'northwest' ? 'selected' : ''}>Northwest Ohio</option>
              <option value="central" ${region === 'central' ? 'selected' : ''}>Central Ohio</option>
              <option value="southeast" ${region === 'southeast' ? 'selected' : ''}>Southeast Ohio</option>
              <option value="southwest" ${region === 'southwest' ? 'selected' : ''}>Southwest Ohio</option>
              <option value="eastcentral" ${region === 'eastcentral' ? 'selected' : ''}>East Central Ohio</option>
            </select>
          </div>
          <div class="col-md-8">
            <label class="form-label fw-semibold">Search</label>
            <input
              type="text"
              name="search"
              class="form-control"
              placeholder="Search by name, city, or type..."
              value="${search || ''}"
            >
          </div>
        </div>
        <input type="hidden" name="amenity" id="amenityInput" value="${amenity || ''}">
      </form>

      <!-- Amenity Tag Filters -->
      <div class="amenity-tags">
        ${amenityFilters.map(a => `
          <a href="/breweries?${region ? 'region=' + region + '&' : ''}amenity=${a.value}${search ? '&search=' + search : ''}"
             class="amenity-tag ${amenity === a.value ? 'active' : ''}">
            ${a.icon} ${a.label}
          </a>
        `).join('')}
      </div>
    </div>

    <!-- Brewery Grid -->
    <div class="row g-4">
      ${breweries.length > 0 ? breweries.map(brewery => breweryCard(brewery)).join('') : `
        <div class="col-12 text-center py-5">
          <h4 class="text-muted">No breweries found matching your filters</h4>
          <a href="/breweries" class="btn btn-outline-primary mt-3">Clear Filters</a>
        </div>
      `}
    </div>
  </div>`;

  return layout('Breweries', content, { subdomain: filters.subdomain });
}

function breweryCard(brewery: Brewery): string {
  // Generate gradient colors from brewery name
  const hue = Math.abs(hashCode(brewery.name)) % 360;
  const gradient = `linear-gradient(135deg, hsl(${hue}, 65%, 45%), hsl(${(hue + 40) % 360}, 55%, 35%))`;

  // Use state as fallback for city/region
  const cityFallback = brewery.city || brewery.state_province || 'USA';
  const regionFallback = brewery.region || brewery.state_province || brewery.state || 'USA';

  // Truncate description
  const desc = brewery.description && brewery.description !== 'N/A'
    ? brewery.description
    : `Discover craft beer at ${brewery.name} in ${cityFallback}.`;

  return `
  <div class="col-md-6 col-lg-4">
    <div class="brewery-grid-card">
      <div class="brewery-card-header" style="background: ${gradient};">
        <span class="beer-icon">🍺</span>
        <span class="region-badge">${regionFallback}</span>
      </div>
      <div class="brewery-card-body">
        <h3>${brewery.name}</h3>
        <p class="meta">${brewery.brewery_type || 'Brewery'} • ${cityFallback}</p>
        <p class="description">${desc}</p>
        <a href="/brewery/${brewery.id}" class="view-btn">View Details</a>
      </div>
    </div>
  </div>`;
}
