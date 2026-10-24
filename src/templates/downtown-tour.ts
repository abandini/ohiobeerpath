// /trails/downtown-cleveland: a code-defined, sourced walking tour (data in src/data/tours/downtown-cleveland.ts).
// Uses the site's own trail styles (assets/css/pages/pages.css: trail-hero, trail-stats, trail-stop).
import { layout } from './layout';
import { escapeAttr as e, jsonLd } from './utils';
import type { SubdomainContext } from '../types';
import { DOWNTOWN_TOUR, GABF_WINDOW, LANDMARKS, ROUTE_FROM_JS, milesBetween, type GabfMedal, type Source, type TourStop } from '../data/tours/downtown-cleveland';

const mi = (n: number) => `${n.toFixed(2)} mi`;
const ICON: Record<GabfMedal['medal'], string> = { Gold: '🥇', Silver: '🥈', Bronze: '🥉' };
// One medal icon per win, gold first, with a spoken summary for screen readers.
export function medalBadges(gabf: GabfMedal[] = []): string {
  if (!gabf.length) return '';
  const n = (m: GabfMedal['medal']) => gabf.filter((x) => x.medal === m).length;
  const icons = (['Gold', 'Silver', 'Bronze'] as const).flatMap((m) => Array(n(m)).fill(ICON[m])).join('');
  const label = `${gabf.length} GABF medal${gabf.length > 1 ? 's' : ''}: ${(['Gold', 'Silver', 'Bronze'] as const).filter((m) => n(m)).map((m) => `${n(m)} ${m.toLowerCase()}`).join(', ')}`;
  return `<span class="gabf-badges" role="img" aria-label="${e(label)}" title="${e(label)}">${icons}</span>`;
}
export function medalList(gabf: GabfMedal[] = []): string {
  if (!gabf.length) return '';
  return `<details class="small mb-2"><summary>GABF medals (${gabf.length})</summary><ul class="mb-1 mt-1">${gabf.map((m) =>
    `<li><span aria-hidden="true">${ICON[m.medal]}</span> ${m.year} ${e(m.medal)}: <strong>${e(m.beer)}</strong>, ${e(m.category)}${/Production/.test(m.entrant) ? ` <span class="text-muted">(entered as ${e(m.entrant)})</span>` : ''} · <a href="${e(m.url)}" rel="noopener" target="_blank">official list</a></li>`).join('')}</ul></details>`;
}
// Rideshare deep links with the stop as the drop-off (Uber universal link; Lyft ride link). Pickup is the rider's location.
const uber = (s: TourStop) => `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${s.lat}&dropoff[longitude]=${s.lon}&dropoff[nickname]=${encodeURIComponent(s.name)}`;
const lyft = (s: TourStop) => `https://lyft.com/ride?id=lyft&destination[latitude]=${s.lat}&destination[longitude]=${s.lon}`;
const mapsSearch = (s: TourStop) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name}, ${s.address}, Cleveland, OH`)}`;
const source = (s: Source) =>
  `<blockquote class="small text-muted border-start ps-2 mb-1">“${e(s.quote)}”</blockquote>` +
  `<div class="small mb-2"><a href="${e(s.url)}" rel="noopener" target="_blank">${e(s.publisher || new URL(s.url).hostname.replace(/^www\./, ''))}</a>, checked ${e(s.checked)}</div>`;

export function downtownTourPage(subdomain?: SubdomainContext): string {
  const t = DOWNTOWN_TOUR, stops = t.stops;
  const legs = stops.slice(1).map((s, i) => milesBetween(stops[i], s));
  const total = legs.reduce((a, b) => a + b, 0);
  const longest = legs.indexOf(Math.max(...legs));
  const ids = stops.filter((s) => s.breweryId).map((s) => s.breweryId);
  const medalStops = stops.filter((s) => s.gabf?.length), medalTotal = medalStops.reduce((n, s) => n + s.gabf!.length, 0);
  const finderData = { stops: stops.map((s) => ({ name: s.name, address: s.address, lat: s.lat, lon: s.lon, medals: s.gabf?.length || 0 })), landmarks: LANDMARKS };
  // Google Maps on mobile browsers accepts at most three waypoints, so the walk opens as segments of up to five stops.
  const place = (s: TourStop) => encodeURIComponent(`${s.address}, Cleveland, OH`);
  const segments: { from: number; to: number; href: string }[] = [];
  for (let a = 0; a < stops.length - 1; a += 4) {
    const b = Math.min(a + 4, stops.length - 1), mid = stops.slice(a + 1, b);
    segments.push({ from: a + 1, to: b + 1, href: `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${place(stops[a])}&destination=${place(stops[b])}${mid.length ? `&waypoints=${mid.map(place).join('%7C')}` : ''}` });
  }
  const baseUrl = subdomain?.baseUrl || 'https://brewerytrip.com';
  const url = `${baseUrl}/trails/${t.slug}`;

  const content = `
  <div class="trail-hero">
    <div class="container">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-3">
          <li class="breadcrumb-item"><a href="/trails" class="text-white-50">Trails</a></li>
          <li class="breadcrumb-item active text-white" aria-current="page">${e(t.title)}</li>
        </ol>
      </nav>
      <h1 style="color: #fff;">${e(t.title)}</h1>
      <p style="opacity: 0.9; max-width: 640px;">${e(t.intro)}</p>
      <div class="trail-stats">
        <div class="trail-stat"><div class="trail-stat-value">${stops.length}</div><div class="trail-stat-label">Breweries</div></div>
        <div class="trail-stat"><div class="trail-stat-value">${total.toFixed(1)} mi</div><div class="trail-stat-label">Straight-line total</div></div>
        <div class="trail-stat"><div class="trail-stat-value">${medalTotal}</div><div class="trail-stat-label">GABF medals since ${GABF_WINDOW.from}</div></div>
      </div>
    </div>
  </div>

  <div class="container my-5">
    <div class="row">
      <div class="col-lg-8">
        <p class="text-muted">The route starts on the east edge of downtown, heads through the Flats, runs up West 25th Street in Ohio City and ends in Hingetown on Detroit Avenue. Hours change, so check each brewery's site before you go.</p>
        <p class="small text-muted"><strong>How we measured:</strong> distances are straight lines between map points (our calculation), using coordinates from our brewery directory and, for Anthology Cask House, OpenStreetMap. Real walking routes are longer.</p>
        <p class="small text-muted"><strong>Rather ride part of it?</strong> The longest straight-line leg is ${e(stops[longest].name)} to ${e(stops[longest + 1].name)} (${mi(legs[longest])}); each stop has Uber and Lyft links that set it as your drop-off.</p>
        <section class="content-card p-3 mb-4" aria-labelledby="finder-h">
          <h2 class="h4" id="finder-h"><i class="bi bi-crosshair" aria-hidden="true"></i> Where are you starting from?</h2>
          <p class="small text-muted mb-2">We'll find your closest stop, the closest stop with a GABF medal since ${GABF_WINDOW.from}, and a suggested order for the rest. We calculate in your browser and don't send your location to our server; opening walking directions shares your starting point with Google Maps. Landmark locations: <a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">© OpenStreetMap contributors</a>.</p>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <button type="button" class="btn btn-warning" id="finder-locate"><i class="bi bi-geo" aria-hidden="true"></i> Use my location</button>
            <label class="visually-hidden" for="finder-from">Or pick a starting point</label>
            <select id="finder-from" class="form-select w-auto">
              <option value="">…or start from</option>
              ${LANDMARKS.map((l, i) => `<option value="l${i}">${e(l.name)}</option>`).join('')}
              ${stops.map((s, i) => `<option value="s${i}">${e(s.name)}</option>`).join('')}
            </select>
          </div>
          <p id="finder-status" class="small mt-2 mb-0" role="status" aria-live="polite"></p>
          <div id="finder-out" class="mt-2"></div>
          <noscript><p class="small mt-2">Turn on JavaScript to use the finder, or follow the stops below in order.</p></noscript>
        </section>

        <section class="mb-4" aria-labelledby="gabf-h">
          <h2 class="h4" id="gabf-h"><span aria-hidden="true">🏅</span> GABF medals on this walk</h2>
          <p class="small text-muted mb-2">${medalTotal} Great American Beer Festival medals at ${medalStops.length} stops, from the official winners lists for ${GABF_WINDOW.from}–${GABF_WINDOW.to} (<a href="${e(GABF_WINDOW.index)}" rel="noopener" target="_blank">past winners</a>). Older medals aren't counted here.</p>
          <ul class="list-unstyled small mb-0">${medalStops.map((s) => `<li class="mb-1">${medalBadges(s.gabf)} <a href="#stop-${stops.indexOf(s) + 1}">${e(s.name)}</a>: ${s.gabf!.length}</li>`).join('')}</ul>
        </section>

        <h2 class="h3 mb-4 mt-4"><i class="bi bi-geo-alt" aria-hidden="true"></i> The stops</h2>
        ${stops.map((s, i) => `
          ${i > 0 ? `<p class="small text-muted ms-5 mb-2"><i class="bi bi-arrow-down"></i> ${mi(legs[i - 1])} straight-line</p>` : ''}
          <div class="trail-stop" id="stop-${i + 1}">
            <div class="stop-number">${i + 1}</div>
            <div class="stop-info">
              <h3 class="h4">${s.breweryId ? `<a href="/brewery/${s.breweryId}" class="text-dark">${e(s.name)}</a>` : e(s.name)} ${medalBadges(s.gabf)}</h3>
              <p class="stop-meta mb-1">${s.neighborhood ? `${e(s.neighborhood)} · ` : ''}<i class="bi bi-geo-alt" aria-hidden="true"></i> ${e(s.address)}, Cleveland</p>
              <p class="mb-1">${e(s.note)}</p>
              <p class="small mb-2"><a href="${e(mapsSearch(s))}" rel="noopener" target="_blank">Map</a> · Ride here: <a href="${e(uber(s))}" rel="noopener" target="_blank">Uber</a> / <a href="${e(lyft(s))}" rel="noopener" target="_blank">Lyft</a>${s.website ? ` · <a href="${e(s.website)}" rel="noopener" target="_blank">Website and hours</a>` : ''}</p>
              ${medalList(s.gabf)}
              <details class="small"><summary>Sources</summary>${source(s.addressSource)}${source(s.noteSource)}</details>
            </div>
          </div>`).join('')}

        <h2 class="h3 mb-3 mt-5">Also within reach</h2>
        <ul>
          ${t.nearby.map((n) => `<li><a href="/brewery/${n.breweryId}">${e(n.name)}</a>, ${e(n.address)} <details class="small d-inline"><summary>Source</summary>${source(n.source)}</details></li>`).join('')}
        </ul>
      </div>

      <div class="col-lg-4">
        <div class="sticky-top" style="top: 100px;">
          <div class="card">
            <div class="card-body text-center">
              <h2 class="h5 card-title">Walk it</h2>
              <p class="text-muted small">Walking directions in ${segments.length} parts, a ride link at every stop, or add the stops to your tour.</p>
              ${segments.map((g) => `<a class="start-tour-btn w-100 d-block text-decoration-none mb-2" href="${e(g.href)}" rel="noopener" target="_blank"><i class="bi bi-map" aria-hidden="true"></i> Stops ${g.from}–${g.to}</a>`).join('')}
              <button class="btn btn-outline-secondary w-100" onclick="addDowntownTour([${ids.join(',')}])"><i class="bi bi-plus-circle" aria-hidden="true"></i> Add to my tour</button>
              <p class="small mt-2 mb-0" role="status" aria-live="polite" id="downtown-tour-status"></p>
              <p class="small text-muted mt-3 mb-0">Anthology Cask House isn't in our brewery directory yet, so it isn't added to your tour.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    function addDowntownTour(ids) {
      var status = document.getElementById('downtown-tour-status'), tour = [];
      try { tour = JSON.parse(localStorage.getItem('brewery_tour') || '[]'); if (!Array.isArray(tour)) tour = []; } catch (e) { tour = []; }
      var added = 0;
      ids.forEach(function (id) { if (tour.indexOf(id) < 0) { tour.push(id); added++; } });
      try { localStorage.setItem('brewery_tour', JSON.stringify(tour)); } catch (e) { status.textContent = 'Your browser blocked saving the tour.'; return; }
      if (typeof updateTourBadge === 'function') updateTourBadge();
      status.textContent = added ? 'Added ' + added + ' breweries to your tour.' : 'These breweries are already in your tour.';
    }
  </script>
  <script>
    (function () {
      var D = ${jsonLd(finderData)};
      ${ROUTE_FROM_JS}
      var out = document.getElementById('finder-out'), status = document.getElementById('finder-status'), btn = document.getElementById('finder-locate'), gen = 0;
      function miles(a, b) { var R = 3958.8, r = function (d) { return d * Math.PI / 180; };
        var h = Math.pow(Math.sin(r(b.lat - a.lat) / 2), 2) + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.pow(Math.sin(r(b.lon - a.lon) / 2), 2);
        return 2 * R * Math.asin(Math.sqrt(h)); }
      function el(tag, text, cls) { var n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
      function link(text, href) { var a = el('a', text); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a; }
      function walk(from, to) { return 'https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=' + from.lat + ',' + from.lon + '&destination=' + encodeURIComponent(to.address + ', Cleveland, OH'); }
      function line(label, s, start, extra) { var p = el('p', null, 'mb-1'); p.appendChild(el('strong', label + ' ')); p.appendChild(document.createTextNode(s.name + extra + ', ' + miles(start, s).toFixed(2) + ' mi straight-line · ')); p.appendChild(link('walking directions', walk(start, s))); return p; }
      function show(start, label, note) {
        var order = routeFrom(start, D.stops), first = D.stops[order[0]];
        var winners = D.stops.filter(function (s) { return s.medals; }).sort(function (a, b) { return miles(start, a) - miles(start, b); }), w = winners[0];
        var plural = function (n) { return n + ' GABF medal' + (n > 1 ? 's' : ''); };
        out.textContent = '';
        out.appendChild(line('Closest stop:', first, start, first.medals ? ' (' + plural(first.medals) + ' since ${GABF_WINDOW.from})' : ''));
        if (w && w !== first) out.appendChild(line('Closest GABF medal winner:', w, start, ' (' + plural(w.medals) + ' since ${GABF_WINDOW.from})'));
        if (note) out.appendChild(el('p', note, 'small text-muted mb-1'));
        out.appendChild(el('p', 'From ' + label + ', a suggested stop order based on straight-line distances (not necessarily the shortest walking route):', 'mb-1 small text-muted'));
        var ol = el('ol', null, 'small mb-0'); order.forEach(function (i) { ol.appendChild(el('li', D.stops[i].name)); }); out.appendChild(ol);
        status.textContent = 'Closest stop: ' + first.name + '.';
      }
      btn.addEventListener('click', function () {
        if (!navigator.geolocation) { status.textContent = 'Your browser does not share location. Pick a starting point instead.'; return; }
        var mine = ++gen; btn.disabled = true; status.textContent = 'Finding you…';
        navigator.geolocation.getCurrentPosition(function (p) {
          btn.disabled = false; if (mine !== gen) return;
          var acc = p.coords.accuracy, note = acc > 300 ? 'Your location is approximate (about ' + Math.round(acc) + ' m), so nearby stops may be in a different order.' : '';
          show({ lat: p.coords.latitude, lon: p.coords.longitude }, 'your location', note);
        }, function (err) {
          btn.disabled = false; if (mine !== gen) return;
          status.textContent = err && err.code === 1 ? 'Location permission was denied. Pick a starting point instead.' : err && err.code === 3 ? 'Finding your location took too long. Try again or pick a starting point.' : 'Your location is unavailable right now. Pick a starting point instead.';
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
      });
      document.getElementById('finder-from').addEventListener('change', function (ev) {
        var v = ev.target.value; if (!v) return; gen++; btn.disabled = false;
        var p = v[0] === 'l' ? D.landmarks[+v.slice(1)] : D.stops[+v.slice(1)];
        show({ lat: p.lat, lon: p.lon }, p.name, '');
      });
    })();
  </script>
  <script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org', '@type': 'ItemList', name: t.title, url,
    itemListElement: stops.map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: {
      '@type': 'Brewery', name: s.name, url: s.website || undefined,
      award: s.gabf?.length ? s.gabf.map((m) => `GABF ${m.year} ${m.medal}: ${m.beer} (${m.category})${/Production/.test(m.entrant) ? `, entered as ${m.entrant}` : ''}`) : undefined,
      address: { '@type': 'PostalAddress', streetAddress: s.address, addressLocality: 'Cleveland', addressRegion: 'OH', addressCountry: 'US' },
    } })),
  })}</script>`;

  return layout(t.title, content, {
    description: `A ${stops.length}-stop brewery walk from downtown Cleveland through the Flats to Ohio City: Noble Beast, Masthead, Forest City, Market Garden, Nano Brew, Anthology Cask House, Saucy and more, with sources.`,
    url,
    subdomain,
  });
}
