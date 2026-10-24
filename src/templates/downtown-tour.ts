// /trails/downtown-cleveland: a code-defined, sourced walking tour (data in src/data/tours/downtown-cleveland.ts).
// Uses the site's own trail styles (assets/css/pages/pages.css: trail-hero, trail-stats, trail-stop).
import { layout } from './layout';
import { escapeAttr as e, jsonLd } from './utils';
import type { SubdomainContext } from '../types';
import { DOWNTOWN_TOUR, milesBetween, type Source, type TourStop } from '../data/tours/downtown-cleveland';

const mi = (n: number) => `${n.toFixed(2)} mi`;
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
      </div>
    </div>
  </div>

  <div class="container my-5">
    <div class="row">
      <div class="col-lg-8">
        <p class="text-muted">The route starts on the east edge of downtown, heads through the Flats, runs up West 25th Street in Ohio City and ends in Hingetown on Detroit Avenue. Hours change, so check each brewery's site before you go.</p>
        <p class="small text-muted"><strong>How we measured:</strong> distances are straight lines between map points (our calculation), using coordinates from our brewery directory and, for Anthology Cask House, OpenStreetMap. Real walking routes are longer.</p>
        <p class="small text-muted"><strong>Rather ride part of it?</strong> The longest straight-line leg is ${e(stops[longest].name)} to ${e(stops[longest + 1].name)} (${mi(legs[longest])}); each stop has Uber and Lyft links that set it as your drop-off.</p>
        <h2 class="h3 mb-4 mt-4"><i class="bi bi-geo-alt" aria-hidden="true"></i> The stops</h2>
        ${stops.map((s, i) => `
          ${i > 0 ? `<p class="small text-muted ms-5 mb-2"><i class="bi bi-arrow-down"></i> ${mi(legs[i - 1])} straight-line</p>` : ''}
          <div class="trail-stop">
            <div class="stop-number">${i + 1}</div>
            <div class="stop-info">
              <h3 class="h4">${s.breweryId ? `<a href="/brewery/${s.breweryId}" class="text-dark">${e(s.name)}</a>` : e(s.name)}</h3>
              <p class="stop-meta mb-1">${s.neighborhood ? `${e(s.neighborhood)} · ` : ''}<i class="bi bi-geo-alt" aria-hidden="true"></i> ${e(s.address)}, Cleveland</p>
              <p class="mb-1">${e(s.note)}</p>
              <p class="small mb-2"><a href="${e(mapsSearch(s))}" rel="noopener" target="_blank">Map</a> · Ride here: <a href="${e(uber(s))}" rel="noopener" target="_blank">Uber</a> / <a href="${e(lyft(s))}" rel="noopener" target="_blank">Lyft</a>${s.website ? ` · <a href="${e(s.website)}" rel="noopener" target="_blank">Website and hours</a>` : ''}</p>
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
  <script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org', '@type': 'ItemList', name: t.title, url,
    itemListElement: stops.map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: {
      '@type': 'Brewery', name: s.name, url: s.website || undefined,
      address: { '@type': 'PostalAddress', streetAddress: s.address, addressLocality: 'Cleveland', addressRegion: 'OH', addressCountry: 'US' },
    } })),
  })}</script>`;

  return layout(t.title, content, {
    description: `A ${stops.length}-stop brewery walk from downtown Cleveland through the Flats to Ohio City: Noble Beast, Masthead, Forest City, Market Garden, Nano Brew, Anthology Cask House, Saucy and more, with sources.`,
    url,
    subdomain,
  });
}
