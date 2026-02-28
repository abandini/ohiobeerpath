// Itinerary/Tour planning page template
import { layout } from './layout';
import type { Brewery, SubdomainContext } from '../types';

export function itineraryPage(subdomain?: SubdomainContext): string {
  const stateName = subdomain?.stateName || 'craft brewery';
  const isMultiState = subdomain?.isMultiState ?? true;
  const adventureLabel = isMultiState ? 'craft brewery adventure' : `${stateName} brewery adventure`;

  const content = `
  <main class="container py-5">
    <div class="text-center mb-5">
      <h1 class="display-4 fw-bold">
        <i class="bi bi-journal-text text-warning"></i> My Brewery Tour
      </h1>
      <p class="lead text-muted">Plan your perfect ${adventureLabel}</p>
    </div>

    <div id="empty-tour" class="text-center py-5">
      <div class="card mx-auto border-0" style="max-width: 560px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%); border-radius: 16px;">
        <div class="card-body py-5 px-4">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">
            <span role="img" aria-hidden="true">🍺</span>
            <span role="img" aria-hidden="true">🗺️</span>
          </div>
          <h3 class="fw-bold mb-2">Plan Your Brewery Adventure</h3>
          <p class="mb-4" style="color: #92400e;">Browse our breweries and build your perfect tour. We'll help you optimize the route.</p>
          <div class="d-flex gap-3 justify-content-center flex-wrap">
            <a href="/breweries" class="btn btn-lg" style="background: #d97706; color: white; border-radius: 12px; padding: 0.75rem 1.5rem;">
              <i class="bi bi-cup-straw"></i> Browse Breweries
            </a>
            <a href="/nearby" class="btn btn-lg" style="background: white; color: #d97706; border: 2px solid #d97706; border-radius: 12px; padding: 0.75rem 1.5rem;">
              <i class="bi bi-geo-alt"></i> Find Nearby
            </a>
            <a href="/trails" class="btn btn-lg" style="background: white; color: #16a34a; border: 2px solid #16a34a; border-radius: 12px; padding: 0.75rem 1.5rem;">
              <i class="bi bi-signpost-2"></i> Try a Trail
            </a>
          </div>
          <div class="mt-4 pt-3" style="border-top: 1px solid rgba(146, 64, 14, 0.15);">
            <p class="mb-0 small" style="color: #92400e;">
              <strong>How it works:</strong> Browse or search, tap "Add to Tour" on any brewery, then come back here to reorder and optimize your route with AI.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div id="tour-content" class="d-none">
      <div class="row">
        <div class="col-lg-8">
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="bi bi-list-ol"></i> Tour Stops</h5>
              <button id="optimize-btn" class="btn btn-warning btn-sm">
                <i class="bi bi-magic"></i> AI Optimize Route
              </button>
            </div>
            <div class="card-body">
              <div id="tour-list"></div>
            </div>
          </div>

          <div id="optimization-result" class="card mb-4 d-none">
            <div class="card-header bg-warning text-dark">
              <h5 class="mb-0"><i class="bi bi-magic"></i> AI Optimized Route</h5>
            </div>
            <div class="card-body">
              <div id="optimized-route"></div>
              <div class="mt-3">
                <button id="apply-optimization" class="btn btn-success">
                  <i class="bi bi-check"></i> Apply This Route
                </button>
                <button id="dismiss-optimization" class="btn btn-outline-secondary">
                  Keep Original
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card sticky-top" style="top: 100px;">
            <div class="card-header">
              <h5 class="mb-0"><i class="bi bi-info-circle"></i> Tour Summary</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <strong>Total Stops:</strong>
                <span id="stop-count" class="badge bg-warning text-dark fs-6">0</span>
              </div>
              <div class="mb-3">
                <strong>Estimated Time:</strong>
                <span id="est-time" class="text-muted">--</span>
              </div>
              <div class="mb-3">
                <strong>Regions:</strong>
                <div id="regions-list"></div>
              </div>
              <hr>
              <button id="clear-tour" class="btn btn-outline-danger w-100 mb-2">
                <i class="bi bi-trash"></i> Clear Tour
              </button>
              <button id="share-tour" class="btn btn-outline-secondary w-100 mb-2">
                <i class="bi bi-share"></i> Share Tour
              </button>
              <button id="export-maps" class="btn btn-outline-success w-100">
                <i class="bi bi-map"></i> Export to Google Maps
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>


  <script>
    const emptyTour = document.getElementById('empty-tour');
    const tourContent = document.getElementById('tour-content');
    const tourList = document.getElementById('tour-list');
    const stopCount = document.getElementById('stop-count');
    const estTime = document.getElementById('est-time');
    const regionsList = document.getElementById('regions-list');
    const optimizeBtn = document.getElementById('optimize-btn');
    const optimizationResult = document.getElementById('optimization-result');
    const optimizedRoute = document.getElementById('optimized-route');

    let breweries = [];

    async function loadTour() {
      const tourIds = JSON.parse(localStorage.getItem('brewery_tour') || '[]');

      if (tourIds.length === 0) {
        emptyTour.classList.remove('d-none');
        tourContent.classList.add('d-none');
        return;
      }

      emptyTour.classList.add('d-none');
      tourContent.classList.remove('d-none');

      // Fetch brewery details
      try {
        const promises = tourIds.map(id =>
          fetch(\`/api/breweries/\${id}\`).then(r => r.json())
        );
        const results = await Promise.all(promises);
        breweries = results.filter(r => r.success).map(r => r.brewery);
        renderTour();
      } catch (err) {
        console.error('Error loading tour:', err);
      }
    }

    function renderTour() {
      if (breweries.length === 0) {
        emptyTour.classList.remove('d-none');
        tourContent.classList.add('d-none');
        return;
      }

      tourList.innerHTML = breweries.map((brewery, index) => \`
        <div class="tour-item" data-id="\${brewery.id}" draggable="true">
          <span class="drag-handle"><i class="bi bi-grip-vertical"></i></span>
          <span class="tour-number">\${index + 1}</span>
          <div>
            <strong>\${brewery.name}</strong>
            <br>
            <small class="text-muted">
              <i class="bi bi-geo-alt"></i> \${brewery.city}\${brewery.region ? ' • ' + brewery.region : ''}
            </small>
          </div>
          <button class="btn btn-outline-danger btn-sm remove-btn" data-id="\${brewery.id}">
            <i class="bi bi-x"></i>
          </button>
        </div>
      \`).join('');

      // Update summary
      stopCount.textContent = breweries.length;
      estTime.textContent = \`~\${breweries.length} hours (1hr per stop)\`;

      const regions = [...new Set(breweries.map(b => b.region).filter(Boolean))];
      regionsList.innerHTML = regions.map(r =>
        \`<span class="badge bg-secondary me-1">\${r}</span>\`
      ).join('') || '<span class="text-muted">--</span>';

      // Attach event listeners
      document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = parseInt(this.dataset.id);
          let tour = JSON.parse(localStorage.getItem('brewery_tour') || '[]');
          tour = tour.filter(t => t !== id);
          localStorage.setItem('brewery_tour', JSON.stringify(tour));
          breweries = breweries.filter(b => b.id !== id);
          renderTour();
        });
      });

      // Simple drag and drop
      const items = document.querySelectorAll('.tour-item');
      items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
      });
    }

    let draggedItem = null;

    function handleDragStart(e) {
      draggedItem = this;
      this.style.opacity = '0.5';
    }

    function handleDragOver(e) {
      e.preventDefault();
    }

    function handleDrop(e) {
      e.preventDefault();
      if (this !== draggedItem) {
        const allItems = [...document.querySelectorAll('.tour-item')];
        const draggedIndex = allItems.indexOf(draggedItem);
        const droppedIndex = allItems.indexOf(this);

        // Reorder breweries array
        const [removed] = breweries.splice(draggedIndex, 1);
        breweries.splice(droppedIndex, 0, removed);

        // Update localStorage
        localStorage.setItem('brewery_tour', JSON.stringify(breweries.map(b => b.id)));

        renderTour();
      }
    }

    function handleDragEnd() {
      this.style.opacity = '1';
    }

    document.getElementById('clear-tour').addEventListener('click', () => {
      if (confirm('Clear all breweries from your tour?')) {
        localStorage.removeItem('brewery_tour');
        breweries = [];
        loadTour();
      }
    });

    document.getElementById('share-tour').addEventListener('click', async () => {
      const btn = document.getElementById('share-tour');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating link...';

      try {
        const response = await fetch('/api/tours/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brewery_ids: breweries.map(b => b.id),
            name: 'My Brewery Tour'
          })
        });
        const data = await response.json();

        if (data.success) {
          await navigator.clipboard.writeText(data.share_url);
          alert('Share link copied!\\n\\n' + data.share_url);
        } else {
          // Fallback to simple URL
          const ids = breweries.map(b => b.id).join(',');
          const url = window.location.origin + '/itinerary?tour=' + ids;
          await navigator.clipboard.writeText(url);
          alert('Tour link copied to clipboard!');
        }
      } catch (err) {
        const ids = breweries.map(b => b.id).join(',');
        const url = window.location.origin + '/itinerary?tour=' + ids;
        navigator.clipboard.writeText(url).then(() => {
          alert('Tour link copied to clipboard!');
        });
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-share"></i> Share Tour';
      }
    });

    optimizeBtn.addEventListener('click', async () => {
      if (breweries.length < 2) {
        alert('Add at least 2 breweries to optimize your route');
        return;
      }

      optimizeBtn.disabled = true;
      optimizeBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Optimizing...';

      try {
        const response = await fetch('/api/itinerary/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brewery_ids: breweries.map(b => b.id) })
        });
        const data = await response.json();

        if (data.success && data.optimized_route) {
          displayOptimizedRoute(data.optimized_route);
        } else {
          alert('Could not optimize route. Try again later.');
        }
      } catch (err) {
        alert('Error optimizing route');
      } finally {
        optimizeBtn.disabled = false;
        optimizeBtn.innerHTML = '<i class="bi bi-magic"></i> AI Optimize Route';
      }
    });

    function displayOptimizedRoute(route) {
      optimizationResult.classList.remove('d-none');

      const orderedBreweries = route.order.map(id => breweries.find(b => b.id === id));

      optimizedRoute.innerHTML = \`
        <p class="text-muted mb-3">
          <i class="bi bi-clock"></i> Est. \${route.total_time_minutes} min driving
          • <i class="bi bi-signpost"></i> \${route.total_distance_miles.toFixed(1)} miles total
        </p>
        \${orderedBreweries.map((b, i) => \`
          <div class="d-flex align-items-center mb-2">
            <span class="tour-number">\${i + 1}</span>
            <strong>\${b.name}</strong>
            <span class="text-muted ms-2">\${b.city}</span>
          </div>
          \${route.legs[i] ? \`
            <div class="ms-5 mb-2 text-muted small">
              <i class="bi bi-arrow-down"></i> \${route.legs[i].distance_miles.toFixed(1)} mi, ~\${route.legs[i].time_minutes} min
            </div>
          \` : ''}
        \`).join('')}
      \`;
    }

    document.getElementById('apply-optimization')?.addEventListener('click', () => {
      // Route will be applied from the optimization result
      optimizationResult.classList.add('d-none');
    });

    document.getElementById('dismiss-optimization')?.addEventListener('click', () => {
      optimizationResult.classList.add('d-none');
    });

    document.getElementById('export-maps')?.addEventListener('click', () => {
      if (breweries.length === 0) {
        alert('Add breweries to your tour first');
        return;
      }
      const waypoints = breweries.filter(b => b.latitude && b.longitude);
      if (waypoints.length === 0) return;
      const origin = \`\${waypoints[0].latitude},\${waypoints[0].longitude}\`;
      const destination = \`\${waypoints[waypoints.length - 1].latitude},\${waypoints[waypoints.length - 1].longitude}\`;
      const middle = waypoints.slice(1, -1).map(b => \`\${b.latitude},\${b.longitude}\`).join('|');
      let url = \`https://www.google.com/maps/dir/?api=1&origin=\${origin}&destination=\${destination}\`;
      if (middle) url += \`&waypoints=\${encodeURIComponent(middle)}\`;
      url += '&travelmode=driving';
      window.open(url, '_blank');
    });

    // Check for shared tour in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedTour = urlParams.get('tour');
    if (sharedTour) {
      const ids = sharedTour.split(',').map(Number).filter(n => !isNaN(n));
      if (ids.length > 0) {
        localStorage.setItem('brewery_tour', JSON.stringify(ids));
      }
    }

    loadTour();
  </script>
  `;

  return layout('My Brewery Tour Planner', content, {
    description: 'Plan and optimize your brewery tour. Add breweries, reorder stops, and get AI-powered route optimization for the perfect craft beer road trip.',
  });
}
