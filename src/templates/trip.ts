import type { TripPlan, SubdomainContext } from '../types';
import { layout } from './layout';

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function tripPage(trip: TripPlan, subdomain?: SubdomainContext): string {
  const route = trip.route_json;
  const totalTime = (route.total_drive_minutes || 0) + (route.total_brewery_time_minutes || 0);
  const hours = Math.floor(totalTime / 60);
  const mins = totalTime % 60;

  const stopsHtml = route.stops.map((stop, i) => `
    <div class="d-flex align-items-start gap-3 py-3 ${i < route.stops.length - 1 ? 'border-bottom' : ''}">
      <div class="rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center flex-shrink-0" style="width: 32px; height: 32px; font-size: 14px;">
        ${i + 1}
      </div>
      <div class="flex-grow-1">
        ${stop.drive_minutes_from_prev > 0 ? `<div class="text-muted small"><i class="bi bi-car-front"></i> ${Math.round(stop.drive_minutes_from_prev)} min drive (${Math.round(stop.drive_miles_from_prev)} mi)</div>` : ''}
        <strong>${escapeHtml(stop.name)}</strong>
        <div class="text-muted small">${escapeHtml(stop.city)}, ${escapeHtml(stop.state)}</div>
        ${stop.description ? `<div class="small text-secondary mt-1">${escapeHtml(stop.description)}</div>` : ''}
        ${stop.amenities && stop.amenities.length > 0 ? `
          <div class="mt-1">
            ${stop.amenities.map(a => `<span class="badge bg-light text-dark me-1">${escapeHtml(a)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
      <div class="text-muted small flex-shrink-0">${stop.stop_duration_minutes} min</div>
    </div>
  `).join('');

  const stopsJson = JSON.stringify(route.stops.map(s => ({
    lat: s.latitude, lng: s.longitude, name: s.name, city: s.city, state: s.state,
  })));

  const content = `
    <section class="py-5" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
      <div class="container text-center">
        <h1 class="display-5 text-white fw-bold mb-2">${escapeHtml(trip.title)}</h1>
        <p class="lead text-white-50">
          ${route.stops.length} stops | ${Math.round(route.total_drive_miles || 0)} miles | ${hours > 0 ? hours + 'h ' : ''}${mins}m total
        </p>
        <div class="d-flex gap-2 justify-content-center">
          <button class="btn btn-warning btn-sm" id="share-btn"><i class="bi bi-share"></i> Share Trip</button>
          <button class="btn btn-outline-light btn-sm" id="export-btn"><i class="bi bi-google"></i> Open in Google Maps</button>
        </div>
      </div>
    </section>

    <section class="py-4">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-5">
            <div class="card">
              <div class="card-body">
                <h2 class="h5 fw-bold mb-3">Route Stops</h2>
                ${stopsHtml}
              </div>
            </div>
          </div>
          <div class="col-lg-7">
            <div id="map-container" style="height: 400px; border-radius: 12px; overflow: hidden;"></div>
            <div class="card mt-3">
              <div class="card-body">
                <h3 class="h6 fw-bold">Trip Details</h3>
                <div class="row text-center">
                  <div class="col-4">
                    <div class="h4 text-warning fw-bold mb-0">${route.stops.length}</div>
                    <small class="text-muted">Breweries</small>
                  </div>
                  <div class="col-4">
                    <div class="h4 text-warning fw-bold mb-0">${Math.round(route.total_drive_miles || 0)}</div>
                    <small class="text-muted">Miles</small>
                  </div>
                  <div class="col-4">
                    <div class="h4 text-warning fw-bold mb-0">${hours > 0 ? hours + 'h' : ''}${mins}m</div>
                    <small class="text-muted">Total Time</small>
                  </div>
                </div>
              </div>
            </div>
            <div class="text-center mt-4">
              <a href="/plan?from=${encodeURIComponent(trip.starting_city)}&budget=${trip.time_budget_minutes}" class="btn btn-warning btn-lg">
                <i class="bi bi-magic"></i> Plan a Similar Trip
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <script>
    (function() {
      var stops = ${stopsJson};
      if (stops.length > 0 && typeof L !== 'undefined') {
        var map = L.map('map-container').setView([stops[0].lat, stops[0].lng], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors', maxZoom: 18
        }).addTo(map);
        var coords = [];
        stops.forEach(function(stop, i) {
          var marker = L.marker([stop.lat, stop.lng], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: '<div style="background:#d97706;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);">' + (i + 1) + '</div>',
              iconSize: [28, 28], iconAnchor: [14, 14]
            })
          }).addTo(map);
          var popup = document.createElement('div');
          var title = document.createElement('strong');
          title.textContent = stop.name;
          var city = document.createElement('div');
          city.textContent = stop.city + ', ' + stop.state;
          popup.appendChild(title);
          popup.appendChild(city);
          marker.bindPopup(popup);
          coords.push([stop.lat, stop.lng]);
        });
        if (coords.length > 1) {
          L.polyline(coords, { color: '#d97706', weight: 3, opacity: 0.7, dashArray: '10, 5' }).addTo(map);
        }
        map.fitBounds(coords, { padding: [30, 30] });
      }
      document.getElementById('share-btn').addEventListener('click', async function() {
        var url = window.location.href;
        if (navigator.share) {
          try { await navigator.share({ title: document.title, url: url }); } catch(e) {}
        } else {
          await navigator.clipboard.writeText(url);
          alert('Link copied to clipboard!');
        }
      });
      document.getElementById('export-btn').addEventListener('click', function() {
        if (stops.length === 0) return;
        var waypoints = stops.map(function(s) { return s.lat + ',' + s.lng; }).join('/');
        window.open('https://www.google.com/maps/dir/' + waypoints, '_blank');
      });
    })();
    </script>
  `;

  const baseUrl = subdomain?.baseUrl || 'https://brewerytrip.com';

  return layout(escapeHtml(trip.title), content, {
    subdomain,
    description: trip.title + ' - ' + route.stops.length + ' brewery stops, ' + Math.round(route.total_drive_miles || 0) + ' miles. Plan your own trip at brewerytrip.com',
    url: baseUrl + '/trip/' + trip.slug,
    extraCss: ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'],
    extraJs: ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'],
  });
}
