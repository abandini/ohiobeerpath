// /roads and /roads/<slug>: single-road brewery trips. Data: src/data/roads/ (hand-written config + built stops);
// maths and the "what may be shown" gate: src/lib/road-trip.ts. Styles are scoped here on purpose: CSS under assets/
// is served from R2 with a one-year cache and is not uploaded by CI.
//
// Wording rules for this file (pre-launch review, 2026-11-22). The page never says "driving order", "detour" or "on
// the road": stops are ordered by their nearest point along our mapped line and distances are straight-line. It never
// says a brewery "is open": it says what a dated source showed, and tells the reader to check. It never implies every
// nearby brewery was reviewed: it gives the count we reached a decision on.
// Outside review of I-71 (2026-11-22): no link carries more than one destination (no multi-stop routes, on any road);
// a brewery is never said to be at an exit; a directory road tells coverage by cohort (checked, with hours, listed,
// and the rest by reason) and says under each stop where its coordinates come from.
import { layout } from './layout';
import { escapeAttr, escapeHtml as h, hostOf, jsonLd, safeHttpUrl } from './utils';
import { tapListDate } from './taplist';
import { medalsFor } from '../data/medals';
import { DOWNTOWN_TOUR, GABF_WINDOW } from '../data/tours/downtown-cleveland';
import { DEFAULT_STALE_AFTER_DAYS } from '../services/taplist';
import type { SubdomainContext } from '../types';
import { safeSitePath, type Cohort, type LatLon, type LegView, type RoadNote, type RoadView, type SegmentView, type StopView, type UpdateEvent } from '../lib/road-trip';

// A road crosses state lines, so its one canonical home is the national site, whichever host served the page.
const SITE = 'https://brewerytrip.com';
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';
const OSM_LINK = `<a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">${OSM_ATTRIBUTION}</a>`;
/** The driving instruction, word for word the same wherever it appears. */
export const DRIVING_NOTICE = 'If you drink, do not drive. Arrange a driver who will not drink, or other transport, before you set out. This is a list of places, not a drinking itinerary.';
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
  .rt-mile.rt-nomile{background:transparent;color:var(--rt-muted);border:1px dashed var(--rt-muted)}
  .rt-mile.rt-nomile span{letter-spacing:0;overflow-wrap:normal}
  .rt-note{border-left:4px solid var(--rt-dot);background:var(--rt-card);padding:.7rem .9rem;margin:.6rem 0 1rem}
  .rt-note p{margin:0 0 .3rem}
  .rt-note blockquote{margin:.4rem 0 .2rem;padding-left:.75rem;border-left:3px solid var(--rt-line)}
  .rt h4.rt-outer{margin:1.5rem 0 .25rem;font-size:1.05rem}
  .rt-gaps{list-style:none;margin:.5rem 0;padding:0;display:grid;gap:.5rem}
  .rt-notlisted{margin:0 0 1rem}
  .rt-notlisted>summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:600}
  .rt-fold{margin:.75rem 0 0;border:1px solid var(--rt-line);border-radius:10px;background:transparent}
  .rt-fold>summary{cursor:pointer;padding:.9rem 1rem;min-height:44px;background:var(--rt-card);border-radius:10px;font-weight:600}
  .rt-fold[open]>summary{border-bottom:1px solid var(--rt-line);border-radius:10px 10px 0 0}
  .rt-fold>summary:focus-visible{outline:3px solid var(--rt-accent);outline-offset:2px}
  .rt-sum-towns{display:block;font-weight:400;color:var(--rt-muted);font-size:.92rem;margin-top:.2rem}
  .rt-fold>*:not(summary){margin-left:.75rem;margin-right:.75rem}
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
/** For an interstate: said near the introduction and beside the directions controls. */
export const INTERSTATE_NOTICE = 'Nearest road points are not exits or access points. Use a navigation service to find a legal route via an interchange; a nearby brewery may require a much longer drive. Plan while parked. If you drink, do not drive: arrange a driver who will not drink, or other transport, before setting out.';
/** The same without its last sentence, for the box at the top, where the drive notice above it already says that. */
export const INTERSTATE_ACCESS = INTERSTATE_NOTICE.slice(0, INTERSTATE_NOTICE.indexOf(' If you drink'));
/** For any other road: added to the drive notice. */
export const PLAN_NOTICE = 'Plan while parked. A nearby brewery may require a much longer drive than its straight-line distance suggests.';
/** Beside each stop's directions link. */
export const DIRECTIONS_NOTE = 'Plan while parked.', DIRECTIONS_NOTE_INTERSTATE = 'Its nearest road point is not an exit or an access point. Plan while parked.';
const drivingNote = (road?: RoadView) => `
      <div class="rt-driver" role="note">
        <p><strong>If you drink, do not drive.</strong> Arrange a driver who will not drink, or other transport, before you set out. This is a list of places, not a drinking itinerary.</p>${road ? `
        <p>${h(road.config.interstate ? INTERSTATE_ACCESS : PLAN_NOTICE)}</p>` : ''}
      </div>`;

// The words for the line and for what distance is measured to. On a road whose distance is to any mapped alignment
// (distanceTo: 'any-way') the two are different things, and the page must not call both "our mapped line". Set at the
// top of each page render, which is synchronous.
let T = { line: 'our mapped line', road: 'the mapped road', anyWay: false };
const termsFor = (road: RoadView) => (road.config.distanceTo === 'any-way'
  ? { line: 'our measuring line', road: 'the nearest mapped alignment', anyWay: true }
  : { line: 'our mapped line', road: 'the mapped road', anyWay: false });

/** The measured figure and how it was measured. No "on the road" or "short detour": a straight line cannot show either. */
export function distanceLabel(miles: number, to = 'the mapped road'): string {
  return `${miles < 0.1 ? 'Under 0.1 miles' : `${mi(miles)} ${miles.toFixed(1) === '1.0' ? 'mile' : 'miles'}`} from ${to}, straight-line`;
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
  // Each end is labelled from its own side of the drawing, whichever way the leg runs.
  const endLabel = (text: string, x: number, y: number, other: number) => (x <= other ? put(text, Math.max(x - 4, 3), y + 15, 'start', '') : put(text, Math.min(x + 4, W - 3), y + 15, 'end', '')) || put(text, Math.min(Math.max(x, 40), W - 40), y - 9, 'middle', '');
  endLabel(place(leg.from), sx, sy, ex);
  endLabel(place(leg.to), ex, ey, sx);
  const seen = new Set<string>([place(leg.from), place(leg.to)]);
  for (const s of leg.stops) {
    if (seen.has(s.town)) continue;
    const [x, y] = xy([s.lat, s.lon]);
    if (put(s.town, x, y - 7, 'middle', 'town') || put(s.town, x, y - 18, 'middle', 'town')) seen.add(s.town);
  }
  const dots = leg.stops.map((s) => { const [x, y] = xy([s.lat, s.lon]); return `<circle class="dot" cx="${f(x)}" cy="${f(y)}" r="3.4"/>`; }).join('');
  const title = `${place(leg.from)} to ${place(leg.to)}: ${T.line} with ${plural(leg.stops.length, leg.unmeasured.length ? 'measured stop' : 'listed stop')} marked`;
  return `
        <figure class="rt-map">
          <svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${a(id)}-t" xmlns="http://www.w3.org/2000/svg">
            <title id="${a(id)}-t">${h(title)}</title>
            <polyline class="road" points="${road}"/>
            <circle class="end" cx="${f(sx)}" cy="${f(sy)}" r="3"/><circle class="end" cx="${f(ex)}" cy="${f(ey)}" r="3"/>
            ${dots}
            ${labels.join('')}
          </svg>
          <figcaption>A sketch of ${T.line} with each ${leg.unmeasured.length ? 'measured' : 'listed'} stop as a dot, west on the left. It is not for navigation. Road line ${OSM_LINK}.</figcaption>
        </figure>`;
}

function marks(s: StopView, o: RoadPageOptions): string {
  const out: string[] = [];
  if (s.breweryId === undefined) return '';                           // medals and tap lists belong to directory pages
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

/** "hours" unless the checker's row says the evidence is a dated notice or event. */
const evidenceHeading = (s: StopView) => `Operating evidence: ${s.evidenceKind === 'notice' ? 'event notice' : 'hours'} read on ${s.evidenceChecked}`;
/** Said under a stop whose own site prints two different times for the same day. */
export const TWO_TIMES_LABEL = 'This brewery’s site prints two different times for this day; we show the one on the page we cite. Check before you go.';
/** Said under a stop whose cited page prints hours that change with the season or on holidays. */
export const SEASONAL_LABEL = 'Seasonal or holiday hours: the page says these hours change by season or on holidays.';
/** Said under a stop that is listed on a notice, not on hours. */
export const NOTICE_LABEL = 'Event notice; regular visiting hours not established here.';

/** Where a directory road's stop gets its coordinates from, said under the stop. '' on a road that does not record it. */
export const placedLabel = (s: StopView): string => (!showPlacement ? ''
  : s.placedBy === 'census' ? 'Located by an address-geocoded estimate: the US Census geocoder’s point for an exact match of the printed address.'
    : s.placedBy === 'directory' ? 'Located by our directory’s map point; the printed address is the directory’s address in full.'
      : s.placedBy === 'reviewed' ? `Located by an address-geocoded estimate, as a reviewed exception. ${s.placedNote ?? ''}`.trim() : '');
let showPlacement = false, isInterstate = false;

function stopItem(s: StopView, leg: LegView, o: RoadPageOptions): string {
  const site = safeHttpUrl(s.website), evidenceUrl = safeHttpUrl(s.evidenceUrl), quoteUrl = safeHttpUrl(s.quoteSourceUrl), addressUrl = safeHttpUrl(s.addressSourceUrl);
  const where = [s.town, s.state].filter(Boolean).join(', ');
  const nearEnd = s.pastEnd ? ` Its nearest point on ${T.line} is the ${h(place(s.pastEnd === 'start' ? leg.from : leg.to))} end.` : '';
  const directions = directionsUrl(s);
  const page = s.breweryId !== undefined ? `/brewery/${s.breweryId}` : '';   // only stops in this site's directory have one
  // Where the mapped line is missing (an unmeasured group) the stop carries no mile and no distance.
  const placed = !s.unmeasured;
  return `
          <li class="rt-stop" id="stop-${a(s.key)}">
            ${placed ? `<div class="rt-mile"><b>${mi(s.mile)}</b><span>mile</span></div>` : `<div class="rt-mile rt-nomile"><span>no mile</span></div>`}
            <div>
              <h4>${page ? `<a href="${page}">${h(s.name)}</a>` : h(s.name)}</h4>
              ${placed ? `<p class="rt-where">${h(where)} · nearest point on ${T.line}: mile ${mi(s.mile)} from ${h(place(leg.from))}, ${mi(s.milesFromEnd)} from ${h(place(leg.to))}</p>
              <p><span class="rt-dist">${h(distanceLabel(s.detourMiles, T.road))}</span>${nearEnd}</p>` : `<p class="rt-where">${h(where)}</p>`}
              ${s.address && addressUrl
                ? `<p>${h(s.address)} <span class="rt-src">(as printed on ${ext(addressUrl, hostOf(addressUrl))})</span></p>`
                : `<p class="rt-src">We do not have a sourced street address for this listing.</p>`}
              ${marks(s, o)}
              <p class="rt-why"><strong>${h(evidenceHeading(s))}</strong></p>${s.evidenceKind === 'notice' ? `
              <p class="rt-src">${h(NOTICE_LABEL)}${s.noticeContext ? ` ${h(s.noticeContext)}` : ''}</p>` : ''}
              <blockquote>“${h(s.evidence)}”</blockquote>
              <p class="rt-src">Read on ${ext(evidenceUrl, hostOf(evidenceUrl))}. Check current opening information with the brewery before you travel.</p>${s.seasonal ? `
              <p class="rt-src"><strong>${h(SEASONAL_LABEL)}</strong></p>` : ''}${s.twoTimes ? `
              <p class="rt-src"><strong>${h(TWO_TIMES_LABEL)}</strong></p>` : ''}
              ${quoteAdds(s) ? `<blockquote>“${h(s.quote)}”</blockquote>
              <p class="rt-src">Also read on ${ext(quoteUrl, hostOf(quoteUrl))}, ${h(s.checked)}</p>` : ''}
              ${placedLabel(s) ? `<p class="rt-src">${h(placedLabel(s))}</p>` : ''}
              <p class="rt-links">${page ? `<a href="${page}">Brewery Trip page</a>` : ''}${site ? ext(site, 'Its own site') : ''}${directions ? gmaps(directions, 'Directions (opens Google Maps)') : ''}</p>${directions ? `
              <p class="rt-src">${h(isInterstate ? DIRECTIONS_NOTE_INTERSTATE : DIRECTIONS_NOTE)}</p>` : ''}
            </div>
          </li>${placed && s.gapAfterMiles !== null ? `
          <li class="rt-gapitem"><p class="rt-gap"><strong>${mi(s.gapAfterMiles)} miles</strong> along ${T.line} from here (mile ${mi(s.mile)}) to ${h(s.mile + s.gapAfterMiles >= leg.lengthMiles - 0.05 ? `the end of the line at ${place(leg.to)}` : 'the next listed stop')}, with nothing on this list in between.</p></li>` : ''}`;
}

/**
 * A note for travellers on a leg or stretch. Our own words (if any) first, then each quoted source under the line
 * that introduces it, then the closing line. Nothing here is hidden when a leg is collapsed.
 */
const noteBlock = (n: RoadNote) => `
          <div class="rt-note" role="note">${n.title ? `
            <p><strong>${h(n.title)}</strong></p>` : ''}${n.text ? `
            <p>${h(n.text)}</p>` : ''}${(n.sources ?? []).filter((q) => safeHttpUrl(q.url)).map((q) => `${q.intro ? `
            <p>${h(q.intro)}</p>` : ''}
            <blockquote>“${h(q.quote)}”</blockquote>
            <p class="rt-src">${ext(safeHttpUrl(q.url), hostOf(q.url))}, read ${h(q.checked)}</p>`).join('')}${n.closing ? `
            <p>${h(n.closing)}</p>` : ''}
          </div>`;

/**
 * How much of the starting list near a leg (or road) we reached a decision on. Never implies a full review unless the
 * counts say so. `source` names where the candidates came from when that is not this site's directory.
 */
export function coverageText(decided: number, candidates: number, limit: number, of: string, source?: string): string {
  const many = plural(candidates, 'brewery', 'breweries');
  if (!candidates) return source ? `We started with no brewery within ${limit} straight-line miles of ${of}.` : `Our directory has no brewery within ${limit} straight-line miles of ${of}.`;
  const base = source ? `We started from ${many} within ${limit} straight-line miles of ${of}, or in a place where that line is missing, drawn from ${source}.` : `Our directory has ${many} within ${limit} straight-line miles of ${of}.`;
  if (decided >= candidates) return `${base} We reached a decision on ${candidates === 1 ? 'it' : `all ${candidates}`}: listed here, or found closed, moved, a duplicate or not a taproom.`;
  if (!decided) return `${base} We have not reached a decision on any of them yet.`;
  return `${base} We reached a decision on ${decided} of them. The other ${candidates - decided} could not be confirmed either way and ${candidates - decided === 1 ? 'is' : 'are'} not listed.`;
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const word = (n: number) => WORDS[n] ?? String(n);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** "2026-11-22" as "22 November 2026". */
export const longDate = (d: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d); return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : d; };
/** True when a road's coverage is told by cohort: a directory road built under the location rule. */
const byCohort = (road: RoadView) => !!road.cohort && road.config.addressMustMatch === true && !road.config.startingList;
/** What became of the candidates that are not listed, each counted once, in a fixed order. Empty parts are left out. */
export function cohortBreakdown(c: Cohort, limit: number): string[] {
  return [
    c.unresolved ? `${c.unresolved} with operating status unresolved (we could not confirm published visiting hours)` : '',
    c.notPlaced ? `${c.notPlaced} with published visiting hours but no location we could tie to the printed address` : '',
    c.held ? `${c.held} with published visiting hours, held until a person has read the page` : '',
    c.outside ? `${c.outside} with published visiting hours, placed by the printed address, but then more than ${limit} straight-line miles from our mapped line` : '',
    c.settled ? `${c.settled} found closed, moved, a duplicate of another listing or not a taproom` : '',
  ].filter(Boolean);
}
/** The opening coverage statement for a directory road: the cohort checked, how many had hours, how many are listed, and the rest by reason. */
export function cohortText(c: Cohort, limit: number, checked: string): string {
  if (!c.total) return `Our directory had no candidate within ${limit} straight-line miles of our mapped line.`;
  const rest = cohortBreakdown(c, limit);
  return `We checked ${plural(c.total, 'directory candidate')}, selected using directory coordinates (within ${limit} straight-line miles of our mapped line), ${checked}. We found published visiting hours for ${c.withHours}; ${c.listed} ${c.listed === 1 ? 'meets' : 'meet'} this page’s location and distance requirements.${rest.length ? ` The other ${c.total - c.listed}: ${rest.join('; ')}.` : ''}`;
}
/** The one-line form for the top of the page; the breakdown is in the method notes. */
export function cohortLine(c: Cohort, checked: string): string {
  if (!c.total) return 'Our directory had no candidate near our mapped line.';
  return `We checked ${plural(c.total, 'directory candidate')} ${checked} and found published visiting hours for ${c.withHours}; ${c.listed} ${c.listed === 1 ? 'meets' : 'meet'} this page’s location and distance requirements.`;
}
/** The same for one leg: the candidates nearest it by directory coordinates. */
export function legCohortText(c: Cohort, limit: number): string {
  if (!c.total) return 'No directory candidate was nearest this leg.';
  const rest = cohortBreakdown(c, limit);
  return `${plural(c.total, 'directory candidate')} nearest this leg by directory coordinates: published visiting hours found for ${c.withHours}, ${c.listed} listed.${rest.length ? ` Not listed: ${rest.join('; ')}.` : ''}`;
}
const checkedWhen = (road: RoadView) => (road.checkedFrom === road.checkedTo ? `on ${road.checkedTo}` : `between ${road.checkedFrom} and ${road.checkedTo}`);

/**
 * The two or three sentences of a recorded update, from the record alone (never from the page's current stops): what
 * was revised, how the list changed and why, and what was re-measured. A cause is claimed only when every removal (or
 * every addition) on record has it.
 */
export function updateSummary(e: UpdateEvent): string {
  const removed = e.removed.length, added = e.added.length, from = e.before.length, to = e.after.length;
  const allPlacement = removed > 0 && e.removed.every((r) => r.why === 'notPlaced'), allLater = added > 0 && e.added.every((x) => x.laterCheck);
  const took = removed ? (allPlacement ? `we could not establish ${removed === 1 ? 'an address-linked location' : 'address-linked locations'} for ${word(removed)} previously listed ${removed === 1 ? 'brewery' : 'breweries'}` : `${word(removed)} previously listed ${removed === 1 ? 'brewery was' : 'breweries were'} removed`) : '';
  const notClosed = removed === 1 ? 'this removal is not a finding that the brewery closed' : 'these removals are not findings that the breweries closed';
  const gave = added ? `${word(added)} ${added === 1 ? 'was' : 'were'} added${allLater ? ` after a later check found ${added === 1 ? 'its' : 'their'} published hours` : ''}` : '';
  const parts = [e.what];
  if (removed && added) parts.push(`The list changed from ${from} to ${to} stops: ${took} (${notClosed}), and ${gave}.`);
  else if (removed) parts.push(allPlacement ? `The list changed from ${from} to ${to} stops because ${took}; ${notClosed}.` : `The list changed from ${from} to ${to} stops: ${took}; ${notClosed}.`);
  else if (added) parts.push(`The list changed from ${from} to ${to} stops: ${gave}.`);
  const recalculated = e.measured.length + e.slight, towns = e.towns.length;
  if (recalculated || towns) parts.push(`We also ${[recalculated ? `recalculated ${recalculated === 1 ? 'one mile position or straight-line distance' : `${recalculated >= 3 ? 'several' : word(recalculated)} mile positions and straight-line distances`}` : '', towns ? `changed ${word(towns)} town ${towns === 1 ? 'label' : 'labels'} to match ${towns === 1 ? 'the brewery’s printed address' : 'the breweries’ printed addresses'}` : ''].filter(Boolean).join(' and ')}.`);
  return parts.join(' ');
}
const two = (n: number) => n.toFixed(2);
/** The newest recorded update first. */
const newestFirst = (road: RoadView) => [...road.updates].sort((x, y) => (x.date < y.date ? 1 : -1));
const updateAnchor = (e: UpdateEvent) => `update-${e.date}`;
/** The permanent entries, one per recorded update, each rendered from its own record. */
export function updateEntries(road: RoadView): string {
  if (!road.updates.length) return '';
  return `
      <section aria-labelledby="updates" class="rt-how">
        <h2 id="updates">Updates to this page</h2>${newestFirst(road).map((u) => `
        <div id="${a(updateAnchor(u))}">
        <p><strong>Updated ${h(longDate(u.date))}.</strong> ${h(updateSummary(u))}</p>${u.removed.length ? `
        <p>No longer listed (${u.removed.length}). None of these is a finding that the brewery closed:</p>
        <ul>${u.removed.map((r) => `<li><strong>${h(r.name)}</strong> (${h(r.town)}, was at mile ${mi(r.mile)}): ${h(r.reason ? `${r.reason}.` : 'it no longer met this page’s requirements.')}</li>`).join('')}</ul>` : ''}${u.added.length ? `
        <p>Added (${u.added.length}):</p>
        <ul>${u.added.map((x) => `<li><strong>${h(x.name)}</strong> (${h(x.town)}, mile ${mi(x.mile)}): ${x.laterCheck ? 'a later check of the same listing, made for another road page, found its published hours.' : 'it met this page’s requirements.'}</li>`).join('')}</ul>` : ''}${u.measured.length ? `
        <p>Measurements that changed by half a mile or more along the line, or a quarter of a mile or more from it, because the brewery was then measured from its printed address:</p>
        <ul>${u.measured.map(({ name, was, is }) => `<li><strong>${h(name)}</strong>: ${[was.mile !== is.mile ? `mile ${mi(was.mile)} to ${mi(is.mile)}` : '', was.detourMiles !== is.detourMiles ? `straight-line distance ${two(was.detourMiles)} to ${two(is.detourMiles)} miles` : ''].filter(Boolean).join('; ')}</li>`).join('')}</ul>` : ''}${u.slight ? `
        <p>${plural(u.slight, 'other stop')} moved by less than that.</p>` : ''}${u.towns.length ? `
        <p>Town labels changed to the town the printed address names:</p>
        <ul>${u.towns.map((t) => `<li><strong>${h(t.name)}</strong>: ${h(t.was)} to ${h(t.is)}</li>`).join('')}</ul>` : ''}
        </div>`).join('')}
      </section>`;
}

/** The short form for a leg of a road whose starting list is described once, at the top of the page. */
function legCoverage(leg: LegView, limit: number): string {
  const n = leg.candidates, d = leg.decided, rest = n - d;
  if (!n) return `We started with no brewery within ${limit} straight-line miles of this leg.`;
  const base = `We started from ${plural(n, 'brewery', 'breweries')} near this leg (within ${limit} straight-line miles of ${T.anyWay ? 'a mapped alignment' : 'it'}, or where the ${T.anyWay ? 'mapping' : 'line'} is missing)`;
  if (d >= n) return `${base} and reached a decision on ${n === 1 ? 'it' : `all ${n}`}.`;
  if (!d) return `${base} and have not reached a decision on any of them yet.`;
  return `${base} and reached a decision on ${d}. The other ${rest} could not be confirmed either way and ${rest === 1 ? 'is' : 'are'} not listed.`;
}

const legHead = (leg: LegView, n: number) => {
  const ends = `${place(leg.from)} to ${place(leg.to)}`;
  return leg.name ? `${leg.name}: ${ends}` : `Leg ${n}: ${ends}`;
};

function segmentSection(road: RoadView, leg: LegView, g: SegmentView, o: RoadPageOptions): string {
  const count = g.stops.length + g.outer.length;
  const all = [...g.stops, ...g.outer].sort((x, y) => x.mile - y.mile);
  return `
        <section aria-labelledby="seg-${a(leg.id)}-${a(g.id)}">
          <h3 id="seg-${a(leg.id)}-${a(g.id)}">${h(g.name)}</h3>
          <p class="rt-sub">Mile ${mi(g.fromMile)} to ${mi(g.toMile)} · ${count ? plural(count, 'listed stop') : 'nothing on this list'}${g.link && safeSitePath(g.link.href) && count ? ` · <a href="${a(safeSitePath(g.link.href))}">${h(g.link.text)}</a>` : ''}</p>
          ${g.notes.map(noteBlock).join('')}
          ${g.furtherOffMiles !== null && count ? `<p class="rt-sub">This stretch is dense, so the main list here is within ${g.limitMiles} straight-line miles of ${T.road}. Those between ${g.limitMiles} and ${g.furtherOffMiles} miles follow as “a little further off”.</p>` : ''}
          ${g.stops.length ? `<ol class="rt-stops">${g.stops.map((s) => stopItem(s, leg, o)).join('')}
          </ol>` : ''}
          ${g.outer.length ? `<h4 class="rt-outer">A little further off (${g.limitMiles} to ${g.furtherOffMiles ?? road.config.maxDetourMiles} straight-line miles from ${T.road})</h4>
          <ol class="rt-stops">${g.outer.map((s) => stopItem(s, leg, o)).join('')}
          </ol>` : ''}
        </section>`;
}

const townsOf = (leg: LegView) => [...new Set([...leg.stops, ...leg.unmeasured.flatMap((u) => u.stops)].map((x) => x.town).filter(Boolean))];

function legSection(road: RoadView, leg: LegView, n: number, o: RoadPageOptions): string {
  const id = `leg-${leg.id}`;
  const listed = leg.stops.length + leg.unmeasured.reduce((k, u) => k + u.stops.length, 0);
  const facts = [`${mi(leg.lengthMiles)} miles on ${T.line}`];
  if (leg.stops.length) {
    facts.push(leg.unmeasured.length
      ? `${plural(leg.stops.length, 'measured stop')} in ${plural(leg.towns, 'town')}, plus ${leg.unmeasured.map((u) => `${plural(u.stops.length, 'unmeasured stop')} ${u.name.replace(/^In /, 'in ')}`).join(' and ')}`
      : `${plural(leg.stops.length, 'listed stop')} in ${plural(leg.towns, 'town')}`);
    if (leg.longestGap) facts.push(`longest gap between listed stops along ${T.line}: ${mi(leg.longestGap.miles)} miles (mile ${mi(leg.longestGap.fromMile)} to ${mi(leg.longestGap.toMile)})`);
  }
  const collapse = road.config.collapseLegs === true;
  const leadGap = leg.leadGapMiles !== null ? `<p class="rt-gap"><strong>${mi(leg.leadGapMiles)} miles</strong> along ${T.line} from its start at ${h(place(leg.from))} to the first listed stop.</p>` : '';
  const body = !leg.stops.length ? '' : `${collapse ? '' : leadGap}
        ${leg.segments.map((g) => segmentSection(road, leg, g, o)).join('')}`;
  // Places where the mapped line is missing: listed, but with no mile and no distance.
  const holes = leg.unmeasured.map((u) => `
        <section aria-labelledby="hole-${a(leg.id)}-${a(u.id)}">
          <h3 id="hole-${a(leg.id)}-${a(u.id)}">${h(u.name)}</h3>
          <p class="rt-sub">${plural(u.stops.length, 'listed stop')}, in alphabetical order · not measured</p>
          <div class="rt-note" role="note"><p>${h(u.note)}</p></div>
          <ol class="rt-stops">${u.stops.map((s) => stopItem(s, leg, o)).join('')}
          </ol>
        </section>`).join('');
  const head = `
        <h2 id="${a(id)}-h">${h(legHead(leg, n))}</h2>
        <p class="rt-sub">${leg.side ? 'Side leg · ' : ''}${leg.name && !leg.side ? '' : `${h(leg.from)} to ${h(leg.to)} · `}${h(facts.join(' · '))}</p>
        <p class="rt-sub">${h(byCohort(road) && leg.cohort ? legCohortText(leg.cohort, road.config.maxDetourMiles) : road.config.startingList ? legCoverage(leg, road.config.maxDetourMiles) : coverageText(leg.decided, leg.candidates, road.config.maxDetourMiles, `this leg of ${T.line}`))}${listed ? '' : ' Nothing is listed on this leg.'}</p>
        ${leg.notes.map(noteBlock).join('')}`;
  if (!collapse) return `
      <section id="${a(id)}" aria-labelledby="${a(id)}-h">${head}
        ${legMap(leg, `map-${leg.id}`)}
        ${body}${holes}
      </section>`;
  // Collapsed: the heading, the facts, the notes and every long gap stay in view; the sketch and the stops open on
  // demand. A native <details>, so it works with no script; with script, a link to a stop inside opens it.
  const towns = townsOf(leg);
  const gaps = leg.gaps.length ? `
        <ul class="rt-gaps">${leg.gaps.map((g) => `<li class="rt-gap"><strong>${mi(g.miles)} miles</strong> along ${T.line} with nothing on this list: ${g.fromMile < 0.05 ? `from its start at ${h(place(leg.from))}` : `from mile ${mi(g.fromMile)}`} to ${g.toMile >= leg.lengthMiles - 0.05 ? `the end of the line at ${h(place(leg.to))}` : g.fromMile < 0.05 ? `the first listed stop (mile ${mi(g.toMile)})` : `mile ${mi(g.toMile)}`}.</li>`).join('')}</ul>` : '';
  return `
      <section id="${a(id)}" class="rt-leg" aria-labelledby="${a(id)}-h">${head}${gaps}
        <details class="rt-fold">
          <summary><span class="rt-sum">${h(leg.name || `${place(leg.from)} to ${place(leg.to)}`)} · ${mi(leg.lengthMiles)} mapped miles · ${listed ? plural(listed, 'listed stop') : 'nothing listed'}${listed > leg.stops.length ? ` (${listed - leg.stops.length} not measured)` : ''}</span>${towns.length ? `<span class="rt-sum-towns">${h(towns.join(', '))}</span>` : `<span class="rt-sum-towns">Open for the sketch of this leg</span>`}</summary>
          ${legMap(leg, `map-${leg.id}`)}
          ${body}${holes}
        </details>
      </section>`;
}

// With collapsed legs: open the leg that holds the linked stop or stretch, or the leg itself when its heading is the
// target. The page is complete without this; browsers that open <details> for a fragment on their own lose nothing.
const OPEN_FOLD_JS = `<script>(function(){function go(){var id=decodeURIComponent(location.hash.slice(1));if(!id)return;var t=document.getElementById(id);if(!t)return;var d=t.closest('details.rt-fold');if(!d&&t.classList.contains('rt-leg'))d=t.querySelector('details.rt-fold');if(d&&!d.open){d.open=true;if(t.scrollIntoView)t.scrollIntoView();}}window.addEventListener('hashchange',go);go();})();</script>`;

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
export const EVIDENCE_HOURS = 'published visiting hours', EVIDENCE_EITHER = 'published visiting hours or a dated operating notice';
const evidenceWords = (roads: RoadView[]) => (roads.some((r) => r.stops.some((x) => x.evidenceKind === 'notice')) ? EVIDENCE_EITHER : EVIDENCE_HOURS);
/** The distinct (near limit, far limit) pairs of the stretches that show an "a little further off" group. */
const outerGroups = (road: RoadView) => [...new Set(road.legs.flatMap((l) => l.segments.filter((g) => g.outer.length && g.furtherOffMiles !== null).map((g) => `${g.limitMiles}|${g.furtherOffMiles}`)))].map((k) => k.split('|').map(Number));
/** The ordering claim for a road with further-off groups, with the limits read from its stretches. */
export const orderingNote = (road: RoadView) => {
  const g = outerGroups(road);
  return g.length === 1
    ? `Ordered by nearest mapped-road point within each displayed group; dense stretches show places within ${g[0][0]} straight-line miles first, followed by those over ${g[0][0]} and up to ${g[0][1]} miles away.`
    : 'Ordered by nearest mapped-road point within each displayed group; dense stretches show the nearer places first, followed by those a little further off.';
};
export const roadSummary = (road: RoadView) => {
  const loose = road.legs.flatMap((l) => l.unmeasured), unmeasured = loose.reduce((k, u) => k + u.stops.length, 0);
  const n = road.stops.length - unmeasured, other = road.stops.filter((s) => !fromOwnSite(s)).length, c = road.config, groups = outerGroups(road);
  const lead = c.distanceTo === 'any-way'
    // Distance is to any mapped alignment; miles are on the one line chosen for each leg. Two measurements, said as two.
    ? `${plural(n, 'listed brewery', 'listed breweries')} within ${c.maxDetourMiles} straight-line miles of an alignment in our downloaded ${c.shortName} mapping; these are not driving distances. Their mile positions are measured separately, on the one line we measure along for each leg. `
    : groups.length
      // A road with "a little further off" groups: the order restarts in each, so the claim is qualified.
      ? `${plural(n, 'brewery', 'breweries')}${c.startingList ? '' : ' from our directory'} within ${c.maxDetourMiles} straight-line miles of our mapped line of ${c.shortName}; these are not driving distances. ${orderingNote(road)} `
      : `${plural(n, 'brewery', 'breweries')}${c.startingList ? '' : ' from our directory'} within ${c.maxDetourMiles} straight-line miles of our mapped line of ${c.shortName}, ordered by their nearest point along it; these are not driving distances. `;
  return lead
    + (unmeasured ? `${unmeasured} more ${unmeasured === 1 ? 'is' : 'are'} listed without a distance where ${c.distanceTo === 'any-way' ? 'the mapping' : 'that line'} is missing (${loose.map((u) => u.name.replace(/^In /, '')).join(', ')}). ` : '')
    + `Each listing is supported by ${evidenceWords([road])} read on the date shown.${other ? ` For ${other}, the source is not the brewery's own site.` : ''}`;
};
/**
 * The section in one or two sentences, for places that link to it (/trails, llms.txt). Says the same thing as the pages
 * do: ordered by nearest point, dated source checks, and third-party sources only when there are some.
 */
export const roadsBlurb = (roads: RoadView[]) =>
  `Breweries near one road, listed by where they fall along it, with straight-line distances that are not driving distances. Each listing is supported by ${evidenceWords(roads)} read on the date shown${roads.some((r) => thirdPartyHosts(r).length) ? '; some sources are third-party' : ''}.`;

export function roadTripPage(road: RoadView, o: RoadPageOptions = {}): string {
  T = termsFor(road); showPlacement = byCohort(road); isInterstate = road.config.interstate === true;
  const update = newestFirst(road)[0], by = (m: string) => road.stops.filter((s) => s.placedBy === m).length;
  const c = road.config, url = `${SITE}/roads/${c.slug}`, title = roadTitle(road);
  const holes = road.legs.flatMap((l) => l.unmeasured), hasOuter = road.legs.some((l) => l.segments.some((g) => g.outer.length));
  const through = road.legs.filter((l) => !l.side), sides = road.legs.filter((l) => l.side);
  const totalMiles = through.reduce((n, l) => n + l.lengthMiles, 0);
  const joined = road.legs.filter((l) => l.joins > 0);
  const others = thirdPartyHosts(road), byEye = road.stops.filter((s) => s.browserChecked).length;
  const listedOn = (l: LegView) => l.stops.length + l.unmeasured.reduce((k, u) => k + u.stops.length, 0);
  // Named legs (states) get one jump link each; otherwise one per stretch that has stops.
  const jump = road.legs.flatMap((l) => l.name
    ? [`<li><a href="#leg-${a(l.id)}">${h(l.name)} (${listedOn(l)})</a></li>`]
    : l.stops.length
      ? l.segments.filter((g) => g.stops.length + g.outer.length).map((g) => `<li><a href="#seg-${a(l.id)}-${a(g.id)}">${h(g.name)} (${g.stops.length + g.outer.length})</a></li>`)
      : [`<li><a href="#leg-${a(l.id)}">${h(place(l.from))} to ${h(place(l.to))}</a></li>`]);

  const content = `${STYLE}
  <div class="trail-hero">
    <div class="container">${breadcrumb([{ name: 'Home', href: '/' }, { name: 'Road trips', href: '/roads' }, { name: c.name }])}
      <h1 style="color: #fff;">${h(title)}</h1>
      <p style="opacity: 0.92; max-width: 40rem;">${h(roadSummary(road))} It is not every brewery near the road. Check current opening information with each brewery before you travel.</p>
      <ul class="rt-hero-facts">
        <li><b>${road.stops.length}</b>listed stops</li>
        <li><b>${h(totalMiles.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }))}</b>miles of ${T.anyWay ? 'measuring line' : 'mapped line'} in ${plural(through.length, 'leg')}${sides.length ? `, plus ${plural(sides.length, 'side leg')}` : ''}</li>
        <li>Source-check dates <b style="margin-left:.3rem">${h(road.checkedFrom === road.checkedTo ? road.checkedTo : `${road.checkedFrom} to ${road.checkedTo}`)}</b></li>
      </ul>
    </div>
  </div>

  <div class="container my-4 rt">
    <div class="rt-wrap">${drivingNote(road)}${update ? `
      <div class="rt-note" role="note"><p><strong>Updated ${h(longDate(update.date))}:</strong> ${h(updateSummary(update))} <a href="#${a(updateAnchor(update))}">What changed, stop by stop</a>.</p></div>` : ''}
      <p>${h(c.about)}</p>
      <p>${h(byCohort(road) ? cohortLine(road.cohort!, checkedWhen(road)) : coverageText(road.decided, road.candidates, c.maxDetourMiles, T.anyWay ? `a mapped alignment of ${c.shortName}` : `our mapped line of ${c.shortName}`, c.startingList))}${byCohort(road) ? ' <a href="#how">How this list was made</a>.' : ''}</p>
      <nav aria-label="Stretches of the road">
        ${c.collapseLegs ? `<p class="rt-sub">${road.legs.every((l) => l.name) ? 'Jump to a state. Each one opens to show its stops.' : 'Jump to a stretch. Its leg opens to show the stops.'}</p>` : ''}<ul class="rt-jump">${jump.join('')}</ul>
      </nav>
      ${road.legs.map((l, i) => legSection(road, l, i + 1, o)).join('')}
${updateEntries(road)}

      <section aria-labelledby="how" class="rt-how">
        <h2 id="how">How this list was made</h2>
        <ul>
          <li><strong>The road.</strong> ${h(c.geometry.source)} on ${h(c.geometry.downloaded)}. ${OSM_LINK}; the data is available under the Open Database License. Where the road has two carriageways we measure along one. This is our mapped line.${joined.length ? ` Where two mapped ways do not quite meet we join them with a straight line: ${h(joined.map((l) => `${l.name || `${place(l.from)} to ${place(l.to)}`} ${plural(l.joins, 'join')} totalling ${l.joinedMiles.toFixed(2)} miles (widest ${l.widestJoinMiles.toFixed(2)})`).join('; '))}.` : ''}</li>${(c.methodNotes ?? []).map((t) => { const i = t.indexOf('. '); return `
          <li><strong>${h(i > 0 ? t.slice(0, i + 1) : '')}</strong>${h(i > 0 ? t.slice(i + 1) : t)}</li>`; }).join('')}
${showPlacement ? `
          <li><strong>Coverage.</strong> ${h(cohortText(road.cohort!, c.maxDetourMiles, checkedWhen(road)))}${road.notListed.length ? `
            <details class="rt-notlisted">
              <summary>The ${road.notListed.length} with published visiting hours that are not listed, and why</summary>
              <p class="rt-src">None of these is a finding that the brewery has closed.</p>
              <ul>${road.notListed.map((x) => `<li><strong>${h(x.name)}</strong>: ${h(x.reason)}.</li>`).join('')}</ul>
            </details>` : ''}</li>
          <li><strong>Placing a brewery.</strong> Each stop is measured from coordinates tied to the address the brewery prints, and each stop says which kind it has. ${plural(by('census'), 'stop uses', 'stops use')} the US Census geocoder’s point for an exact match of the printed address (street number, direction, street name, suffix, town and state). These are address-geocoded estimates, not surveyed entrances. ${plural(by('directory'), 'stop uses', 'stops use')} our directory’s map point, where the printed address is the directory’s address in full and the point is not a known placeholder: a point shared by two or more listings, or one that an exact address match shows to be more than a mile out. ${plural(by('reviewed'), 'stop is a reviewed exception', 'stops are reviewed exceptions')}: the geocoder matched the address with a difference in how it is written, and an editor recorded why it is the same address; the reason is shown under the stop. Nearness to the directory’s point is never enough on its own. A brewery with none of these is not listed.</li>` : ''}${c.legsNote ? `
          <li><strong>The legs.</strong> ${h(c.legsNote)}</li>` : ''}${isInterstate ? `
          <li><strong>Exits and access.</strong> ${h(INTERSTATE_NOTICE)} We do not say which exit serves a brewery.</li>` : ''}
          <li><strong>Order and miles.</strong> ${hasOuter || holes.length
            ? `Measured stops are ordered by their nearest point along ${T.line}, within each displayed group${hasOuter ? ' (a dense stretch has a main list and an “a little further off” list, each in its own order)' : ''}.${holes.length ? ` Stops ${h(holes.map((u) => u.name.replace(/^In /, 'in ')).join(' and '))} are alphabetical.` : ''}`
            : `Stops are ordered by their nearest point along ${T.line}.`} The mile beside a stop is the distance along that line from the start of the leg to that nearest point. It is our calculation, not a milepost, and it is not the order or the distance you would drive.</li>
          <li><strong>Distance from the road.</strong> ${T.anyWay
            ? 'A straight line from the brewery to the nearest alignment in our downloaded mapping, of any date. It is a separate measurement from the mile: it is not taken to the line we measure miles along, and never to a join across a gap.'
            : 'A straight line from the brewery to the nearest point on our mapped line.'} Driving distance and access may differ substantially.</li>
          <li><strong>Who is listed.</strong> A brewery is here when it is ${c.startingList ? `on the list we started from (${h(c.startingList)})` : 'in our directory'}, sits within ${c.maxDetourMiles} straight-line miles of ${T.anyWay ? 'a mapped alignment' : 'our mapped line'}, and its listing is supported by ${h(evidenceWords([road]))} that we read on the date shown.${holes.length ? ` The stops ${h(holes.map((u) => u.name.replace(/^In /, 'in ')).join(' and '))} are the exception to the distance test: the mapping is missing there, so they are listed in a labelled group of their own with no distance.` : ''}${c.stopsHavePages === false ? ' Each stop must also have a street address we can source and a link to the brewery’s own site.' : ''} Ones we found closed or moved, and ones we could not confirm, are left out.${road.unplaced ? ` ${plural(road.unplaced, 'more brewery', 'more breweries')} with that evidence ${road.unplaced === 1 ? 'is' : 'are'} left out because we could not tie coordinates to the printed address (no Census match, or no printed address to check against), so we could not place ${road.unplaced === 1 ? 'it' : 'them'}.` : ''}</li>
          <li><strong>Sources.</strong> Each excerpt is copied from the page linked under it, on the date shown. Addresses are copied from the page named beside them.${others.length ? ` For ${plural(road.stops.filter((s) => !fromOwnSite(s)).length, 'stop')} the source is not the brewery's own site: ${h(others.map((x) => (x === 'untappd.com' ? 'Untappd (untappd.com)' : x)).join(', '))}.` : ''}${byEye ? ` ${plural(byEye, 'page')} could only be read in a browser; a person read ${byEye === 1 ? 'it' : 'those'}, not our checking script.` : ''}</li>
          <li><strong>Towns.</strong> ${c.startingList ? 'The town shown with a stop is the one its printed address names. Where the address names no town, it is the one in the list we started from.' : c.addressMustMatch ? 'The town shown with a stop is the one its printed address names. Where the address names no town, it is the one in our directory.' : "Town names are the ones in our directory. A brewery's printed address sometimes names a different post-office town."}</li>
          <li><strong>Google Maps links.</strong> We send Google the brewery name and sourced address where available. Otherwise we use its name and ${c.startingList ? 'listed' : 'directory'} town and state; town and state may also supplement an incomplete address. Check the destination before travelling. Google chooses the route, which may not follow the road.</li>
          <li><strong>Opening hours.</strong> The hours under a stop are quoted as the source printed them on the date we read them. They support listing the brewery as operating. They do not mean it was open on that date, and they are not a current timetable. Check current opening information with the brewery before you travel.</li>
        </ul>
        <details>
          <summary>Sources for what we say about the road</summary>
          ${c.roadSources.map((s) => `<blockquote>“${h(s.quote)}”</blockquote><p class="rt-src">${ext(safeHttpUrl(s.url), hostOf(s.url))}, checked ${h(s.checked)}</p>`).join('')}
        </details>
        <p class="mt-3"><a href="/roads">All road trips</a></p>
      </section>
    </div>
  </div>
  ${c.collapseLegs ? OPEN_FOLD_JS : ''}
  <script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org', '@type': 'TouristTrip', name: title, url, description: roadSummary(road),
    touristType: 'Craft beer travelers',
    itinerary: {
      '@type': 'ItemList', numberOfItems: road.stops.length,
      itemListElement: road.stops.map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: {
        '@type': 'Brewery', name: s.name, url: s.breweryId !== undefined ? `${SITE}/brewery/${s.breweryId}` : safeHttpUrl(s.website) || undefined, sameAs: s.breweryId !== undefined ? safeHttpUrl(s.website) || undefined : undefined,
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
          <p>${h(roadSummary(r))}</p>${byCohort(r) ? `
          <p>${h(cohortText(r.cohort!, r.config.maxDetourMiles, checkedWhen(r)))}</p>` : ''}${r.config.legsNote ? `
          <p>${h(r.config.legsNote)}</p>` : ''}
          <ul>${r.legs.map((l) => { const k = l.stops.length + l.unmeasured.reduce((q, u) => q + u.stops.length, 0); return `<li>${l.name ? `${h(l.name)}${l.side ? '' : `: ${h(place(l.from))} to ${h(place(l.to))}`}` : `${h(place(l.from))} to ${h(place(l.to))}`}: ${mi(l.lengthMiles)} miles of mapped line, ${k ? plural(k, 'listed stop') : 'nothing listed'}; ${byCohort(r) && l.cohort ? `${plural(l.cohort.total, 'directory candidate')} checked, published visiting hours found for ${l.cohort.withHours}` : l.candidates ? `a decision reached on ${l.decided} of ${l.candidates} nearby ${r.config.startingList ? 'breweries we started from' : 'directory breweries'}` : 'no nearby brewery on the list we started from'}</li>`; }).join('')}</ul>
          <p><a href="/roads/${a(r.config.slug)}">See the list for ${h(r.config.shortName)}</a></p>
        </li>`;
  const content = `${STYLE}
  <div class="trail-hero">
    <div class="container">${breadcrumb([{ name: 'Home', href: '/' }, { name: 'Road trips' }])}
      <h1 style="color: #fff;">Brewery road trips, one road at a time</h1>
      <p style="opacity: 0.92; max-width: 40rem;">Each page lists breweries near one road, by where they fall along our mapping of that road, with a straight-line distance and the ${h(evidenceWords(roads))} that support each listing, with the date we read them. These are not driving distances.</p>
    </div>
  </div>
  <div class="container my-4 rt">
    <div class="rt-wrap">${drivingNote()}
      <p>${h(PLAN_NOTICE)} On an interstate, a brewery’s nearest road point is not an exit or an access point.</p>
      <ul class="rt-cards">${roads.map(card).join('')}
      </ul>
      <section aria-labelledby="roads-how" class="rt-how">
        <h2 id="roads-how">What makes a road page</h2>
        <ul>
          <li>A road page is published only after an editor has reviewed it. Each page says where its starting list came from, how many of those candidates had published visiting hours, how many meet the page’s location and distance requirements, and what became of the rest. It is not a claim that every brewery near the road was reviewed.</li>
          <li>Measured stops are ordered by their nearest mapped-road point within each displayed group, with a straight-line distance. Where a stretch is dense, the nearer places are shown first and those a little further off follow as a group of their own. Each page says exactly what its distance is measured to, and names any group that is ordered or measured differently. These are not driving distances. Long gaps between listed stops are marked.</li>
          <li>Each stop carries the ${h(evidenceWords(roads))} that support its listing, the date we read them, and a link to that page. Check current opening information with the brewery before you travel.</li>
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
    description: `Breweries near one road, listed by where they fall along it, with straight-line distances and ${evidenceWords(roads)} read on the date shown.`,
    url, subdomain,
  });
}
