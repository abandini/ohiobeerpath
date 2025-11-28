// Regions page template
import { layout } from './layout';
import type { Region, Brewery, SubdomainContext } from '../types';

interface RegionPageOptions {
  subdomain?: SubdomainContext;
}

const REGION_INFO: Record<string, { name: string; description: string; icon: string }> = {
  central: {
    name: 'Central Ohio',
    description: 'Home to Columbus and a thriving craft beer scene with innovative breweries.',
    icon: 'bi-star'
  },
  northeast: {
    name: 'Northeast Ohio',
    description: 'Cleveland and Akron anchor this region with historic brewing traditions.',
    icon: 'bi-building'
  },
  northwest: {
    name: 'Northwest Ohio',
    description: 'Toledo and the Lake Erie shore offer unique brewery experiences.',
    icon: 'bi-water'
  },
  southeast: {
    name: 'Southeast Ohio',
    description: 'Appalachian charm meets craft brewing in this scenic region.',
    icon: 'bi-tree'
  },
  southwest: {
    name: 'Southwest Ohio',
    description: 'Cincinnati leads this region with German brewing heritage.',
    icon: 'bi-cup-hot'
  }
};

export function regionsPage(regions: Region[], options: RegionPageOptions = {}): string {
  const { subdomain } = options;
  const stateName = subdomain?.stateName || 'Ohio';
  const stateLabel = subdomain?.isMultiState ? 'All' : stateName;

  const content = `
  <main class="container py-5">
    <div class="text-center mb-5">
      <h1 class="display-4 fw-bold">Explore ${stateLabel} Regions</h1>
      <p class="lead text-muted">Discover breweries across ${stateLabel}'s diverse regions</p>
    </div>

    <div class="row g-4">
      ${regions.map(region => {
        const info = REGION_INFO[region.slug] || { name: region.name, description: '', icon: 'bi-geo-alt' };
        return `
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 region-card">
            <div class="card-body text-center">
              <div class="region-icon mb-3">
                <i class="${info.icon} fs-1 text-warning"></i>
              </div>
              <h3 class="card-title">${info.name}</h3>
              <p class="card-text text-muted">${info.description}</p>
              <div class="mb-3">
                <span class="badge bg-warning text-dark fs-6">
                  ${region.brewery_count} ${region.brewery_count === 1 ? 'Brewery' : 'Breweries'}
                </span>
              </div>
              <a href="/regions/${region.slug}" class="btn btn-outline-warning">
                <i class="bi bi-arrow-right"></i> Explore Region
              </a>
            </div>
          </div>
        </div>
        `;
      }).join('')}
    </div>

    <div class="text-center mt-5">
      <a href="/breweries" class="btn btn-warning btn-lg">
        <i class="bi bi-list"></i> View All Breweries
      </a>
    </div>
  </main>

  <style>
    .region-card {
      transition: transform 0.2s, box-shadow 0.2s;
      border: none;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .region-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    }
    .region-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }
  </style>
  `;

  return layout('Regions', content, { subdomain });
}

export function regionDetailPage(region: string, breweries: Brewery[], options: RegionPageOptions = {}): string {
  const { subdomain } = options;
  const info = REGION_INFO[region] || { name: region, description: '', icon: 'bi-geo-alt' };

  const content = `
  <main class="container py-5">
    <nav aria-label="breadcrumb" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="/">Home</a></li>
        <li class="breadcrumb-item"><a href="/regions">Regions</a></li>
        <li class="breadcrumb-item active">${info.name}</li>
      </ol>
    </nav>

    <div class="text-center mb-5">
      <div class="region-icon mb-3 mx-auto">
        <i class="${info.icon} fs-1 text-warning"></i>
      </div>
      <h1 class="display-4 fw-bold">${info.name}</h1>
      <p class="lead text-muted">${info.description}</p>
      <span class="badge bg-warning text-dark fs-5">
        ${breweries.length} ${breweries.length === 1 ? 'Brewery' : 'Breweries'}
      </span>
    </div>

    <div class="row g-4">
      ${breweries.map(brewery => `
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 brewery-card">
            <div class="card-body">
              <h5 class="card-title">${brewery.name}</h5>
              <p class="card-text text-muted">
                <i class="bi bi-geo-alt"></i> ${brewery.city}${brewery.state ? `, ${brewery.state}` : ''}
              </p>
              ${brewery.brewery_type ? `<span class="badge bg-secondary">${brewery.brewery_type}</span>` : ''}
            </div>
            <div class="card-footer bg-transparent">
              <a href="/brewery/${brewery.id}" class="btn btn-outline-warning btn-sm">
                View Details <i class="bi bi-arrow-right"></i>
              </a>
              <button class="btn btn-outline-secondary btn-sm add-to-tour" data-id="${brewery.id}">
                <i class="bi bi-plus"></i> Add to Tour
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    ${breweries.length === 0 ? `
      <div class="text-center py-5">
        <i class="bi bi-emoji-frown fs-1 text-muted"></i>
        <p class="mt-3 text-muted">No breweries found in this region yet.</p>
      </div>
    ` : ''}
  </main>

  <style>
    .region-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brewery-card {
      transition: transform 0.2s;
      border: none;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .brewery-card:hover {
      transform: translateY(-3px);
    }
  </style>

  <script>
    document.querySelectorAll('.add-to-tour').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        let tour = JSON.parse(localStorage.getItem('brewery_tour') || '[]');
        if (!tour.includes(parseInt(id))) {
          tour.push(parseInt(id));
          localStorage.setItem('brewery_tour', JSON.stringify(tour));
          this.innerHTML = '<i class="bi bi-check"></i> Added';
          this.classList.remove('btn-outline-secondary');
          this.classList.add('btn-success');
        }
      });
    });
  </script>
  `;

  return layout(info.name, content, { subdomain });
}
