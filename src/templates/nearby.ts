// Nearby breweries page template
import { layout } from './layout';
import type { Brewery } from '../types';

export function nearbyPage(): string {
  const content = `
  <main class="container py-5">
    <div class="text-center mb-5">
      <h1 class="display-4 fw-bold">
        <i class="bi bi-geo-alt text-warning"></i> Nearby Breweries
      </h1>
      <p class="lead text-muted">Find craft breweries near your current location</p>
    </div>

    <div id="location-prompt" class="text-center py-5">
      <div class="card mx-auto" style="max-width: 500px;">
        <div class="card-body py-5">
          <i class="bi bi-crosshair fs-1 text-warning mb-3 d-block"></i>
          <h3>Enable Location</h3>
          <p class="text-muted">Allow location access to find breweries near you</p>
          <button id="enable-location" class="btn btn-warning btn-lg">
            <i class="bi bi-geo-alt"></i> Find Nearby Breweries
          </button>
          <p class="small text-muted mt-3">
            Your location is only used to find nearby breweries and is never stored.
          </p>
        </div>
      </div>
    </div>

    <div id="loading" class="text-center py-5 d-none">
      <div class="spinner-border text-warning" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Finding breweries near you...</p>
    </div>

    <div id="error-message" class="alert alert-danger d-none" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      <span id="error-text"></span>
    </div>

    <div id="results" class="d-none">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 id="results-count"></h3>
        <div class="btn-group">
          <button class="btn btn-outline-secondary active" data-radius="10">10 mi</button>
          <button class="btn btn-outline-secondary" data-radius="25">25 mi</button>
          <button class="btn btn-outline-secondary" data-radius="50">50 mi</button>
        </div>
      </div>

      <div id="brewery-list" class="row g-4"></div>
    </div>
  </main>

  <style>
    .brewery-card {
      transition: transform 0.2s;
      border: none;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .brewery-card:hover {
      transform: translateY(-3px);
    }
    .distance-badge {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  </style>

  <script>
    const locationPrompt = document.getElementById('location-prompt');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const breweryList = document.getElementById('brewery-list');
    const resultsCount = document.getElementById('results-count');

    let userLat, userLng;
    let currentRadius = 25;

    document.getElementById('enable-location').addEventListener('click', getLocation);

    document.querySelectorAll('[data-radius]').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('[data-radius]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentRadius = parseInt(this.dataset.radius);
        if (userLat && userLng) {
          fetchNearbyBreweries(userLat, userLng, currentRadius);
        }
      });
    });

    function getLocation() {
      locationPrompt.classList.add('d-none');
      loading.classList.remove('d-none');

      if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLat = position.coords.latitude;
          userLng = position.coords.longitude;
          fetchNearbyBreweries(userLat, userLng, currentRadius);
        },
        (error) => {
          let message = 'Unable to get your location';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Location permission denied. Please enable location access.';
          }
          showError(message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    async function fetchNearbyBreweries(lat, lng, radius) {
      loading.classList.remove('d-none');
      results.classList.add('d-none');
      errorMessage.classList.add('d-none');

      try {
        const response = await fetch(\`/api/breweries/nearby?lat=\${lat}&lng=\${lng}&radius=\${radius}\`);
        const data = await response.json();

        if (data.success) {
          displayBreweries(data.breweries);
        } else {
          showError('Failed to fetch nearby breweries');
        }
      } catch (err) {
        showError('Network error. Please try again.');
      }
    }

    function displayBreweries(breweries) {
      loading.classList.add('d-none');
      results.classList.remove('d-none');

      resultsCount.textContent = \`\${breweries.length} \${breweries.length === 1 ? 'Brewery' : 'Breweries'} Found\`;

      if (breweries.length === 0) {
        breweryList.innerHTML = \`
          <div class="col-12 text-center py-5">
            <i class="bi bi-emoji-frown fs-1 text-muted"></i>
            <p class="mt-3 text-muted">No breweries found within \${currentRadius} miles.</p>
            <p class="text-muted">Try expanding your search radius.</p>
          </div>
        \`;
        return;
      }

      breweryList.innerHTML = breweries.map(brewery => \`
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 brewery-card position-relative">
            \${brewery.distance ? \`<span class="badge bg-warning text-dark distance-badge">\${brewery.distance.toFixed(1)} mi</span>\` : ''}
            <div class="card-body">
              <h5 class="card-title">\${brewery.name}</h5>
              <p class="card-text text-muted">
                <i class="bi bi-geo-alt"></i> \${brewery.city}\${brewery.state ? ', ' + brewery.state : ''}
              </p>
              \${brewery.brewery_type ? \`<span class="badge bg-secondary">\${brewery.brewery_type}</span>\` : ''}
            </div>
            <div class="card-footer bg-transparent">
              <a href="/brewery/\${brewery.id}" class="btn btn-outline-warning btn-sm">
                View Details <i class="bi bi-arrow-right"></i>
              </a>
              <button class="btn btn-outline-secondary btn-sm add-to-tour" data-id="\${brewery.id}">
                <i class="bi bi-plus"></i> Add to Tour
              </button>
            </div>
          </div>
        </div>
      \`).join('');

      // Re-attach event listeners
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
    }

    function showError(message) {
      loading.classList.add('d-none');
      locationPrompt.classList.add('d-none');
      errorMessage.classList.remove('d-none');
      errorText.textContent = message;
    }

    // Check for stored location preference
    if (localStorage.getItem('location_enabled') === 'true') {
      getLocation();
    }
  </script>
  `;

  return layout('Nearby Breweries', content);
}
