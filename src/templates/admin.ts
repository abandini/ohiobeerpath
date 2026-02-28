// Admin Dashboard templates
import { Brewery } from '../types';

interface AdminStats {
  totalBreweries: number;
  totalCheckIns: number;
  totalReviews: number;
  totalSubscribers: number;
  totalSharedTours: number;
  recentCheckIns: any[];
  recentReviews: any[];
  topBreweries: any[];
  regionCounts: { region: string; count: number }[];
}

export function adminLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Ohio Beer Path Admin</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <link rel="stylesheet" href="/assets/css/admin.css">
</head>
<body>
  <aside class="admin-sidebar">
    <div class="brand">
      <i class="bi bi-cup-straw text-warning"></i> Admin
    </div>
    <nav class="nav flex-column">
      <a class="nav-link ${title === 'Dashboard' ? 'active' : ''}" href="/admin">
        <i class="bi bi-speedometer2"></i> Dashboard
      </a>
      <a class="nav-link ${title === 'Breweries' ? 'active' : ''}" href="/admin/breweries">
        <i class="bi bi-building"></i> Breweries
      </a>
      <a class="nav-link ${title === 'Reviews' ? 'active' : ''}" href="/admin/reviews">
        <i class="bi bi-star"></i> Reviews
      </a>
      <a class="nav-link ${title === 'Check-Ins' ? 'active' : ''}" href="/admin/check-ins">
        <i class="bi bi-check-circle"></i> Check-Ins
      </a>
      <a class="nav-link ${title === 'Trails' ? 'active' : ''}" href="/admin/trails">
        <i class="bi bi-signpost-2"></i> Trails
      </a>
      <a class="nav-link ${title === 'Events' ? 'active' : ''}" href="/admin/events">
        <i class="bi bi-calendar-event"></i> Events
      </a>
      <a class="nav-link ${title === 'Subscribers' ? 'active' : ''}" href="/admin/subscribers">
        <i class="bi bi-envelope"></i> Subscribers
      </a>
      <a class="nav-link ${title === 'AI Tools' ? 'active' : ''}" href="/admin/ai-tools">
        <i class="bi bi-robot"></i> AI Tools
      </a>
    </nav>
    <div class="mt-auto pt-4" style="position: absolute; bottom: 1rem; left: 1rem; right: 1rem;">
      <a href="/" class="btn btn-outline-warning w-100">
        <i class="bi bi-arrow-left"></i> Back to Site
      </a>
    </div>
  </aside>

  <main class="admin-content">
    ${content}
  </main>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

export function adminDashboard(stats: AdminStats): string {
  const content = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Dashboard</h1>
      <span class="text-muted">Last updated: ${new Date().toLocaleString()}</span>
    </div>

    <!-- Stats Cards -->
    <div class="row g-4 mb-4">
      <div class="col-md-6 col-lg-3">
        <div class="admin-stat-card">
          <div class="d-flex align-items-center">
            <div class="stat-icon bg-warning bg-opacity-10 text-warning me-3">
              <i class="bi bi-building"></i>
            </div>
            <div>
              <div class="stat-value">${stats.totalBreweries}</div>
              <div class="stat-label">Total Breweries</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-lg-3">
        <div class="admin-stat-card">
          <div class="d-flex align-items-center">
            <div class="stat-icon bg-success bg-opacity-10 text-success me-3">
              <i class="bi bi-check-circle"></i>
            </div>
            <div>
              <div class="stat-value">${stats.totalCheckIns}</div>
              <div class="stat-label">Total Check-Ins</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-lg-3">
        <div class="admin-stat-card">
          <div class="d-flex align-items-center">
            <div class="stat-icon bg-info bg-opacity-10 text-info me-3">
              <i class="bi bi-star"></i>
            </div>
            <div>
              <div class="stat-value">${stats.totalReviews}</div>
              <div class="stat-label">Total Reviews</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-lg-3">
        <div class="admin-stat-card">
          <div class="d-flex align-items-center">
            <div class="stat-icon bg-primary bg-opacity-10 text-primary me-3">
              <i class="bi bi-envelope"></i>
            </div>
            <div>
              <div class="stat-value">${stats.totalSubscribers}</div>
              <div class="stat-label">Subscribers</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- Recent Activity -->
      <div class="col-lg-8">
        <div class="data-table">
          <div class="p-3 border-bottom">
            <h5 class="mb-0"><i class="bi bi-activity"></i> Recent Activity</h5>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                ${stats.recentCheckIns.slice(0, 5).map(ci => `
                  <tr>
                    <td><span class="badge badge-success-soft">Check-In</span></td>
                    <td>User checked in at brewery #${ci.brewery_id}</td>
                    <td class="text-muted">${new Date(ci.created_at).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
                ${stats.recentReviews.slice(0, 5).map(r => `
                  <tr>
                    <td><span class="badge badge-info-soft">Review</span></td>
                    <td>${r.rating}★ review for brewery #${r.brewery_id}</td>
                    <td class="text-muted">${new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
                ${(stats.recentCheckIns.length === 0 && stats.recentReviews.length === 0) ? `
                  <tr>
                    <td colspan="3" class="text-center text-muted py-4">No recent activity</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Region Stats -->
      <div class="col-lg-4">
        <div class="data-table">
          <div class="p-3 border-bottom">
            <h5 class="mb-0"><i class="bi bi-map"></i> Breweries by Region</h5>
          </div>
          <div class="p-3">
            ${stats.regionCounts.map(r => `
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-capitalize">${r.region}</span>
                <span class="badge bg-warning text-dark">${r.count}</span>
              </div>
            `).join('')}
            ${stats.regionCounts.length === 0 ? `
              <p class="text-muted text-center mb-0">No region data</p>
            ` : ''}
          </div>
        </div>

        <div class="data-table mt-4">
          <div class="p-3 border-bottom">
            <h5 class="mb-0"><i class="bi bi-trophy"></i> Quick Stats</h5>
          </div>
          <div class="p-3">
            <div class="d-flex justify-content-between mb-2">
              <span>Shared Tours</span>
              <strong>${stats.totalSharedTours}</strong>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Avg Rating</span>
              <strong>${stats.recentReviews.length > 0 ?
                (stats.recentReviews.reduce((a, r) => a + r.rating, 0) / stats.recentReviews.length).toFixed(1)
                : '--'}★</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return adminLayout('Dashboard', content);
}

export function adminBreweriesPage(breweries: Brewery[], page: number, total: number): string {
  const perPage = 25;
  const totalPages = Math.ceil(total / perPage);

  const content = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Breweries</h1>
      <div>
        <button class="btn btn-warning" data-bs-toggle="modal" data-bs-target="#addBreweryModal">
          <i class="bi bi-plus"></i> Add Brewery
        </button>
      </div>
    </div>

    <div class="data-table">
      <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
        <span class="text-muted">${total} breweries total</span>
        <input type="search" class="form-control" style="max-width: 250px;" placeholder="Search breweries..." id="searchInput">
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>City</th>
              <th>Region</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="breweriesTableBody">
            ${breweries.map(b => `
              <tr>
                <td>${b.id}</td>
                <td>
                  <strong>${b.name}</strong>
                  ${b.description && b.description.length > 50 ? '<i class="bi bi-robot text-success ms-1" title="AI Enhanced"></i>' : ''}
                </td>
                <td>${b.city || '--'}</td>
                <td><span class="badge badge-warning-soft text-capitalize">${b.region || '--'}</span></td>
                <td>
                  ${b.latitude && b.longitude ?
                    '<span class="badge badge-success-soft">Located</span>' :
                    '<span class="badge bg-secondary">No GPS</span>'}
                </td>
                <td>
                  <a href="/brewery/${b.id}" class="btn btn-sm btn-outline-secondary" target="_blank">
                    <i class="bi bi-eye"></i>
                  </a>
                  <button class="btn btn-sm btn-outline-primary" onclick="editBrewery(${b.id})">
                    <i class="bi bi-pencil"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${totalPages > 1 ? `
        <div class="p-3 border-top">
          <nav>
            <ul class="pagination pagination-sm mb-0 justify-content-center">
              ${page > 1 ? `<li class="page-item"><a class="page-link" href="/admin/breweries?page=${page - 1}">Previous</a></li>` : ''}
              ${Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                const p = i + 1;
                return `<li class="page-item ${p === page ? 'active' : ''}"><a class="page-link" href="/admin/breweries?page=${p}">${p}</a></li>`;
              }).join('')}
              ${page < totalPages ? `<li class="page-item"><a class="page-link" href="/admin/breweries?page=${page + 1}">Next</a></li>` : ''}
            </ul>
          </nav>
        </div>
      ` : ''}
    </div>

    <script>
      document.getElementById('searchInput').addEventListener('input', function(e) {
        const search = e.target.value.toLowerCase();
        document.querySelectorAll('#breweriesTableBody tr').forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(search) ? '' : 'none';
        });
      });

      function editBrewery(id) {
        alert('Edit brewery ' + id + ' - Feature coming soon!');
      }
    </script>
  `;

  return adminLayout('Breweries', content);
}

export function adminSubscribersPage(subscribers: any[]): string {
  const content = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Email Subscribers</h1>
      <button class="btn btn-outline-primary" onclick="exportSubscribers()">
        <i class="bi bi-download"></i> Export CSV
      </button>
    </div>

    <div class="data-table">
      <div class="p-3 border-bottom">
        <span class="text-muted">${subscribers.length} subscribers</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Subscribed</th>
            </tr>
          </thead>
          <tbody>
            ${subscribers.map(s => `
              <tr>
                <td>${s.email}</td>
                <td>
                  ${s.status === 'active' ?
                    '<span class="badge badge-success-soft">Active</span>' :
                    '<span class="badge bg-secondary">Unsubscribed</span>'}
                </td>
                <td class="text-muted">${new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
            ${subscribers.length === 0 ? `
              <tr>
                <td colspan="3" class="text-center text-muted py-4">No subscribers yet</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>

    <script>
      function exportSubscribers() {
        const rows = [['Email', 'Status', 'Subscribed']];
        ${JSON.stringify(subscribers)}.forEach(s => {
          rows.push([s.email, s.status, s.created_at]);
        });
        const csv = rows.map(r => r.join(',')).join('\\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'subscribers.csv';
        a.click();
      }
    </script>
  `;

  return adminLayout('Subscribers', content);
}

export function adminAIToolsPage(): string {
  const content = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">AI Tools</h1>
    </div>

    <div class="row g-4">
      <div class="col-md-6">
        <div class="data-table">
          <div class="p-3 border-bottom">
            <h5 class="mb-0"><i class="bi bi-magic"></i> AI Description Enrichment</h5>
          </div>
          <div class="p-4">
            <p class="text-muted">Generate AI-powered descriptions for breweries that don't have them yet.</p>
            <button id="enrichBtn" class="btn btn-warning" onclick="runEnrichment()">
              <i class="bi bi-robot"></i> Run Enrichment (5 breweries)
            </button>
            <div id="enrichResult" class="mt-3"></div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="data-table">
          <div class="p-3 border-bottom">
            <h5 class="mb-0"><i class="bi bi-vector-pen"></i> Vectorize Embeddings</h5>
          </div>
          <div class="p-4">
            <p class="text-muted">Update vector embeddings for AI-powered recommendations.</p>
            <button id="vectorBtn" class="btn btn-outline-warning" onclick="runVectorize()">
              <i class="bi bi-diagram-3"></i> Update Embeddings
            </button>
            <div id="vectorResult" class="mt-3"></div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="data-table">
          <div class="p-3 border-bottom">
            <h5 class="mb-0"><i class="bi bi-geo-alt"></i> Geocoding</h5>
          </div>
          <div class="p-4">
            <p class="text-muted">Geocode breweries that are missing latitude/longitude coordinates.</p>
            <button id="geocodeBtn" class="btn btn-outline-warning" onclick="runGeocode()">
              <i class="bi bi-pin-map"></i> Run Geocoding
            </button>
            <div id="geocodeResult" class="mt-3"></div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="data-table">
          <div class="p-3 border-bottom">
            <h5 class="mb-0"><i class="bi bi-arrow-repeat"></i> Cache Management</h5>
          </div>
          <div class="p-4">
            <p class="text-muted">Clear cached data to force fresh content.</p>
            <button id="cacheBtn" class="btn btn-outline-danger" onclick="clearCache()">
              <i class="bi bi-trash"></i> Clear Cache
            </button>
            <div id="cacheResult" class="mt-3"></div>
          </div>
        </div>
      </div>
    </div>

    <script>
      async function runEnrichment() {
        const btn = document.getElementById('enrichBtn');
        const result = document.getElementById('enrichResult');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Running...';

        try {
          const res = await fetch('/api/admin/enrich-descriptions', { method: 'POST' });
          const data = await res.json();
          result.innerHTML = '<div class="alert alert-success">' +
            (data.message || 'Enriched ' + (data.enriched || 0) + ' breweries') + '</div>';
        } catch (err) {
          result.innerHTML = '<div class="alert alert-danger">Error running enrichment</div>';
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-robot"></i> Run Enrichment (5 breweries)';
      }

      async function runVectorize() {
        const btn = document.getElementById('vectorBtn');
        const result = document.getElementById('vectorResult');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Running...';

        try {
          const res = await fetch('/api/admin/update-embeddings', { method: 'POST' });
          const data = await res.json();
          result.innerHTML = '<div class="alert alert-success">' +
            (data.message || 'Updated embeddings') + '</div>';
        } catch (err) {
          result.innerHTML = '<div class="alert alert-danger">Error updating embeddings</div>';
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-diagram-3"></i> Update Embeddings';
      }

      async function runGeocode() {
        const btn = document.getElementById('geocodeBtn');
        const result = document.getElementById('geocodeResult');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Running...';

        try {
          const res = await fetch('/api/admin/geocode', { method: 'POST' });
          const data = await res.json();
          result.innerHTML = '<div class="alert alert-success">' +
            (data.message || 'Geocoded breweries') + '</div>';
        } catch (err) {
          result.innerHTML = '<div class="alert alert-danger">Error running geocoding</div>';
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-pin-map"></i> Run Geocoding';
      }

      async function clearCache() {
        if (!confirm('Clear all cached data?')) return;

        const btn = document.getElementById('cacheBtn');
        const result = document.getElementById('cacheResult');
        btn.disabled = true;

        try {
          const res = await fetch('/api/admin/clear-cache', { method: 'POST' });
          const data = await res.json();
          result.innerHTML = '<div class="alert alert-success">Cache cleared!</div>';
        } catch (err) {
          result.innerHTML = '<div class="alert alert-danger">Error clearing cache</div>';
        }

        btn.disabled = false;
      }
    </script>
  `;

  return adminLayout('AI Tools', content);
}

export function adminReviewsPage(reviews: any[]): string {
  const content = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Reviews</h1>
    </div>

    <div class="data-table">
      <div class="p-3 border-bottom d-flex justify-content-between">
        <span class="text-muted">${reviews.length} reviews</span>
        <select class="form-select form-select-sm" style="width: auto;" id="ratingFilter">
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Brewery</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="reviewsTable">
            ${reviews.map(r => `
              <tr data-rating="${r.rating}">
                <td><a href="/brewery/${r.brewery_id}" target="_blank">Brewery #${r.brewery_id}</a></td>
                <td>
                  <span class="text-warning">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                </td>
                <td>${r.comment ? r.comment.substring(0, 100) + (r.comment.length > 100 ? '...' : '') : '<em class="text-muted">No comment</em>'}</td>
                <td class="text-muted">${new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteReview('${r.id}')">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
            ${reviews.length === 0 ? `
              <tr>
                <td colspan="5" class="text-center text-muted py-4">No reviews yet</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>

    <script>
      document.getElementById('ratingFilter').addEventListener('change', function(e) {
        const rating = e.target.value;
        document.querySelectorAll('#reviewsTable tr').forEach(row => {
          if (!rating || row.dataset.rating === rating) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });

      function deleteReview(id) {
        if (confirm('Delete this review?')) {
          alert('Delete feature coming soon');
        }
      }
    </script>
  `;

  return adminLayout('Reviews', content);
}

export function adminCheckInsPage(checkIns: any[]): string {
  const content = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Check-Ins</h1>
    </div>

    <div class="data-table">
      <div class="p-3 border-bottom">
        <span class="text-muted">${checkIns.length} check-ins</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>User</th>
              <th>Brewery</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${checkIns.map(ci => `
              <tr>
                <td>${ci.user_id.substring(0, 8)}...</td>
                <td><a href="/brewery/${ci.brewery_id}" target="_blank">Brewery #${ci.brewery_id}</a></td>
                <td class="text-muted">${new Date(ci.created_at).toLocaleString()}</td>
              </tr>
            `).join('')}
            ${checkIns.length === 0 ? `
              <tr>
                <td colspan="3" class="text-center text-muted py-4">No check-ins yet</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return adminLayout('Check-Ins', content);
}

export function adminEventsPage(events: any[]): string {
  const content = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Events</h1>
      <button class="btn btn-warning" onclick="addEvent()">
        <i class="bi bi-plus"></i> Add Event
      </button>
    </div>

    <div class="data-table">
      <div class="p-3 border-bottom">
        <span class="text-muted">${events.length} events</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Title</th>
              <th>Brewery</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${events.map(e => `
              <tr>
                <td><strong>${e.title}</strong></td>
                <td><a href="/brewery/${e.brewery_id}" target="_blank">Brewery #${e.brewery_id}</a></td>
                <td>${new Date(e.event_date).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
                </td>
              </tr>
            `).join('')}
            ${events.length === 0 ? `
              <tr>
                <td colspan="4" class="text-center text-muted py-4">No events yet</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>

    <script>
      function addEvent() {
        alert('Add event modal coming soon!');
      }
    </script>
  `;

  return adminLayout('Events', content);
}

export function adminTrailsPage(trails: any[]): string {
  const content = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Trails</h1>
      <button class="btn btn-warning" onclick="addTrail()">
        <i class="bi bi-plus"></i> Add Trail
      </button>
    </div>

    <div class="data-table">
      <div class="p-3 border-bottom">
        <span class="text-muted">${trails.length} trails</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Region</th>
              <th>Breweries</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${trails.map(t => `
              <tr>
                <td><strong>${t.name}</strong></td>
                <td><span class="badge badge-warning-soft">${t.region || '--'}</span></td>
                <td>${JSON.parse(t.brewery_ids || '[]').length} stops</td>
                <td>${t.featured ? '<i class="bi bi-star-fill text-warning"></i>' : '<i class="bi bi-star text-muted"></i>'}</td>
                <td>
                  <a href="/trails/${t.slug}" class="btn btn-sm btn-outline-secondary" target="_blank">
                    <i class="bi bi-eye"></i>
                  </a>
                  <button class="btn btn-sm btn-outline-primary"><i class="bi bi-pencil"></i></button>
                </td>
              </tr>
            `).join('')}
            ${trails.length === 0 ? `
              <tr>
                <td colspan="5" class="text-center text-muted py-4">No trails yet</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>

    <script>
      function addTrail() {
        alert('Add trail modal coming soon!');
      }
    </script>
  `;

  return adminLayout('Trails', content);
}
