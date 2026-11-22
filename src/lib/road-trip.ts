// Single-road brewery trips (/roads): the road-line maths, the build step that turns checked rows into stops, and the
// gate that decides what may be shown (a stop needs dated evidence that the place was operating). Pure functions and types, NO imports, so the build script
// (scripts/build-road-trip.mjs, plain Node) and the unit tests run exactly this code.
//
// A road arrives as an unordered pile of OpenStreetMap ways, each a list of [lat, lon] points, with both carriageways
// of every divided stretch. stitchLeg() turns that into one ordered line per leg: the ways become a graph (points that
// share a coordinate are one node), and the line is the shortest path through that graph from the leg's start to its
// end. A divided stretch contributes one carriageway, because the path can only use one; side spurs drop out for the
// same reason. Where two ways do not quite meet, way ends within `bridgeMiles` are joined, and the joined distance is
// reported so a build can refuse a line with holes in it.
//
// Distances are miles. "Along" is distance along the stitched line from the leg's start; "detour" is the straight-line
// distance from a point to the nearest point on that same line, which is not a driving distance.

export type LatLon = [number, number];

const EARTH_MILES = 3958.8;
const RAD = Math.PI / 180;

/** Great-circle distance in miles. */
export function milesBetween(a: LatLon, b: LatLon): number {
  const dLat = (b[0] - a[0]) * RAD, dLon = (b[1] - a[1]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.sqrt(h));
}

/** Nearest point on segment a-b to p: distance in miles and how far along the segment (0 to 1) it falls. */
export function pointToSegment(p: LatLon, a: LatLon, b: LatLon): { miles: number; t: number } {
  // Flat projection centred on p: good to well under 1% at the few-mile distances used here.
  const c = Math.cos(p[0] * RAD);
  const ax = (a[1] - p[1]) * RAD * EARTH_MILES * c, ay = (a[0] - p[0]) * RAD * EARTH_MILES;
  const bx = (b[1] - p[1]) * RAD * EARTH_MILES * c, by = (b[0] - p[0]) * RAD * EARTH_MILES;
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, -(ax * dx + ay * dy) / len2));
  return { miles: Math.hypot(ax + t * dx, ay + t * dy), t };
}

/** Running distance along a line: cum[i] is the miles from the first point to point i. */
export function cumulativeMiles(line: LatLon[]): number[] {
  const cum = [0];
  for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + milesBetween(line[i - 1], line[i]));
  return cum;
}

/** Where a point falls on an ordered line: miles along from the start, and the straight-line distance to the line. */
export function projectOntoLine(p: LatLon, line: LatLon[], cum: number[] = cumulativeMiles(line)): { along: number; detour: number } {
  if (line.length === 0) throw new Error('projectOntoLine: empty line');
  if (line.length === 1) return { along: 0, detour: milesBetween(p, line[0]) };
  let best = { along: 0, detour: Infinity };
  for (let i = 1; i < line.length; i++) {
    const s = pointToSegment(p, line[i - 1], line[i]);
    if (s.miles < best.detour) best = { along: cum[i - 1] + s.t * (cum[i] - cum[i - 1]), detour: s.miles };
  }
  return best;
}

export interface StitchedLeg {
  line: LatLon[];          // ordered from the leg's start to its end
  lengthMiles: number;
  bridgedMiles: number;    // total length of joins across gaps between ways (0 when the ways meet end to end)
  bridges: number;
  startSnapMiles: number;  // how far the requested start and end were from the nearest mapped point
  endSnapMiles: number;
}

const key = (p: LatLon) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`;

/**
 * One ordered line from `start` to `end` through the given ways. Throws when the ways do not connect the two
 * (even after joining way ends within `bridgeMiles`), so a broken download cannot produce a short, wrong line.
 */
export function stitchLeg(ways: LatLon[][], start: LatLon, end: LatLon, opts: { bridgeMiles?: number; bridgePenalty?: number } = {}): StitchedLeg {
  const bridgeMiles = opts.bridgeMiles ?? 0.15, penalty = opts.bridgePenalty ?? 4;
  const ids = new Map<string, number>(), pts: LatLon[] = [];
  const adj: { to: number; w: number; bridge: boolean }[][] = [];
  const node = (p: LatLon) => {
    const k = key(p); let id = ids.get(k);
    if (id === undefined) { id = pts.length; ids.set(k, id); pts.push(p); adj.push([]); }
    return id;
  };
  const link = (a: number, b: number, w: number, bridge: boolean) => { adj[a].push({ to: b, w, bridge }); adj[b].push({ to: a, w, bridge }); };
  const ends: number[] = [];
  for (const w of ways) {
    if (w.length < 2) continue;
    for (let i = 1; i < w.length; i++) { const a = node(w[i - 1]), b = node(w[i]); if (a !== b) link(a, b, milesBetween(w[i - 1], w[i]), false); }
    ends.push(node(w[0]), node(w[w.length - 1]));
  }
  if (pts.length === 0) throw new Error('stitchLeg: no ways');

  // Join way ends that nearly meet. The penalty keeps the path on mapped road wherever mapped road exists.
  const uniqueEnds = [...new Set(ends)].sort((a, b) => pts[a][1] - pts[b][1]);
  const lonSpan = bridgeMiles / (EARTH_MILES * RAD * Math.cos(45 * RAD)) * 1.5;
  for (let i = 0; i < uniqueEnds.length; i++) {
    for (let j = i + 1; j < uniqueEnds.length && pts[uniqueEnds[j]][1] - pts[uniqueEnds[i]][1] <= lonSpan; j++) {
      const d = milesBetween(pts[uniqueEnds[i]], pts[uniqueEnds[j]]);
      if (d <= bridgeMiles) link(uniqueEnds[i], uniqueEnds[j], d * penalty, true);
    }
  }

  const nearest = (p: LatLon) => { let b = 0, bd = Infinity; for (let i = 0; i < pts.length; i++) { const d = milesBetween(p, pts[i]); if (d < bd) { bd = d; b = i; } } return { id: b, miles: bd }; };
  const s = nearest(start), e = nearest(end);

  // Dijkstra with a binary heap.
  const dist = new Float64Array(pts.length).fill(Infinity), prev = new Int32Array(pts.length).fill(-1), prevBridge = new Uint8Array(pts.length);
  const heap: [number, number][] = [[0, s.id]]; dist[s.id] = 0;
  const push = (item: [number, number]) => { heap.push(item); let i = heap.length - 1; while (i > 0) { const up = (i - 1) >> 1; if (heap[up][0] <= heap[i][0]) break; [heap[up], heap[i]] = [heap[i], heap[up]]; i = up; } };
  const pop = (): [number, number] => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } }
    return top;
  };
  while (heap.length) {
    const [d, u] = pop();
    if (d > dist[u]) continue;
    if (u === e.id) break;
    for (const edge of adj[u]) {
      const nd = d + edge.w;
      if (nd < dist[edge.to]) { dist[edge.to] = nd; prev[edge.to] = u; prevBridge[edge.to] = edge.bridge ? 1 : 0; push([nd, edge.to]); }
    }
  }
  if (!Number.isFinite(dist[e.id])) throw new Error(`stitchLeg: the ways do not connect the start to the end (joining ends within ${bridgeMiles} mi)`);

  const path: number[] = []; let bridges = 0, bridgedMiles = 0;
  for (let u = e.id; u !== -1; u = prev[u]) {
    path.push(u);
    if (prev[u] !== -1 && prevBridge[u]) { bridges++; bridgedMiles += milesBetween(pts[u], pts[prev[u]]); }
  }
  const line = path.reverse().map((i) => pts[i]);
  const cum = cumulativeMiles(line);
  return { line, lengthMiles: cum[cum.length - 1], bridgedMiles, bridges, startSnapMiles: s.miles, endSnapMiles: e.miles };
}

/** Fewer points for drawing (Douglas-Peucker). `toleranceMiles` is the most a dropped point may sit off the kept line. */
export function simplifyLine(line: LatLon[], toleranceMiles: number): LatLon[] {
  if (line.length <= 2) return line.slice();
  const keep = new Uint8Array(line.length); keep[0] = keep[line.length - 1] = 1;
  const stack: [number, number][] = [[0, line.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let far = -1, farD = toleranceMiles;
    for (let i = a + 1; i < b; i++) { const d = pointToSegment(line[i], line[a], line[b]).miles; if (d > farD) { farD = d; far = i; } }
    if (far !== -1) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return line.filter((_, i) => keep[i]);
}

// ---------------------------------------------------------------------------------------------------------------------
// Data shapes

export interface QuoteSource { quote: string; url: string; checked: string }

/**
 * A stretch of a leg. `toMile` is where it ends along the leg; null means "to the end". Without a `name` the page names
 * it by the towns of its stops, so a heading never names a town that has no listed stop.
 */
export interface RoadSegmentConfig { id: string; name?: string; toMile: number | null; maxDetourMiles?: number; link?: { href: string; text: string } }
export interface RoadLegConfig {
  id: string;
  from: string; to: string;          // place names at each end, supported by the road's roadSources
  start: LatLon; end: LatLon;        // ends of the mapped line (snapped to the nearest mapped point)
  lonRange: [number, number];        // which downloaded ways belong to this leg
  segments: RoadSegmentConfig[];
}
/** The hand-written part of a road: what it is, how it is cut up, and the sources for what we say about the road. */
export interface RoadConfig {
  slug: string;
  name: string;            // "US Route 422"
  shortName: string;       // "US 422"
  /**
   * The editor's say-so. A road has a page, links, a sitemap entry and brewery-page cards only when this is exactly
   * true AND it has listed stops. Having stops is never enough on its own: set this after the page has been reviewed.
   */
  publish: boolean;
  headline?: boolean;      // the trip the /roads index leads with
  maxDetourMiles: number;  // straight-line distance from the mapped line within which a brewery is listed
  gapNoteMiles: number;    // a gap at least this long between listed stops gets a note
  geometry: { source: string; downloaded: string };
  about: string;           // what the page says about the road itself; every statement in it is supported by roadSources
  roadSources: QuoteSource[];
  legs: RoadLegConfig[];
}

/** A row from the brewery directory that lies near the road. Not shown anywhere until a checked row qualifies it. */
export interface CandidateRow { id: number; name: string; city: string; state: string; latitude: number; longitude: number }
/** Proof the place was operating: a verbatim excerpt (printed visiting hours, a dated notice), its page, the day read. */
export interface OperatingEvidence { excerpt?: string | null; url?: string | null; checked?: string | null }
/** A checker's finding for one candidate. Only status OPEN with operating evidence becomes a stop. */
export interface VerifiedRow {
  id: number; name?: string | null; status?: string | null; official_url?: string | null;
  address_as_printed?: string | null; address_source_url?: string | null;
  quote?: string | null; quote_source_url?: string | null; notes?: string | null; checked?: string | null;
  operating_evidence?: OperatingEvidence | null;
  browser_checked?: string | null; // the day a person read the row's sources on the rendered page, for sites a script cannot read
}

export interface RoadStop {
  breweryId: number; name: string; town: string; state: string; lat: number; lon: number;
  status: string;              // as the checker recorded it; only "OPEN" is ever shown
  website: string;             // the brewery's own site as the checker found it ('' when none)
  address: string;             // as printed at addressSourceUrl ('' when there is no sourced address)
  addressSourceUrl: string;
  evidence: string; evidenceUrl: string; evidenceChecked: string; // why it is listed as open: excerpt, page, day read
  quote: string; quoteSourceUrl: string; // an optional descriptive quote ('' when none) and its page
  checked: string;             // the day the checker's row was made
  legId: string;
  mile: number;                // along the leg's mapped line from its start, at the point nearest the brewery
  detourMiles: number;         // straight-line distance to that nearest point (not a driving distance)
  pastEnd: '' | 'start' | 'end'; // the nearest point on the line is the end of the line itself
  browserChecked?: string;     // set only when the checker's row records a browser check on a real date
}
/** `candidates`: directory breweries within the limit of this leg. `decided`: how many of those have a completed decision. */
export interface BuiltLeg { id: string; lengthMiles: number; line: LatLon[]; candidates: number; decided: number }
/** What the build step writes: stops with their place on the road, and a thinned line for drawing. */
export interface BuiltRoad { slug: string; built: string; legs: BuiltLeg[]; stops: RoadStop[] }
export interface BuildReport {
  left: { id: number; name: string; reason: string }[];
  undecided: { id: number; name: string; why: string }[];
  legs: { id: string; lengthMiles: number; bridges: number; bridgedMiles: number; points: number }[];
}

// ---------------------------------------------------------------------------------------------------------------------
// The gate

/** Today as YYYY-MM-DD. Call it while handling a request: at a Worker's top level the clock reads 1970. */
export const currentDate = (): string => new Date().toISOString().slice(0, 10);
const httpUrl = (v: unknown): string => {
  if (typeof v !== 'string' || !v.trim()) return '';
  try { const u = new URL(v.trim()); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : ''; } catch { return ''; }
};
const calendarDate = (v: unknown): v is string => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
// Sources this site does not cite.
const BARRED_HOSTS = /(^|\.)(facebook\.com|fb\.com|reddit\.com|nextdoor\.com)$/i;
const citable = (v: unknown): string => { const u = httpUrl(v); return u && !BARRED_HOSTS.test(new URL(u).hostname) ? u : ''; };

/**
 * The one rule for what may appear as a stop: the checker found it OPEN, and there is operating evidence (an excerpt
 * showing the place was operating, the page it came from, and the day it was read), with no date in the future.
 * A quote alone is not enough. Everything else (closed, moved, unconfirmed, unchecked, or missing any part of the
 * evidence) is left out. The build step applies this, and so does the page each time it is made, so a hand-edited data
 * file cannot get around it. With the clock unset (1970, a Worker's top level) every date is in the future: nothing shows.
 */
export function isShowableStop(s: Partial<RoadStop> | null | undefined, today: string = currentDate()): s is RoadStop {
  return !!s && s.status === 'OPEN'
    && Number.isInteger(s.breweryId) && (s.breweryId as number) > 0
    && typeof s.name === 'string' && s.name.trim() !== ''
    && typeof s.evidence === 'string' && s.evidence.trim() !== ''
    && citable(s.evidenceUrl) !== ''
    && calendarDate(s.evidenceChecked) && s.evidenceChecked <= today
    && calendarDate(s.checked) && s.checked <= today
    && Number.isFinite(s.mile) && Number.isFinite(s.detourMiles) && (s.detourMiles as number) >= 0
    && typeof s.legId === 'string';
}

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** A link inside this site: one leading slash, then plain path characters. No scheme, no "//", no backslash, no control characters. '' when it is anything else. */
export function safeSitePath(href: unknown): string {
  return typeof href === 'string' && /^\/(?!\/)[A-Za-z0-9\-._~/?#=&%+]*$/.test(href) && !href.includes('\\') ? href : '';
}
/** What is wrong with a road's config, as plain sentences; empty when it is fit to use. A road with problems is never available. */
export function roadConfigProblems(c: RoadConfig): string[] {
  const out: string[] = [];
  if (!ID.test(String(c?.slug ?? ''))) out.push(`slug ${JSON.stringify(c?.slug)} must be lower-case letters, digits and single hyphens`);
  if (!(c?.maxDetourMiles > 0) || !(c?.gapNoteMiles > 0)) out.push('maxDetourMiles and gapNoteMiles must be positive numbers');
  const legIds = new Set<string>();
  for (const leg of c?.legs ?? []) {
    if (!ID.test(String(leg.id))) out.push(`leg id ${JSON.stringify(leg.id)} must be lower-case letters, digits and single hyphens`);
    if (legIds.has(leg.id)) out.push(`leg id ${leg.id} is used twice`); legIds.add(leg.id);
    const segIds = new Set<string>();
    for (const g of leg.segments ?? []) {
      if (!ID.test(String(g.id))) out.push(`segment id ${JSON.stringify(g.id)} must be lower-case letters, digits and single hyphens`);
      if (segIds.has(g.id)) out.push(`segment id ${g.id} is used twice in leg ${leg.id}`); segIds.add(g.id);
      if (g.link && !safeSitePath(g.link.href)) out.push(`segment ${g.id}: link ${JSON.stringify(g.link.href)} must be a path on this site starting with one "/"`);
    }
  }
  if (!c?.legs?.length) out.push('a road needs at least one leg');
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Re-checking sources (scripts/verify-road-sources.mjs)

export const BROWSER_CHECK_MAX_DAYS = 45;
/**
 * What to call a source the script could not read. A person may have read it in a browser: that is recorded with its
 * date and counted on its own, never as script-verified, and it stops counting once it is older than 45 days.
 */
export function unreadVerdict(browserChecked: string | null | undefined, today: string): 'browser-checked' | 'browser-check-stale' | 'unread' {
  if (!calendarDate(browserChecked) || !calendarDate(today)) return 'unread';
  const days = (Date.parse(today + 'T00:00:00Z') - Date.parse(browserChecked + 'T00:00:00Z')) / 86_400_000;
  return days < 0 ? 'unread' : days <= BROWSER_CHECK_MAX_DAYS ? 'browser-checked' : 'browser-check-stale';
}
/** Exit 0 only when nothing is missing and every source the script could not read has a current browser check. */
export const verifierExit = (c: { total: number; missing: number; unread: number; stale: number }): 0 | 2 => (c.total > 0 && !c.missing && !c.unread && !c.stale ? 0 : 2);

// ---------------------------------------------------------------------------------------------------------------------
// Build: checked rows + directory coordinates + the road's ways -> stops ordered by nearest point along the line

const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;
const PAST_END_MILES = 0.25;
/** Statuses that settle a candidate without listing it. UNCONFIRMED settles nothing. */
export const DECIDED_NOT_LISTED = ['CLOSED', 'MOVED/RENAMED', 'DUPLICATE', 'NOT A BREWERY TAPROOM'];

export function segmentAt(leg: RoadLegConfig, mile: number): RoadSegmentConfig {
  return leg.segments.find((g) => g.toMile === null || mile < g.toMile) || leg.segments[leg.segments.length - 1];
}

export function buildRoad(config: RoadConfig, ways: LatLon[][], candidates: CandidateRow[], verified: VerifiedRow[], built: string, today: string = currentDate()): { road: BuiltRoad; report: BuildReport } {
  const problems = roadConfigProblems(config);
  if (problems.length) throw new Error(`road config: ${problems.join('; ')}`);
  const report: BuildReport = { left: [], undecided: [], legs: [] };
  const legs = config.legs.map((leg) => {
    const legWays = ways.filter((w) => w.length > 0 && w[0][1] >= leg.lonRange[0] && w[0][1] < leg.lonRange[1]);
    const st = stitchLeg(legWays, leg.start, leg.end);
    if (st.startSnapMiles > 0.5 || st.endSnapMiles > 0.5) throw new Error(`${config.slug}/${leg.id}: the configured ends are ${st.startSnapMiles.toFixed(2)} and ${st.endSnapMiles.toFixed(2)} miles from the mapped road`);
    if (st.bridgedMiles > 0.5) throw new Error(`${config.slug}/${leg.id}: ${st.bridgedMiles.toFixed(2)} miles of the line are joins across gaps in the download`);
    if (!leg.segments.length || leg.segments[leg.segments.length - 1].toMile !== null) throw new Error(`${config.slug}/${leg.id}: the last segment must run to the end (toMile: null)`);
    leg.segments.forEach((g, i) => { const prev = i ? leg.segments[i - 1].toMile! : 0; if (g.toMile !== null && (g.toMile <= prev || g.toMile >= st.lengthMiles)) throw new Error(`${config.slug}/${leg.id}/${g.id}: toMile ${g.toMile} is out of order or past the end (${st.lengthMiles.toFixed(1)} mi)`); });
    report.legs.push({ id: leg.id, lengthMiles: st.lengthMiles, bridges: st.bridges, bridgedMiles: st.bridgedMiles, points: st.line.length });
    return { leg, st, cum: cumulativeMiles(st.line), candidates: 0, decided: 0 };
  });

  // Where each directory candidate falls: its nearest leg, the mile there, and the straight-line distance to the line.
  const placed = new Map<number, { cand: CandidateRow; l: (typeof legs)[number]; along: number; detour: number; within: boolean }>();
  for (const cand of candidates) {
    if (!Number.isInteger(cand?.id) || placed.has(cand.id) || !Number.isFinite(cand.latitude) || !Number.isFinite(cand.longitude)) continue;
    const p: LatLon = [cand.latitude, cand.longitude];
    const near = legs.map((l) => ({ l, on: projectOntoLine(p, l.st.line, l.cum) })).sort((a, b) => a.on.detour - b.on.detour)[0];
    const limit = segmentAt(near.l.leg, near.on.along).maxDetourMiles ?? config.maxDetourMiles;
    placed.set(cand.id, { cand, l: near.l, along: near.on.along, detour: near.on.detour, within: near.on.detour <= limit });
  }

  const seen = new Set<number>(), decided = new Set<number>(), stops: RoadStop[] = [];
  for (const row of verified) {
    const label = String(row?.name || `id ${row?.id}`);
    const leave = (reason: string) => report.left.push({ id: row?.id, name: label, reason });
    const at = placed.get(row?.id);
    if (!at) { leave('not among the directory candidates for this road (or no coordinates)'); continue; }
    if (seen.has(row.id)) { leave('second row for the same brewery id'); continue; }
    seen.add(row.id);
    if (row.status !== 'OPEN') {
      if (DECIDED_NOT_LISTED.includes(String(row.status))) decided.add(row.id);
      leave(`status ${row.status || 'missing'}`); continue;
    }
    const { cand, l, along, detour } = at;
    const mile = round(along, 1), detourMiles = round(detour, 2);
    if (!at.within) { decided.add(row.id); leave(`${detourMiles} mi from the mapped line, over the limit`); continue; }
    const atStart = along < 0.02, atEnd = along > l.st.lengthMiles - 0.02;
    const ev = row.operating_evidence || {};
    const quoteUrl = citable(row.quote_source_url), quote = quoteUrl ? String(row.quote || '').trim() : '';
    const stop: RoadStop = {
      breweryId: row.id, name: String(row.name || cand.name || '').trim(), town: String(cand.city || '').trim(), state: String(cand.state || '').trim(),
      lat: cand.latitude, lon: cand.longitude, status: 'OPEN',
      website: citable(row.official_url),
      address: citable(row.address_source_url) ? String(row.address_as_printed || '').trim() : '',
      addressSourceUrl: String(row.address_as_printed || '').trim() ? citable(row.address_source_url) : '',
      evidence: String(ev.excerpt || '').trim(), evidenceUrl: citable(ev.url), evidenceChecked: String(ev.checked || '').trim(),
      quote, quoteSourceUrl: quote ? quoteUrl : '', checked: String(row.checked || '').trim(),
      legId: l.leg.id, mile, detourMiles,
      pastEnd: detour > PAST_END_MILES && (atStart || atEnd) ? (atStart ? 'start' : 'end') : '',
      ...(calendarDate(row.browser_checked) ? { browserChecked: row.browser_checked as string } : {}),
    };
    if (!isShowableStop(stop, today)) { leave('marked OPEN, but there is no usable operating evidence (excerpt, citable URL and a check date that is not in the future)'); continue; }
    decided.add(row.id);
    stops.push(stop);
  }
  // Coverage: of the directory candidates within the limit, how many have a completed decision (listed, or settled as
  // closed, moved, duplicate or not a taproom). Unconfirmed rows, rows marked OPEN without evidence and candidates with
  // no row at all are undecided.
  for (const [id, at] of placed) {
    if (!at.within) continue;
    at.l.candidates++;
    if (decided.has(id)) at.l.decided++;
    else report.undecided.push({ id, name: at.cand.name, why: seen.has(id) ? 'checked without a completed decision' : 'no checked row' });
  }
  const order = new Map(config.legs.map((l, i) => [l.id, i]));
  stops.sort((a, b) => order.get(a.legId)! - order.get(b.legId)! || a.mile - b.mile || a.detourMiles - b.detourMiles || a.name.localeCompare(b.name));
  return {
    road: {
      slug: config.slug, built,
      legs: legs.map((l) => ({ id: l.leg.id, lengthMiles: round(l.st.lengthMiles, 1), line: simplifyLine(l.st.line, 0.12).map((q) => [round(q[0], 5), round(q[1], 5)] as LatLon), candidates: l.candidates, decided: l.decided })),
      stops,
    },
    report,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// View: what the page shows, worked out from the config and the built data

export interface StopView extends RoadStop { n: number; milesFromEnd: number; gapAfterMiles: number | null }
export interface SegmentView { id: string; name: string; fromMile: number; toMile: number; link?: { href: string; text: string }; stops: StopView[] }
export interface LegView {
  id: string; from: string; to: string; lengthMiles: number; line: LatLon[];
  candidates: number; decided: number; // directory breweries within the limit of this leg, and how many have a completed decision
  stops: StopView[]; segments: SegmentView[]; towns: number;
  leadGapMiles: number | null; // start of the leg to the first listed stop, when long enough to note
  longestGap: { fromMile: number; toMile: number; miles: number } | null;
}
export interface RoadView {
  config: RoadConfig; legs: LegView[]; stops: StopView[];
  candidates: number; decided: number;
  problems: string[];          // what is wrong with the config, if anything
  /** Published: the config says publish: true, the config is sound, and at least one stop passes the gate. One decision, used by every route, link and listing. */
  available: boolean;
  checkedFrom: string; checkedTo: string; // earliest and latest date among the listed stops' source checks
}

/** "Warren", "Warren and Youngstown", "A, B and C", or "A to D" for four or more towns, in list order. */
export function townsName(towns: string[]): string {
  const t = towns.filter((x, i) => x && towns.indexOf(x) === i);
  if (t.length <= 1) return t[0] || '';
  if (t.length === 2) return `${t[0]} and ${t[1]}`;
  if (t.length === 3) return `${t[0]}, ${t[1]} and ${t[2]}`;
  return `${t[0]} to ${t[t.length - 1]}`;
}

export function viewRoad(config: RoadConfig, built: BuiltRoad, today: string = currentDate()): RoadView {
  const problems = roadConfigProblems(config);
  let n = 0;
  const legs: LegView[] = (config.legs ?? []).map((leg) => {
    const b = built.legs.find((x) => x.id === leg.id);
    const length = b?.lengthMiles ?? 0, segs = leg.segments?.length ? leg.segments : [{ id: 'all', toMile: null }];
    const safeLeg = { ...leg, segments: segs };
    const shown = problems.length ? [] : built.stops.filter((s) => isShowableStop(s, today) && s.legId === leg.id && s.mile >= 0 && s.mile <= length + 0.05 && s.detourMiles <= (segmentAt(safeLeg, s.mile).maxDetourMiles ?? config.maxDetourMiles))
      .slice().sort((a, c) => a.mile - c.mile || a.detourMiles - c.detourMiles || a.name.localeCompare(c.name));
    const note = (gap: number) => (gap >= config.gapNoteMiles ? round(gap, 1) : null);
    const stops: StopView[] = shown.map((s, i) => ({ ...s, n: ++n, milesFromEnd: round(length - s.mile, 1), gapAfterMiles: note((i + 1 < shown.length ? shown[i + 1].mile : length) - s.mile) }));
    const marks = [0, ...stops.map((s) => s.mile), length];
    let longestGap: LegView['longestGap'] = null;
    if (stops.length) for (let i = 1; i < marks.length; i++) { const miles = round(marks[i] - marks[i - 1], 1); if (!longestGap || miles > longestGap.miles) longestGap = { fromMile: marks[i - 1], toMile: marks[i], miles }; }
    const segments: SegmentView[] = segs.map((g, i) => {
      const fromMile = i ? segs[i - 1].toMile! : 0, toMile = g.toMile ?? length;
      const mine = stops.filter((s) => segmentAt(safeLeg, s.mile).id === g.id);
      const href = safeSitePath(g.link?.href);
      return { id: g.id, name: g.name || townsName(mine.map((s) => s.town)) || `Mile ${Math.round(fromMile)} to ${Math.round(toMile)}`, fromMile, toMile, link: g.link && href ? { href, text: g.link.text } : undefined, stops: mine };
    });
    const candidates = Math.max(0, b?.candidates ?? 0), decided = Math.min(candidates, Math.max(0, b?.decided ?? 0));
    return {
      id: leg.id, from: leg.from, to: leg.to, lengthMiles: length, line: b?.line ?? [], candidates, decided,
      stops, segments, towns: new Set(stops.map((s) => `${s.town}, ${s.state}`)).size,
      leadGapMiles: stops.length ? note(stops[0].mile) : null, longestGap,
    };
  });
  const stops = legs.flatMap((l) => l.stops), dates = stops.flatMap((s) => [s.evidenceChecked]).sort();
  return {
    config, legs, stops, problems,
    candidates: legs.reduce((a, l) => a + l.candidates, 0), decided: legs.reduce((a, l) => a + l.decided, 0),
    available: config.publish === true && problems.length === 0 && stops.length > 0,
    checkedFrom: dates[0] || '', checkedTo: dates[dates.length - 1] || '',
  };
}
