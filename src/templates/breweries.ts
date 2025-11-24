import { layout } from './layout';
import type { Brewery } from '../types';

export function breweriesPage(breweries: Brewery[], region?: string): string {
  const content = `
  <div class="container my-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Ohio Breweries</h1>
      <span class="badge bg-primary">${breweries.length} breweries</span>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body">
        <form method="GET" action="/breweries">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Region</label>
              <select name="region" class="form-select" onchange="this.form.submit()">
                <option value="">All Regions</option>
                <option value="northeast" ${region === 'northeast' ? 'selected' : ''}>Northeast</option>
                <option value="northwest" ${region === 'northwest' ? 'selected' : ''}>Northwest</option>
                <option value="central" ${region === 'central' ? 'selected' : ''}>Central</option>
                <option value="southeast" ${region === 'southeast' ? 'selected' : ''}>Southeast</option>
                <option value="southwest" ${region === 'southwest' ? 'selected' : ''}>Southwest</option>
              </select>
            </div>
            <div class="col-md-8">
              <label class="form-label">Search</label>
              <input
                type="text"
                name="search"
                class="form-control"
                placeholder="Search breweries..."
              >
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Brewery Grid -->
    <div class="row g-4">
      ${breweries.map(brewery => breweryCard(brewery)).join('')}
    </div>
  </div>`;

  return layout('Breweries', content);
}

function breweryCard(brewery: Brewery): string {
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

        <a href="/brewery/${brewery.id}" class="btn btn-primary w-100 mt-3">
          View Details
        </a>
      </div>
    </div>
  </div>`;
}
