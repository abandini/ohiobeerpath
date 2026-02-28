import { layout } from './layout';
import type { Brewery, SubdomainContext } from '../types';
import { hashCode } from './utils';

interface FilterOptions {
  region?: string;
  amenity?: string;
  search?: string;
  subdomain?: SubdomainContext;
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
}

// Build a query string preserving current filters with a given page number
function buildPageUrl(page: number, filters: FilterOptions): string {
  const params = new URLSearchParams();
  if (filters.region) params.set('region', filters.region);
  if (filters.amenity) params.set('amenity', filters.amenity);
  if (filters.search) params.set('search', filters.search);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `/breweries${qs ? '?' + qs : ''}`;
}

// Render pagination controls with Previous, page numbers, Next
function renderPagination(pagination: PaginationInfo, filters: FilterOptions): string {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return '';

  // Determine which page numbers to show (max 7 with ellipsis)
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return `
    <nav aria-label="Brewery listing pages" class="d-flex justify-content-center mt-4 mb-3">
      <ul class="brewery-pagination">
        <li class="page-item ${page <= 1 ? 'disabled' : ''}">
          <a class="page-link" href="${page > 1 ? buildPageUrl(page - 1, filters) : '#'}"
             ${page <= 1 ? 'tabindex="-1" aria-disabled="true"' : ''}>&laquo; Prev</a>
        </li>
        ${pages.map(p => {
          if (p === '...') {
            return '<li class="page-item disabled"><span class="page-link">&hellip;</span></li>';
          }
          return `<li class="page-item ${p === page ? 'active' : ''}">
            <a class="page-link" href="${buildPageUrl(p, filters)}"
               ${p === page ? 'aria-current="page"' : ''}>${p}</a>
          </li>`;
        }).join('')}
        <li class="page-item ${page >= totalPages ? 'disabled' : ''}">
          <a class="page-link" href="${page < totalPages ? buildPageUrl(page + 1, filters) : '#'}"
             ${page >= totalPages ? 'tabindex="-1" aria-disabled="true"' : ''}>Next &raquo;</a>
        </li>
      </ul>
    </nav>
  `;
}

export function breweriesPage(breweries: Brewery[], filters: FilterOptions = {}, pagination?: PaginationInfo): string {
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

  <div class="container my-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 style="font-weight: 800; color: #1a1a2e;">${stateLabel}Breweries</h1>
      <span class="badge" style="background: #D97706; font-size: 0.9rem; padding: 8px 16px;">${pagination ? pagination.totalItems : breweries.length} breweries</span>
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
              ${subdomain?.isMultiState ? `
              <option value="ohio" ${region === 'ohio' ? 'selected' : ''}>Ohio</option>
              <option value="michigan" ${region === 'michigan' ? 'selected' : ''}>Michigan</option>
              <option value="indiana" ${region === 'indiana' ? 'selected' : ''}>Indiana</option>
              <option value="kentucky" ${region === 'kentucky' ? 'selected' : ''}>Kentucky</option>
              <option value="pennsylvania" ${region === 'pennsylvania' ? 'selected' : ''}>Pennsylvania</option>
              <option value="west-virginia" ${region === 'west-virginia' ? 'selected' : ''}>West Virginia</option>
              ` : `
              <option value="northeast" ${region === 'northeast' ? 'selected' : ''}>Northeast ${stateName}</option>
              <option value="northwest" ${region === 'northwest' ? 'selected' : ''}>Northwest ${stateName}</option>
              <option value="central" ${region === 'central' ? 'selected' : ''}>Central ${stateName}</option>
              <option value="southeast" ${region === 'southeast' ? 'selected' : ''}>Southeast ${stateName}</option>
              <option value="southwest" ${region === 'southwest' ? 'selected' : ''}>Southwest ${stateName}</option>
              <option value="eastcentral" ${region === 'eastcentral' ? 'selected' : ''}>East Central ${stateName}</option>
              `}
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
              aria-label="Search breweries by name, city, or type"
            >
          </div>
        </div>
        <input type="hidden" name="amenity" id="amenityInput" value="${amenity || ''}">
      </form>

      <!-- Amenity Tag Filters -->
      <div class="amenity-tags">
        ${amenityFilters.map(a => `
          <a href="/breweries?${region ? 'region=' + region + '&' : ''}amenity=${a.value}${search ? '&search=' + search : ''}"
             class="amenity-tag ${amenity === a.value ? 'active' : ''}"
             role="button" aria-pressed="${amenity === a.value ? 'true' : 'false'}">
            ${a.icon} ${a.label}
          </a>
        `).join('')}
      </div>
    </div>

    ${pagination && pagination.totalPages > 1 ? `
    <p class="text-muted mb-3 small">
      Showing ${(pagination.page - 1) * pagination.perPage + 1}&ndash;${Math.min(pagination.page * pagination.perPage, pagination.totalItems)} of ${pagination.totalItems} breweries
    </p>
    ` : ''}

    <!-- Brewery Grid -->
    <div class="row g-4">
      ${breweries.length > 0 ? breweries.map(brewery => breweryCard(brewery)).join('') : `
        <div class="col-12 text-center py-5">
          <h4 class="text-muted">No breweries found matching your filters</h4>
          <a href="/breweries" class="btn btn-outline-primary mt-3">Clear Filters</a>
        </div>
      `}
    </div>

    ${pagination ? renderPagination(pagination, filters) : ''}
  </div>`;

  // Schema.org ItemList for brewery listing SEO
  const itemListJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${stateLabel}Breweries`,
    numberOfItems: pagination ? pagination.totalItems : breweries.length,
    itemListElement: breweries.slice(0, 50).map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      url: `https://brewerytrip.com/brewery/${b.id}`
    }))
  });

  const contentWithSchema = content + `
    <script type="application/ld+json">${itemListJsonLd}</script>
  `;

  const stateNames = subdomain?.isMultiState
    ? 'Ohio, Michigan, Indiana, Kentucky, Pennsylvania & West Virginia'
    : (subdomain?.stateName || 'Ohio');
  const pageTitle = `Craft Breweries in ${stateNames}`;
  const pageDescription = `Browse ${breweries.length}+ craft breweries in ${stateNames}. Filter by region, amenities like dog-friendly patios and food trucks, and brewery type. Plan your perfect brewery tour.`;

  return layout(pageTitle, contentWithSchema, {
    subdomain: filters.subdomain,
    description: pageDescription,
  });
}

function breweryCard(brewery: Brewery): string {
  // Generate gradient colors from brewery name
  const hue = Math.abs(hashCode(brewery.name)) % 360;
  const gradient = `linear-gradient(135deg, hsl(${hue}, 65%, 45%), hsl(${(hue + 40) % 360}, 55%, 35%))`;

  // Use state as fallback for city/region
  const stateNames: Record<string, string> = { OH: 'Ohio', MI: 'Michigan', PA: 'Pennsylvania', IN: 'Indiana', KY: 'Kentucky', WV: 'West Virginia' };
  const stateName = stateNames[brewery.state || ''] || brewery.state_province || '';
  const cityFallback = brewery.city || stateName || 'USA';
  const regionFallback = brewery.region || stateName || 'USA';

  // Better description: avoid generic text, keep it short
  const desc = brewery.description && brewery.description !== 'N/A' && brewery.description.length > 10
    ? (brewery.description.length > 120 ? brewery.description.substring(0, 117) + '...' : brewery.description)
    : `${brewery.brewery_type || 'Craft brewery'} in ${cityFallback}${stateName ? ', ' + stateName : ''}.`;

  // Amenity highlights (show top 2)
  const topAmenities = (brewery.amenities || []).slice(0, 2);

  return `
  <div class="col-md-6 col-lg-4">
    <div class="brewery-grid-card">
      <div class="brewery-card-header" style="background: ${gradient};">
        <span class="beer-icon">🍺</span>
        <span class="region-badge">${regionFallback}</span>
      </div>
      <div class="brewery-card-body">
        <h2>${brewery.name}</h2>
        <p class="meta">
          <span class="brewery-type-pill">${brewery.brewery_type || 'Brewery'}</span>
          <span class="brewery-location"><i class="bi bi-geo-alt"></i> ${cityFallback}</span>
        </p>
        <p class="description">${desc}</p>
        ${topAmenities.length > 0 ? `
          <div class="card-amenities">
            ${topAmenities.map(a => `<span class="card-amenity-tag">${a}</span>`).join('')}
          </div>
        ` : ''}
        <div class="card-footer-row">
          <a href="/brewery/${brewery.id}" class="view-btn">View Details</a>
          ${brewery.website_url ? '<span class="has-website" title="Has website"><i class="bi bi-globe2"></i></span>' : ''}
        </div>
      </div>
    </div>
  </div>`;
}
