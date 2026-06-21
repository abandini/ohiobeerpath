import type { SubdomainContext } from '../types';
import { layout } from './layout';

export function planPage(subdomain?: SubdomainContext): string {
  const content = `
    <section class="py-5" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
      <div class="container text-center">
        <h1 class="display-4 text-white fw-bold mb-3">Plan Your Brewery Road Trip</h1>
        <p class="lead text-white-50 mb-4">AI-powered route planning for the perfect craft beer crawl</p>

        <div class="card mx-auto" style="max-width: 600px;">
          <div class="card-body p-4">
            <form id="plan-form">
              <div class="mb-3">
                <label for="starting-city" class="form-label fw-semibold">Starting City</label>
                <input type="text" class="form-control form-control-lg" id="starting-city" placeholder="e.g. Columbus, OH" required>
              </div>
              <div class="mb-3">
                <label for="time-budget" class="form-label fw-semibold">Time Budget</label>
                <select class="form-select form-select-lg" id="time-budget">
                  <option value="120">2 hours</option>
                  <option value="240" selected>Half day (4 hours)</option>
                  <option value="360">6 hours</option>
                  <option value="480">Full day (8 hours)</option>
                  <option value="720">Weekend trip (12 hours)</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Preferences</label>
                <div class="d-flex flex-wrap gap-2" id="pref-chips">
                  <button type="button" class="btn btn-outline-warning btn-sm pref-chip" data-pref="dog-friendly">
                    <i class="bi bi-heart"></i> Dog Friendly
                  </button>
                  <button type="button" class="btn btn-outline-warning btn-sm pref-chip" data-pref="food">
                    <i class="bi bi-egg-fried"></i> Great Food
                  </button>
                  <button type="button" class="btn btn-outline-warning btn-sm pref-chip" data-pref="outdoor">
                    <i class="bi bi-tree"></i> Outdoor Seating
                  </button>
                  <button type="button" class="btn btn-outline-warning btn-sm pref-chip" data-pref="live-music">
                    <i class="bi bi-music-note-beamed"></i> Live Music
                  </button>
                  <button type="button" class="btn btn-outline-warning btn-sm pref-chip" data-pref="tours">
                    <i class="bi bi-binoculars"></i> Brewery Tours
                  </button>
                </div>
              </div>
              <button type="submit" class="btn btn-warning btn-lg w-100 fw-bold">
                <i class="bi bi-magic"></i> Generate My Route
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <div id="loading-indicator" class="text-center py-5 d-none">
      <div class="spinner-border text-warning" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted" id="loading-status">Finding the best breweries near you...</p>
    </div>

    <section id="plan-results" class="py-4 d-none">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-5">
            <div class="card">
              <div class="card-body">
                <h2 class="h4 fw-bold" id="route-title">Your Brewery Route</h2>
                <p class="text-muted" id="route-summary"></p>
                <div id="stops-list"></div>
                <div class="d-flex gap-2 mt-3">
                  <button class="btn btn-warning btn-sm" id="share-btn">
                    <i class="bi bi-share"></i> Share
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" id="export-btn">
                    <i class="bi bi-google"></i> Google Maps
                  </button>
                </div>
              </div>
            </div>
            <div class="card mt-3">
              <div class="card-body">
                <label for="refine-input" class="form-label fw-semibold">Refine Your Route</label>
                <div class="input-group">
                  <input type="text" class="form-control" id="refine-input" placeholder="e.g. add a dog-friendly stop...">
                  <button class="btn btn-warning" id="refine-btn" type="button">
                    <i class="bi bi-chat-dots"></i> Refine
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-7">
            <div id="map-container" style="height: 500px; border-radius: 12px; overflow: hidden;"></div>
          </div>
        </div>
      </div>
    </section>

    <script>
    (function() {
      var selectedPrefs = [];
      var currentTrip = null;
      var map = null;

      document.querySelectorAll('.pref-chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
          var pref = this.dataset.pref;
          var idx = selectedPrefs.indexOf(pref);
          if (idx > -1) {
            selectedPrefs.splice(idx, 1);
            this.classList.remove('btn-warning');
            this.classList.add('btn-outline-warning');
          } else {
            selectedPrefs.push(pref);
            this.classList.remove('btn-outline-warning');
            this.classList.add('btn-warning');
          }
        });
      });

      async function geocodeCity(city) {
        try {
          var resp = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(city) + '&limit=1');
          var data = await resp.json();
          if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        } catch (e) { console.error('Geocode error:', e); }
        return null;
      }

      function createStopElement(stop, index, isLast) {
        var el = document.createElement('div');
        el.className = 'stop-card d-flex align-items-start gap-3 py-3' + (isLast ? '' : ' border-bottom');
        var numDiv = document.createElement('div');
        numDiv.className = 'rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center flex-shrink-0';
        numDiv.style.cssText = 'width: 32px; height: 32px; font-size: 14px;';
        numDiv.textContent = String(index + 1);
        var infoDiv = document.createElement('div');
        infoDiv.className = 'flex-grow-1';
        if (stop.drive_minutes_from_prev > 0) {
          var driveEl = document.createElement('div');
          driveEl.className = 'text-muted small';
          driveEl.textContent = Math.round(stop.drive_minutes_from_prev) + ' min drive (' + Math.round(stop.drive_miles_from_prev) + ' mi)';
          infoDiv.appendChild(driveEl);
        }
        var nameEl = document.createElement('strong');
        nameEl.textContent = stop.name;
        infoDiv.appendChild(nameEl);
        var cityEl = document.createElement('div');
        cityEl.className = 'text-muted small';
        cityEl.textContent = stop.city + ', ' + stop.state;
        infoDiv.appendChild(cityEl);
        if (stop.description) {
          var descEl = document.createElement('div');
          descEl.className = 'small text-secondary mt-1';
          descEl.textContent = stop.description;
          infoDiv.appendChild(descEl);
        }
        if (stop.amenities && stop.amenities.length > 0) {
          var badgeDiv = document.createElement('div');
          badgeDiv.className = 'mt-1';
          stop.amenities.forEach(function(a) {
            var badge = document.createElement('span');
            badge.className = 'badge bg-light text-dark me-1';
            badge.textContent = a;
            badgeDiv.appendChild(badge);
          });
          infoDiv.appendChild(badgeDiv);
        }
        var timeDiv = document.createElement('div');
        timeDiv.className = 'text-muted small flex-shrink-0';
        timeDiv.textContent = stop.stop_duration_minutes + ' min';
        el.appendChild(numDiv);
        el.appendChild(infoDiv);
        el.appendChild(timeDiv);
        return el;
      }

      function clearElement(el) {
        while (el.firstChild) el.removeChild(el.firstChild);
      }

      function renderRoute(trip) {
        currentTrip = trip;
        var route = trip.route_json || trip.route;
        document.getElementById('route-title').textContent = trip.title || 'Your Brewery Route';
        var totalTime = (route.total_drive_minutes || 0) + (route.total_brewery_time_minutes || 0);
        var hours = Math.floor(totalTime / 60);
        var mins = totalTime % 60;
        document.getElementById('route-summary').textContent = route.stops.length + ' stops | ' + Math.round(route.total_drive_miles || 0) + ' miles | ' + (hours > 0 ? hours + 'h ' : '') + mins + 'm total';
        var stopsList = document.getElementById('stops-list');
        clearElement(stopsList);
        route.stops.forEach(function(stop, i) {
          stopsList.appendChild(createStopElement(stop, i, i === route.stops.length - 1));
        });
        document.getElementById('loading-indicator').classList.add('d-none');
        document.getElementById('plan-results').classList.remove('d-none');
        renderMap(route.stops);
      }

      function renderMap(stops) {
        if (map) { map.remove(); }
        if (!stops || stops.length === 0) return;
        map = L.map('map-container').setView([stops[0].latitude, stops[0].longitude], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors', maxZoom: 18
        }).addTo(map);
        var coords = [];
        stops.forEach(function(stop, i) {
          var markerHtml = document.createElement('div');
          markerHtml.style.cssText = 'background:#d97706;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);';
          markerHtml.textContent = String(i + 1);
          var marker = L.marker([stop.latitude, stop.longitude], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: markerHtml.outerHTML,
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
          coords.push([stop.latitude, stop.longitude]);
        });
        if (coords.length > 1) {
          L.polyline(coords, { color: '#d97706', weight: 3, opacity: 0.7, dashArray: '10, 5' }).addTo(map);
        }
        map.fitBounds(coords, { padding: [30, 30] });
      }

      document.getElementById('plan-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        var city = document.getElementById('starting-city').value.trim();
        var budget = parseInt(document.getElementById('time-budget').value);
        if (!city) return;
        document.getElementById('loading-indicator').classList.remove('d-none');
        document.getElementById('plan-results').classList.add('d-none');
        document.getElementById('loading-status').textContent = 'Finding breweries near ' + city + '...';
        var coords = await geocodeCity(city);
        document.getElementById('loading-status').textContent = 'Planning your route...';
        try {
          var resp = await fetch('/api/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              starting_city: city,
              starting_lat: coords ? coords.lat : undefined,
              starting_lng: coords ? coords.lng : undefined,
              time_budget_minutes: budget,
              preferences: selectedPrefs
            })
          });
          var data = await resp.json();
          if (data.success && data.trip) {
            renderRoute(data.trip);
          } else {
            document.getElementById('loading-indicator').classList.add('d-none');
            alert(data.error || 'Failed to generate route. Please try again.');
          }
        } catch (err) {
          document.getElementById('loading-indicator').classList.add('d-none');
          alert('Error generating route. Please try again.');
          console.error(err);
        }
      });

      document.getElementById('refine-btn').addEventListener('click', async function() {
        var msg = document.getElementById('refine-input').value.trim();
        if (!msg || !currentTrip) return;
        var btn = this;
        btn.disabled = true;
        btn.textContent = 'Refining...';
        try {
          var resp = await fetch('/api/plan/refine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trip_slug: currentTrip.slug, message: msg })
          });
          var data = await resp.json();
          if (data.success && data.trip) {
            renderRoute(data.trip);
            document.getElementById('refine-input').value = '';
          } else { alert(data.error || 'Could not refine route.'); }
        } catch (err) { alert('Error refining route.'); console.error(err); }
        btn.disabled = false;
        btn.textContent = 'Refine';
      });

      document.getElementById('share-btn').addEventListener('click', async function() {
        if (!currentTrip) return;
        var url = window.location.origin + '/trip/' + currentTrip.slug;
        if (navigator.share) {
          try { await navigator.share({ title: currentTrip.title, url: url }); } catch (e) {}
        } else {
          await navigator.clipboard.writeText(url);
          alert('Link copied to clipboard!');
        }
      });

      document.getElementById('export-btn').addEventListener('click', function() {
        if (!currentTrip) return;
        var stops = currentTrip.route_json ? currentTrip.route_json.stops : [];
        if (stops.length === 0) return;
        var waypoints = stops.map(function(s) { return s.latitude + ',' + s.longitude; }).join('/');
        window.open('https://www.google.com/maps/dir/' + waypoints, '_blank');
      });
    })();
    </script>
  `;

  return layout('Plan Your Brewery Road Trip', content, {
    subdomain,
    description: 'Plan your perfect brewery road trip with AI. Get optimized routes, drive times, and personalized recommendations.',
    extraCss: ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'],
    extraJs: ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'],
  });
}
