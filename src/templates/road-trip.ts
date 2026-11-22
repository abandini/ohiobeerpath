// /roads and /roads/<slug>: single-road brewery trips. Data: src/data/roads/ (hand-written config + built stops);
// maths and the "what may be shown" gate: src/lib/road-trip.ts. Styles are scoped here on purpose: CSS under assets/
// is served from R2 with a one-year cache and is not uploaded by CI.
//
// Wording rules for this file (pre-launch review, 2026-11-22). The page never says "driving order", "detour" or "on
// the road": stops are ordered by their nearest point along our mapped line and distances are straight-line. It never
// says a brewery "is open": it says what a dated source showed, and tells the reader to check. It never implies every
// nearby brewery was reviewed: it gives the count we reached a decision on.
import { layout } from './layout';
import { escapeAttr, escapeHtml as h, hostOf, jsonLd, safeHttpUrl } from './utils';
import { tapListDate } from './taplist';
import { medalsFor } from '../data/medals';
import { DOWNTOWN_TOUR, GABF_WINDOW } from '../data/tours/downtown-cleveland';
import { DEFAULT_STALE_AFTER_DAYS } from '../services/taplist';
import type { SubdomainContext } from '../types';
import { safeSitePath, type LatLon, type LegView, type RoadView, type StopView } from '../lib/road-trip';

// A road crosses state lines, so its one canonical home is the national site, whichever host served the page.
const SITE = 'https://brewerytrip.com';
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';
const OSM_LINK = `<a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">${OSM_ATTRIBUTION}</a>`;
/** The driving instruction, word for word the same wherever it appears. */
export const DRIVING_NOTICE = 'If you drink, do not drive. Arrange a driver who will not drink, or other transport, before you set out. This is a list of places, not a drinking itinerary.';
const DRIVING_SHORT = 'If you drink, do not drive: arrange a driver who will not drink, or other transport.';
const a = escapeAttr;
const ext = (url: string, text: string) => `<a href="${a(url)}" rel="noopener" target="_blank">${h(text)}</a>`;
const mi = (n: number) => n.toFixed(1);
const place = (s: string) => s.split(',')[0].trim();
const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

export interface RoadPageOptions {
  subdomain?: SubdomainContext;
  /** Brewery ids with a current tap list and when it was updated (one cached lookup for the whole page; omit when it failed). */
  tapLists?: Map<number, string | null> | null;
  now?: number;
}

const STYLE = `<style>
  .rt{--rt-line:var(--bt-line,#e2d5bf);--rt-muted:var(--bt-muted,#6b5546);--rt-ink:var(--bt-ink,#241a14);--rt-card:var(--bt-foam,#fffaf1);--rt-accent:var(--bt-brick,#9e3b26);--rt-road:var(--bt-stout,#2a1d17);--rt-dot:var(--bt-malt,#d39a3e);color:var(--rt-ink);overflow-wrap:anywhere}
  .rt-wrap{max-width:46rem}
  .rt h2{margin:2.5rem 0 .35rem}
  .rt h3{margin:2rem 0 .25rem;font-size:1.25rem}
  .rt h4{margin:0 0 .15rem;font-size:1.1rem;line-height:1.25}
  .rt-sub{color:var(--rt-muted);margin:0 0 .9rem}
  .rt-driver{border-left:4px solid var(--rt-accent);background:var(--rt-card);padding:.8rem 1rem;margin:0 0 1.25rem}
  .rt-driver p{margin:0}
  .rt-jump{display:flex;flex-wrap:wrap;gap:.5rem;list-style:none;margin:.5rem 0 0;padding:0}
  .rt-jump a{display:inline-block;padding:.75rem .9rem;border:1px solid var(--rt-line);border-radius:999px;background:var(--rt-card);color:var(--rt-ink);text-decoration:none;line-height:1.2}
  .rt-jump a:hover,.rt-jump a:focus-visible{border-color:var(--rt-accent);text-decoration:underline}
  .rt a:focus-visible{outline:3px solid var(--rt-accent);outline-offset:2px}
  .rt-map{margin:.75rem 0 1rem;max-width:38rem}
  .rt-map svg{display:block;width:100%;height:auto;background:var(--rt-card);border:1px solid var(--rt-line);border-radius:8px}
  .rt-map figcaption{font-size:.85rem;color:var(--rt-muted);margin-top:.35rem}
  .rt-map .road{fill:none;stroke:var(--rt-road);stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round}
  .rt-map .dot{fill:var(--rt-dot);stroke:var(--rt-road);stroke-width:1.1}
  .rt-map .end{fill:var(--rt-road)}
  .rt-map text{font:600 10px system-ui,sans-serif;fill:var(--rt-ink);paint-order:stroke;stroke:var(--rt-card);stroke-width:3px;stroke-linejoin:round}
  .rt-map text.town{font-weight:400}
  .rt-stops{list-style:none;margin:.75rem 0 0;padding:0}
  .rt-stop{display:grid;grid-template-columns:4.1rem minmax(0,1fr);gap:.75rem;padding:1rem 0;border-top:1px solid var(--rt-line)}
  .rt-mile{text-align:center;align-self:start;background:var(--rt-road);color:#fff;border-radius:8px;padding:.45rem .2rem;line-height:1.1}
  .rt-mile b{display:block;font-size:1.3rem;font-variant-numeric:tabular-nums}
  .rt-mile span{font-size:.72rem;letter-spacing:.04em;text-transform:uppercase}
  .rt-stop p{margin:0 0 .35rem}
  .rt-stop p.rt-why{margin:.5rem 0 0}
  .rt-where{color:var(--rt-muted)}
  .rt-dist{display:inline-block;font-size:.85rem;font-weight:600;border:1px solid var(--rt-line);border-radius:4px;padding:.05rem .4rem;background:var(--rt-card);color:var(--rt-ink)}
  .rt-marks{display:flex;flex-wrap:wrap;gap:0 1rem;font-size:.92rem}
  .rt-marks a{display:inline-block;padding:.7rem 0}
  .rt-stop blockquote{margin:.5rem 0 .2rem;padding-left:.75rem;border-left:3px solid var(--rt-line);color:var(--rt-ink)}
  .rt-src{font-size:.88rem;color:var(--rt-muted)}
  .rt-links{display:flex;flex-wrap:wrap;gap:0 1.25rem;margin-top:.2rem}
  .rt-links a{display:inline-block;padding:.65rem 0;font-weight:600}
  .rt-gap{margin:0;padding:.7rem .9rem;border:1px dashed var(--rt-muted);border-radius:8px;background:transparent;color:var(--rt-ink)}
  li.rt-gapitem{padding:.25rem 0 1rem}
  .rt-how li{margin-bottom:.45rem}
  .rt-cards{list-style:none;margin:1.25rem 0;padding:0;display:grid;gap:1rem}
  .rt-card{border:1px solid var(--rt-line);border-radius:10px;background:var(--rt-card);padding:1.1rem 1.2rem}
  .rt-card h2{margin:0 0 .3rem;font-size:1.35rem}
  .rt-card.rt-headline{border:2px solid var(--rt-road);padding:1.5rem 1.4rem}
  .rt-card.rt-headline h2{font-size:1.7rem}
  .rt-card ul{margin:.4rem 0 .6rem;padding-left:1.1rem}
  .rt-card p{margin:0 0 .4rem}
  .rt-hero-facts{display:flex;flex-wrap:wrap;gap:.4rem 1.5rem;margin:1rem 0 0;padding:0;list-style:none;color:#fff}
  .rt-hero-facts b{font-size:1.35rem;margin-right:.3rem;font-variant-numeric:tabular-nums}
  @media (min-width:36rem){.rt-stop{grid-template-columns:5rem minmax(0,1fr);gap:1rem}}
</style>`;

const breadcrumb = (items: { name: string; href?: string }[]) => `
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-3">
          ${items.map((i) => i.href ? `<li class="breadcrumb-item"><a href="${a(i.href)}" class="text-white-50">${h(i.name)}</a></li>` : `<li class="breadcrumb-item active text-white" aria-current="page">${h(i.name)}</li>`).join('\n          ')}
        </ol>
      </nav>`;
const breadcrumbLd = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((i, n) => ({ '@type': 'ListItem', position: n + 1, name: i.name, item: i.url })),
});
const drivingNote = () => `
      <div class="rt-driver" role="note">
        <p><strong>If you drink, do not drive.</strong> Arrange a driver who will not drink, or other transport, before you set out. This is a list of places, not a drinking itinerary.</p>
      </div>`;

/** The measured figure and how it was measured. No "on the road" or "short detour": a straight line cannot show either. */
export function distanceLabel(miles: number): string {
  return `${miles < 0.1 ? 'Under 0.1 miles' : `${mi(miles)} ${miles.toFixed(1) === '1.0' ? 'mile' : 'miles'}`} from the mapped road, straight-line`;
}

// Google Maps links are plain Maps URLs: no API key, no script, no embed.
// https://developers.google.com/maps/documentation/urls/get-started (page "Last updated 2026-11-09 UTC", read 2026-11-22):
//   "The number of waypoints allowed varies by the platform where the link opens, with up to three waypoints supported
//    on mobile browsers, and a maximum of nine waypoints supported otherwise."
//   "Ensure proper URL encoding and be mindful of the 2,048 character limit when constructing these URLs."
// This page is read on a phone, so a stretch link carries at most three waypoints: five stops per link (origin, three
// waypoints, destination). A longer stretch becomes consecutive links; no stop is dropped. The 2,048-character limit is
// enforced here: a stretch link that would be longer is cut into shorter ones, and a link that cannot be made to fit is
// not made at all.
export const MAPS_MAX_WAYPOINTS = 3;
export const MAPS_URL_LIMIT = 2048;
const MAPS_DIR = 'https://www.google.com/maps/dir/?api=1';
type Placed = Pick<StopView, 'name' | 'address' | 'addressSourceUrl' | 'town' | 'state'>;
/**
 * What we hand Google for a stop: its name and its sourced address, or name, directory town and state when there is no
 * sourced address (never a directory street). Town and state are also added after a sourced address that carries
 * neither the state nor a ZIP code. The page's method notes say exactly this.
 */
export function mapsPlace(s: Placed): string {
  const printed = s.address && safeHttpUrl(s.addressSourceUrl) ? s.address.trim() : '';
  const complete = printed && (/\b\d{5}(-\d{4})?\b/.test(printed) || (!!s.state && new RegExp(`\\b${s.state.replace(/[^A-Za-z]/g, '')}\\b`, 'i').test(printed)));
  return [s.name, printed, ...(complete ? [] : [s.town, s.state])].map((x) => (x || '').trim()).filter(Boolean).join(', ');
}
/** Directions to one stop, or '' when the URL would pass Google's length limit. */
export const directionsUrl = (s: Placed): string => { const u = `${MAPS_DIR}&destination=${encodeURIComponent(mapsPlace(s))}`; return u.length <= MAPS_URL_LIMIT ? u : ''; };
const routeUrl = (g: Placed[]) => `${MAPS_DIR}&travelmode=driving&origin=${encodeURIComponent(mapsPlace(g[0]))}&destination=${encodeURIComponent(mapsPlace(g[g.length - 1]))}${g.length > 2 ? `&waypoints=${g.slice(1, -1).map((m) => encodeURIComponent(mapsPlace(m))).join('%7C')}` : ''}`;
/**
 * Links for a stretch, in list order: groups of at most five stops, none of fewer than two, each within the URL limit.
 * Empty for under two stops. `from` and `to` are positions in the stretch, starting at 1.
 */
export function stretchLinks<T extends Placed>(stops: T[]): { from: number; to: number; href: string }[] {
  if (stops.length < 2) return [];
  const per = MAPS_MAX_WAYPOINTS + 2, out: { from: number; to: number; href: string }[] = [];
  for (let at = 0; at < stops.length;) {
    let n = Math.min(per, stops.length - at);
    if (stops.length - at - n === 1) n--;                               // never leave one stop over: a route needs two ends
    while (n > 2 && routeUrl(stops.slice(at, at + n)).length > MAPS_URL_LIMIT) n--;
    if (n < 2) break;                                                   // one stop left that no route can take: it keeps its own Directions link
    const href = routeUrl(stops.slice(at, at + n));
    if (href.length <= MAPS_URL_LIMIT) out.push({ from: at + 1, to: at + n, href });
    at += n;
  }
  return out;
}
const gmaps = (url: string, text: string) => `<a href="${a(url)}" rel="noopener nofollow" target="_blank">${h(text)}</a>`;

// A drawing of the leg from the same line the miles were measured on. No tiles, no script, nothing fetched.
function legMap(leg: LegView, id: string): string {
  if (leg.line.length < 2) return '';
  const all: LatLon[] = [...leg.line, ...leg.stops.map((s) => [s.lat, s.lon] as LatLon)];
  const lats = all.map((p) => p[0]), lons = all.map((p) => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
  const W = 360, pad = { l: 14, r: 14, t: 26, b: 22 };
  const scale = (W - pad.l - pad.r) / Math.max((maxLon - minLon) * kx, 1e-6);
  const H = Math.round(pad.t + (maxLat - minLat) * scale + pad.b);
  const xy = (p: LatLon) => [pad.l + (p[1] - minLon) * kx * scale, pad.t + (maxLat - p[0]) * scale];
  const f = (n: number) => n.toFixed(1);
  const road = leg.line.map((p) => xy(p).map(f).join(',')).join(' ');
  const [sx, sy] = xy(leg.line[0]), [ex, ey] = xy(leg.line[leg.line.length - 1]);
  // Town names above the first stop in each town, skipped where they would overlap one already placed.
  const boxes: { x1: number; x2: number; y: number }[] = [];
  const fits = (x1: number, x2: number, y: number) => x1 >= 2 && x2 <= W - 2 && !boxes.some((b) => Math.abs(b.y - y) < 11 && x1 < b.x2 + 4 && x2 > b.x1 - 4);
  const labels: string[] = [];
  const put = (text: string, x: number, y: number, anchor: 'start' | 'middle' | 'end', cls: string) => {
    const w = text.length * 5.6, x1 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    if (!fits(x1, x1 + w, y)) return false;
    boxes.push({ x1, x2: x1 + w, y });
    labels.push(`<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}"${cls ? ` class="${cls}"` : ''}>${h(text)}</text>`);
    return true;
  };
  put(place(leg.from), Math.max(sx - 4, 3), sy + 15, 'start', '');
  put(place(leg.to), Math.min(ex + 4, W - 3), ey + 15, 'end', '');
  const seen = new Set<string>([place(leg.from), place(leg.to)]);
  for (const s of leg.stops) {
    if (seen.has(s.town)) continue;
    const [x, y] = xy([s.lat, s.lon]);
    if (put(s.town, x, y - 7, 'middle', 'town') || put(s.town, x, y - 18, 'middle', 'town')) seen.add(s.town);
  }
  const dots = leg.stops.map((s) => { const [x, y] = xy([s.lat, s.lon]); return `<circle class="dot" cx="${f(x)}" cy="${f(y)}" r="3.4"/>`; }).join('');
  const title = `${place(leg.from)} to ${place(leg.to)}: our mapped line with ${plural(leg.stops.length, 'listed stop')} marked`;
  return `
        <figure class="rt-map">
          <svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${a(id)}-t" xmlns="http://www.w3.org/2000/svg">
            <title id="${a(id)}-t">${h(title)}</title>
            <polyline class="road" points="${road}"/>
            <circle class="end" cx="${f(sx)}" cy="${f(sy)}" r="3"/><circle class="end" cx="${f(ex)}" cy="${f(ey)}" r="3"/>
            ${dots}
            ${labels.join('')}
          </svg>
          <figcaption>A sketch of our mapped line with each listed stop as a dot, west on the left. It is not for navigation. Road line ${OSM_LINK}.</figcaption>
        </figure>`;
}

function marks(s: StopView, o: RoadPageOptions): string {
  const out: string[] = [];
  const cup = medalsFor(s.breweryId);
  for (const set of cup) out.push(`<a href="/brewery/${s.breweryId}"><span aria-hidden="true">🏅</span> ${h(plural(set.medals.length, `${set.competition} medal`))}</a>`);
  const i = DOWNTOWN_TOUR.stops.findIndex((t) => t.breweryId === s.breweryId), gabf = i < 0 ? [] : DOWNTOWN_TOUR.stops[i].gabf || [];
  if (gabf.length) out.push(`<a href="/trails/${a(DOWNTOWN_TOUR.slug)}#stop-${i + 1}"><span aria-hidden="true">🏅</span> ${h(plural(gabf.length, 'GABF medal'))} since ${GABF_WINDOW.from}</a>`);
  const updated = o.tapLists?.get(s.breweryId);
  if (updated) {
    const t = Date.parse(updated), now = o.now ?? Date.now(), date = tapListDate(updated);
    if (date && Number.isFinite(t) && t <= now + 86_400_000 && now - t <= DEFAULT_STALE_AFTER_DAYS * 86_400_000)
      out.push(`<a href="/brewery/${s.breweryId}#on-tap-heading"><span aria-hidden="true">🍺</span> Tap list, updated ${h(date)}</a>`);
  }
  return out.length ? `<p class="rt-marks">${out.join('')}</p>` : '';
}

/** The descriptive quote is shown only when it adds something: a real sentence, with its own source, that is not the evidence again. */
export const quoteAdds = (s: StopView): boolean => s.quote.trim().length >= 45 && !!safeHttpUrl(s.quoteSourceUrl) && !s.evidence.includes(s.quote.trim()) && !s.quote.includes(s.evidence.trim());

function stopItem(s: StopView, leg: LegView, o: RoadPageOptions): string {
  const site = safeHttpUrl(s.website), evidenceUrl = safeHttpUrl(s.evidenceUrl), quoteUrl = safeHttpUrl(s.quoteSourceUrl), addressUrl = safeHttpUrl(s.addressSourceUrl);
  const where = [s.town, s.state].filter(Boolean).join(', ');
  const nearEnd = s.pastEnd ? ` Its nearest point on our mapped line is the ${h(place(s.pastEnd === 'start' ? leg.from : leg.to))} end.` : '';
  const directions = directionsUrl(s);
  return `
          <li class="rt-stop" id="stop-${s.breweryId}">
            <div class="rt-mile"><b>${mi(s.mile)}</b><span>mile</span></div>
            <div>
              <h4><a href="/brewery/${s.breweryId}">${h(s.name)}</a></h4>
              <p class="rt-where">${h(where)} · nearest point on our mapped line: mile ${mi(s.mile)} from ${h(place(leg.from))}, ${mi(s.milesFromEnd)} from ${h(place(leg.to))}</p>
              <p><span class="rt-dist">${h(distanceLabel(s.detourMiles))}</span>${nearEnd}</p>
              ${s.address && addressUrl
                ? `<p>${h(s.address)} <span class="rt-src">(as printed on ${ext(addressUrl, hostOf(addressUrl))})</span></p>`
                : `<p class="rt-src">We do not have a sourced street address for this listing.</p>`}
              ${marks(s, o)}
              <p class="rt-why"><strong>Operating evidence: hours read on ${h(s.evidenceChecked)}</strong></p>
              <blockquote>“${h(s.evidence)}”</blockquote>
              <p class="rt-src">Read on ${ext(evidenceUrl, hostOf(evidenceUrl))}. Check current opening information with the brewery before you travel.</p>
              ${quoteAdds(s) ? `<blockquote>“${h(s.quote)}”</blockquote>
              <p class="rt-src">Also read on ${ext(quoteUrl, hostOf(quoteUrl))}, ${h(s.checked)}</p>` : ''}
              <p class="rt-links"><a href="/brewery/${s.breweryId}">Brewery Trip page</a>${site ? ext(site, 'Its own site') : ''}${directions ? gmaps(directions, 'Directions (opens Google Maps)') : ''}</p>
            </div>
          </li>${s.gapAfterMiles !== null ? `
          <li class="rt-gapitem"><p class="rt-gap"><strong>${mi(s.gapAfterMiles)} miles</strong> along our mapped line from here (mile ${mi(s.mile)}) to ${h(s.mile + s.gapAfterMiles >= leg.lengthMiles - 0.05 ? `the end of the line at ${place(leg.to)}` : 'the next listed stop')}, with nothing on this list in between.</p></li>` : ''}`;
}

function stretchNav(stops: StopView[], roadName: string): string {
  const links = stretchLinks(stops);
  if (!links.length) return '';
  const items = links.length === 1 && links[0].to === stops.length
    ? gmaps(links[0].href, 'Open this stretch in Google Maps')
    : links.map((l) => gmaps(l.href, `Open stops ${l.from}–${l.to} of this stretch in Google Maps`)).join('');
  return `<p class="rt-links rt-stretch">${items}</p>
          <p class="rt-src">${h(DRIVING_SHORT)} Google chooses the route: it may not follow ${h(roadName)}, and our miles are measured on our own mapped line.</p>`;
}

/** How much of the directory near a leg (or road) we reached a decision on. Never implies a full review unless the counts say so. */
export function coverageText(decided: number, candidates: number, limit: number, of: string): string {
  if (!candidates) return `Our directory has no brewery within ${limit} straight-line miles of ${of}.`;
  const base = `Our directory has ${plural(candidates, 'brewery', 'breweries')} within ${limit} straight-line miles of ${of}.`;
  if (decided >= candidates) return `${base} We reached a decision on ${candidates === 1 ? 'it' : `all ${candidates}`}: listed here, or found closed, moved, a duplicate or not a taproom.`;
  if (!decided) return `${base} We have not reached a decision on any of them yet.`;
  return `${base} We reached a decision on ${decided} of them. The other ${candidates - decided} could not be confirmed either way and ${candidates - decided === 1 ? 'is' : 'are'} not listed.`;
}

function legSection(road: RoadView, leg: LegView, n: number, o: RoadPageOptions): string {
  const id = `leg-${leg.id}`;
  const head = `${place(leg.from)} to ${place(leg.to)}`;
  const facts = [`${mi(leg.lengthMiles)} miles on our mapped line`];
  if (leg.stops.length) {
    facts.push(`${plural(leg.stops.length, 'listed stop')} in ${plural(leg.towns, 'town')}`);
    if (leg.longestGap) facts.push(`longest gap between listed stops along our mapped line: ${mi(leg.longestGap.miles)} miles (mile ${mi(leg.longestGap.fromMile)} to ${mi(leg.longestGap.toMile)})`);
  }
  const body = !leg.stops.length ? '' : `${leg.leadGapMiles !== null ? `<p class="rt-gap"><strong>${mi(leg.leadGapMiles)} miles</strong> along our mapped line from its start at ${h(place(leg.from))} to the first listed stop.</p>` : ''}
        ${leg.segments.map((g) => `
        <section aria-labelledby="seg-${a(leg.id)}-${a(g.id)}">
          <h3 id="seg-${a(leg.id)}-${a(g.id)}">${h(g.name)}</h3>
          <p class="rt-sub">Mile ${mi(g.fromMile)} to ${mi(g.toMile)} · ${g.stops.length ? plural(g.stops.length, 'listed stop') : 'nothing on this list'}${g.link && safeSitePath(g.link.href) && g.stops.length ? ` · <a href="${a(safeSitePath(g.link.href))}">${h(g.link.text)}</a>` : ''}</p>
          ${stretchNav(g.stops, road.config.shortName)}
          ${g.stops.length ? `<ol class="rt-stops">${g.stops.map((s) => stopItem(s, leg, o)).join('')}
          </ol>` : ''}
        </section>`).join('')}`;
  return `
      <section aria-labelledby="${a(id)}">
        <h2 id="${a(id)}">Leg ${n}: ${h(head)}</h2>
        <p class="rt-sub">${h(leg.from)} to ${h(leg.to)} · ${h(facts.join(' · '))}</p>
        <p class="rt-sub">${h(coverageText(leg.decided, leg.candidates, road.config.maxDetourMiles, 'this leg of our mapped line'))}${leg.stops.length ? '' : ' Nothing is listed on this leg.'}</p>
        ${legMap(leg, `map-${leg.id}`)}
        ${body}
      </section>`;
}

export const roadTitle = (road: RoadView) => `Breweries along ${road.config.name}`;
/** "on 2026-11-22", or "between A and B" when the listed stops were checked on different days. */
export const checkedPhrase = (road: RoadView) => road.checkedFrom === road.checkedTo ? `on ${road.checkedTo}` : `between ${road.checkedFrom} and ${road.checkedTo}`;
/** True when the operating evidence was read on the brewery's own site (same host as the site the checker recorded for it). */
export const fromOwnSite = (s: StopView) => !!hostOf(s.website) && hostOf(s.website) === hostOf(s.evidenceUrl);
/** Hosts of sources that are not the brewery's own site, for the method notes ("untappd.com"). */
export const thirdPartyHosts = (road: RoadView) => [...new Set(road.stops.filter((s) => !fromOwnSite(s)).map((s) => hostOf(s.evidenceUrl)).filter(Boolean))].sort();
/**
 * One plain sentence pair saying exactly what the list is. Used on the page, in the meta description, on the index,
 * and in llms.txt. The date is when we read the hours, never a claim the place was open that day; straight-line, not
 * driving; provenance stated when it is mixed.
 */
export const roadSummary = (road: RoadView) => {
  const n = road.stops.length, other = road.stops.filter((s) => !fromOwnSite(s)).length;
  return `${plural(n, 'brewery', 'breweries')} from our directory within ${road.config.maxDetourMiles} straight-line miles of our mapped line of ${road.config.shortName}, ordered by their nearest point along it; these are not driving distances. `
    + `Each listing is supported by published visiting hours read on the date shown.${other ? ` For ${other}, the source is not the brewery's own site.` : ''}`;
};
/**
 * The section in one or two sentences, for places that link to it (/trails, llms.txt). Says the same thing as the pages
 * do: ordered by nearest point, dated source checks, and third-party sources only when there are some.
 */
export const roadsBlurb = (roads: RoadView[]) =>
  `Breweries near one road, ordered by their nearest point along our mapped line of it, with straight-line distances. Each listing is supported by published visiting hours read on the date shown${roads.some((r) => thirdPartyHosts(r).length) ? '; some sources are third-party' : ''}.`;

export function roadTripPage(road: RoadView, o: RoadPageOptions = {}): string {
  const c = road.config, url = `${SITE}/roads/${c.slug}`, title = roadTitle(road);
  const totalMiles = road.legs.reduce((n, l) => n + l.lengthMiles, 0);
  const others = thirdPartyHosts(road), byEye = road.stops.filter((s) => s.browserChecked).length;
  const jump = road.legs.flatMap((l) => l.stops.length
    ? l.segments.filter((g) => g.stops.length).map((g) => `<li><a href="#seg-${a(l.id)}-${a(g.id)}">${h(g.name)} (${g.stops.length})</a></li>`)
    : [`<li><a href="#leg-${a(l.id)}">${h(place(l.from))} to ${h(place(l.to))}</a></li>`]);

  const content = `${STYLE}
  <div class="trail-hero">
    <div class="container">${breadcrumb([{ name: 'Home', href: '/' }, { name: 'Road trips', href: '/roads' }, { name: c.name }])}
      <h1 style="color: #fff;">${h(title)}</h1>
      <p style="opacity: 0.92; max-width: 40rem;">${h(roadSummary(road))} It is not every brewery near the road. Check current opening information with each brewery before you travel.</p>
      <ul class="rt-hero-facts">
        <li><b>${road.stops.length}</b>listed stops</li>
        <li><b>${mi(totalMiles)}</b>miles of mapped line in ${plural(road.legs.length, 'leg')}</li>
        <li>Source-check dates <b style="margin-left:.3rem">${h(road.checkedFrom === road.checkedTo ? road.checkedTo : `${road.checkedFrom} to ${road.checkedTo}`)}</b></li>
      </ul>
    </div>
  </div>

  <div class="container my-4 rt">
    <div class="rt-wrap">${drivingNote()}
      <p>${h(c.about)}</p>
      <p>${h(coverageText(road.decided, road.candidates, c.maxDetourMiles, `our mapped line of ${c.shortName}`))}</p>
      <nav aria-label="Stretches of the road">
        <ul class="rt-jump">${jump.join('')}</ul>
      </nav>
      ${road.legs.map((l, i) => legSection(road, l, i + 1, o)).join('')}

      <section aria-labelledby="how" class="rt-how">
        <h2 id="how">How this list was made</h2>
        <ul>
          <li><strong>The road.</strong> ${h(c.geometry.source)} on ${h(c.geometry.downloaded)}. ${OSM_LINK}; the data is available under the Open Database License. Where the road has two carriageways we measure along one. This is our mapped line.</li>
          <li><strong>Order and miles.</strong> Stops are ordered by their nearest point along our mapped line. The mile beside each stop is the distance along that line from the start of the leg to that nearest point. It is our calculation, not a milepost, and it is not the order or the distance you would drive.</li>
          <li><strong>Distance from the road.</strong> A straight line from the brewery to the nearest point on our mapped line. Driving distance and access may differ substantially.</li>
          <li><strong>Who is listed.</strong> A brewery is here when it is in our directory, sits within ${c.maxDetourMiles} straight-line miles of our mapped line, and its listing is supported by published visiting hours that we read on the date shown. Ones we found closed or moved, and ones we could not confirm, are left out.</li>
          <li><strong>Sources.</strong> Each excerpt is copied from the page linked under it, on the date shown. Addresses are copied from the page named beside them.${others.length ? ` For ${plural(road.stops.filter((s) => !fromOwnSite(s)).length, 'stop')} the source is not the brewery's own site: ${h(others.map((x) => (x === 'untappd.com' ? 'Untappd (untappd.com)' : x)).join(', '))}.` : ''}${byEye ? ` ${plural(byEye, 'page')} could only be read in a browser; a person read ${byEye === 1 ? 'it' : 'those'}, not our checking script.` : ''}</li>
          <li><strong>Towns.</strong> Town names are the ones in our directory. A brewery's printed address sometimes names a different post-office town.</li>
          <li><strong>Google Maps links.</strong> We send Google the brewery name and sourced address where available. Otherwise we use its name and directory town and state; town and state may also supplement an incomplete address. Check the destination before travelling. Google chooses the route, which may not follow the road.</li>
          <li><strong>Opening hours.</strong> The hours under each stop are quoted as the source printed them on the date we read them. They support listing the brewery as operating. They do not mean it was open on that date, and they are not a current timetable. Check current opening information with the brewery before you travel.</li>
        </ul>
        <details>
          <summary>Sources for what we say about the road</summary>
          ${c.roadSources.map((s) => `<blockquote>“${h(s.quote)}”</blockquote><p class="rt-src">${ext(safeHttpUrl(s.url), hostOf(s.url))}, checked ${h(s.checked)}</p>`).join('')}
        </details>
        <p class="mt-3"><a href="/roads">All road trips</a></p>
      </section>
    </div>
  </div>
  <script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org', '@type': 'TouristTrip', name: title, url, description: roadSummary(road),
    touristType: 'Craft beer travelers',
    itinerary: {
      '@type': 'ItemList', numberOfItems: road.stops.length,
      itemListElement: road.stops.map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: {
        '@type': 'Brewery', name: s.name, url: `${SITE}/brewery/${s.breweryId}`, sameAs: safeHttpUrl(s.website) || undefined,
        address: { '@type': 'PostalAddress', streetAddress: s.address && safeHttpUrl(s.addressSourceUrl) ? s.address : undefined, addressLocality: s.town || undefined, addressRegion: s.state || undefined, addressCountry: 'US' },
      } })),
    },
  })}</script>
  <script type="application/ld+json">${jsonLd(breadcrumbLd([{ name: 'Home', url: `${SITE}/` }, { name: 'Road trips', url: `${SITE}/roads` }, { name: c.name, url }]))}</script>`;

  return layout(title, content, { description: roadSummary(road), url, subdomain: o.subdomain });
}

/** /roads: the section's front page. Lists only published roads; the headline trip (config.headline) leads. */
export function roadsIndexPage(roads: RoadView[], subdomain?: SubdomainContext): string {
  const url = `${SITE}/roads`;
  const card = (r: RoadView) => `
        <li class="rt-card${r.config.headline ? ' rt-headline' : ''}">
          <h2><a href="/roads/${a(r.config.slug)}">${h(roadTitle(r))}</a></h2>
          <p>${h(roadSummary(r))}</p>
          <ul>${r.legs.map((l) => `<li>${h(place(l.from))} to ${h(place(l.to))}: ${mi(l.lengthMiles)} miles of mapped line, ${l.stops.length ? plural(l.stops.length, 'listed stop') : 'nothing listed'}; a decision reached on ${l.decided} of ${l.candidates} nearby directory breweries</li>`).join('')}</ul>
          <p><a href="/roads/${a(r.config.slug)}">See the list for ${h(r.config.shortName)}</a></p>
        </li>`;
  const content = `${STYLE}
  <div class="trail-hero">
    <div class="container">${breadcrumb([{ name: 'Home', href: '/' }, { name: 'Road trips' }])}
      <h1 style="color: #fff;">Brewery road trips, one road at a time</h1>
      <p style="opacity: 0.92; max-width: 40rem;">Each page lists breweries from our directory near one road, ordered by their nearest point along our mapped line of that road, with the straight-line distance from the line and the published visiting hours that support each listing, with the date we read them. These are not driving distances.</p>
    </div>
  </div>
  <div class="container my-4 rt">
    <div class="rt-wrap">${drivingNote()}
      <ul class="rt-cards">${roads.map(card).join('')}
      </ul>
      <section aria-labelledby="roads-how" class="rt-how">
        <h2 id="roads-how">What makes a road page</h2>
        <ul>
          <li>A road page is published only after an editor has reviewed it. Each page says how many of our directory's nearby breweries we reached a decision on. It is not a claim that every brewery near the road was reviewed.</li>
          <li>Stops are ordered by their nearest point along our mapped line of the road, with the straight-line distance from that line. These are not driving distances. Long gaps between listed stops are marked.</li>
          <li>Each stop carries the published visiting hours that support its listing, the date we read them, and a link to that page. Check current opening information with the brewery before you travel.</li>
          <li>Road lines come from OpenStreetMap, ${OSM_LINK}.</li>
        </ul>
        <p>Planning around a city instead? Try the <a href="/plan">trip planner</a>, the <a href="/trails">trails</a> or the full <a href="/breweries">brewery directory</a>.</p>
      </section>
    </div>
  </div>
  <script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org', '@type': 'ItemList', name: 'Brewery road trips, one road at a time', url, numberOfItems: roads.length,
    itemListElement: roads.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/roads/${r.config.slug}`, name: roadTitle(r) })),
  })}</script>
  <script type="application/ld+json">${jsonLd(breadcrumbLd([{ name: 'Home', url: `${SITE}/` }, { name: 'Road trips', url }]))}</script>`;
  return layout('Brewery road trips, one road at a time', content, {
    description: 'Breweries near one road, ordered by their nearest point along our mapped line, with straight-line distances and published visiting hours read on the date shown.',
    url, subdomain,
  });
}
