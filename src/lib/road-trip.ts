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

/**
 * Straight-line miles from a point to the nearest part of any of the ways (every mapped alignment, either
 * carriageway). Only mapped ways count: a join across a gap is not a way. A segment is skipped only when its whole
 * bounding box, widened by `reach` degrees, misses the point, so a long segment that passes near the point is never
 * thrown out because its two ends are far away.
 */
export function distanceToWays(p: LatLon, ways: LatLon[][], reach = 0.35): number {
  let best = Infinity;
  for (const w of ways) {
    for (let i = 1; i < w.length; i++) {
      const a = w[i - 1], b = w[i];
      if (p[0] < Math.min(a[0], b[0]) - reach || p[0] > Math.max(a[0], b[0]) + reach || p[1] < Math.min(a[1], b[1]) - reach || p[1] > Math.max(a[1], b[1]) + reach) continue;
      const d = pointToSegment(p, a, b).miles;
      if (d < best) best = d;
    }
  }
  return best;
}

export interface StitchedLeg {
  line: LatLon[];          // ordered from the leg's start to its end
  lengthMiles: number;
  bridgedMiles: number;    // total length of joins across gaps between ways (0 when the ways meet end to end)
  bridges: number;
  joins: { from: LatLon; to: LatLon; miles: number }[]; // each join across a gap, in line order
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

  const path: number[] = []; let bridges = 0, bridgedMiles = 0; const joins: StitchedLeg['joins'] = [];
  for (let u = e.id; u !== -1; u = prev[u]) {
    path.push(u);
    if (prev[u] !== -1 && prevBridge[u]) { const m = milesBetween(pts[u], pts[prev[u]]); bridges++; bridgedMiles += m; joins.unshift({ from: pts[prev[u]], to: pts[u], miles: m }); }
  }
  const line = path.reverse().map((i) => pts[i]);
  const cum = cumulativeMiles(line);
  return { line, lengthMiles: cum[cum.length - 1], bridgedMiles, bridges, joins, startSnapMiles: s.miles, endSnapMiles: e.miles };
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
/**
 * A note shown with a leg, always visible. `text` is our own plain statement (leave it out when we have nothing a
 * source supports); each source may carry an `intro` saying only what the source itself establishes; `closing` ends it.
 */
export interface RoadNote { title?: string; text?: string; sources?: (QuoteSource & { intro?: string })[]; closing?: string }
export interface RoadSegmentConfig {
  id: string; name?: string; toMile: number | null;
  maxDetourMiles?: number;   // a tighter limit for a dense stretch
  /** With a tighter limit: stops between it and this distance are kept, but shown apart as "a little further off". */
  furtherOffMiles?: number;
  link?: { href: string; text: string };
  notes?: RoadNote[];        // things a traveller should know on this stretch, each with its quoted sources
}
export interface RoadLegConfig {
  id: string;
  from: string; to: string;          // place names at each end, supported by the road's roadSources
  start: LatLon; end: LatLon;        // ends of the mapped line (snapped to the nearest mapped point)
  lonRange?: [number, number];       // which downloaded ways belong to this leg (all of them when left out)
  via?: LatLon[];                    // points the line must pass through, in order (to follow one alignment where several are mapped)
  joinMiles?: number;                // widest gap between way ends that may be joined on this leg (default 0.15)
  maxJoinedMiles?: number;           // most joined distance the leg may contain in total (default 0.5); more fails the build
  name?: string;                     // a heading for the leg, such as a state ("Illinois")
  /**
   * Places where the mapped line is known to be missing (a city whose streets are not in the download). A checked,
   * evidenced brewery inside the box [south, west, north, east] that is too far from the line to be listed normally is
   * shown in a group of its own, with no mile and no distance, under the note that says why.
   */
  unmeasured?: { id: string; name: string; note: string; box: [number, number, number, number] }[];
  side?: boolean;                    // a side leg: an alternative alignment shown beside the main line, not part of the through mileage
  notes?: RoadNote[];
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
  /** false when the stops are not in this site's directory, so they have no /brewery/<id> page (default true). */
  stopsHavePages?: boolean;
  /** 'checker-files': the inputs are the regional checkers' files, normalised by normaliseCheckerFiles before building. */
  ingest?: 'checker-files';
  /** 'any-way': a stop's distance is to the nearest of every mapped alignment, not only to the leg's chosen line (default 'line'). */
  distanceTo?: 'line' | 'any-way';
  /** Where the candidates came from when it is not this site's directory, for the coverage sentences ("the Open Brewery DB and our checkers' own finds"). */
  startingList?: string;
  /** Show each leg as a closed <details> with a summary line, for a road too long to scroll (default false). */
  collapseLegs?: boolean;
  methodNotes?: string[];      // extra plain-text points for "How this list was made"
  drawToleranceMiles?: number; // how far a dropped point may sit off the thinned line kept for drawing (default 0.12)
  maxDetourMiles: number;  // straight-line distance from the mapped line within which a brewery is listed
  gapNoteMiles: number;    // a gap at least this long between listed stops gets a note
  geometry: { source: string; downloaded: string };
  about: string;           // what the page says about the road itself; every statement in it is supported by roadSources
  roadSources: QuoteSource[];
  legs: RoadLegConfig[];
}

/** A row from the brewery directory that lies near the road. Not shown anywhere until a checked row qualifies it. */
export interface CandidateRow { id: number | string; name: string; city: string; state: string; latitude: number; longitude: number }
/** Proof the place was operating: a verbatim excerpt (printed visiting hours, a dated notice), its page, the day read. */
export interface OperatingEvidence { excerpt?: string | null; url?: string | null; checked?: string | null }
/** A checker's finding for one candidate. Only status OPEN with operating evidence becomes a stop. */
export interface VerifiedRow {
  id: number | string; name?: string | null; status?: string | null; official_url?: string | null;
  address_as_printed?: string | null; address_source_url?: string | null;
  quote?: string | null; quote_source_url?: string | null; notes?: string | null; checked?: string | null;
  operating_evidence?: OperatingEvidence | null;
  browser_checked?: string | null; // the day a person read the row's sources on the rendered page, for sites a script cannot read
  evidence_kind?: string | null;   // 'notice' when the evidence is a dated notice or event, not visiting hours
  notice_context?: string | null;  // for a notice: what on the page establishes its year and the venue
}

export interface RoadStop {
  key: string;                 // the stop's id on the page (anchor "stop-<key>"): the directory id, or a slug of name and town
  breweryId?: number;          // set only when the stop has a /brewery/<id> page in this site's directory
  name: string; town: string; state: string; lat: number; lon: number;
  status: string;              // as the checker recorded it; only "OPEN" is ever shown
  website: string;             // the brewery's own site as the checker found it ('' when none)
  address: string;             // as printed at addressSourceUrl ('' when there is no sourced address)
  addressSourceUrl: string;
  evidence: string; evidenceUrl: string; evidenceChecked: string; // what supports the listing: excerpt (published hours), page, day we read it
  quote: string; quoteSourceUrl: string; // an optional descriptive quote ('' when none) and its page
  checked: string;             // the day the checker's row was made
  legId: string;
  mile: number;                // along the leg's mapped line from its start, at the point nearest the brewery
  detourMiles: number;         // straight-line distance to that nearest point (not a driving distance)
  pastEnd: '' | 'start' | 'end'; // the nearest point on the line is the end of the line itself
  browserChecked?: string;     // set only when the checker's row records a browser check on a real date
  noticeContext?: string;      // for a notice: what on the page establishes its year and the venue
  outer?: boolean;             // beyond the stretch's tighter limit but within its further-off distance
  unmeasured?: string;         // id of the leg's unmeasured group: the mapped line is missing here, so mile and distance are not shown
  evidenceKind?: 'notice';     // the evidence is a dated notice or event, not visiting hours
}
/** `candidates`: directory breweries within the limit of this leg. `decided`: how many of those have a completed decision. */
export interface BuiltLeg { id: string; lengthMiles: number; line: LatLon[]; candidates: number; decided: number; joins?: number; joinedMiles?: number; widestJoinMiles?: number }
/** What the build step writes: stops with their place on the road, and a thinned line for drawing. */
export interface BuiltRoad { slug: string; built: string; legs: BuiltLeg[]; stops: RoadStop[]; unplaced?: number }
export interface BuildReport {
  left: { id: number | string; name: string; reason: string }[];
  undecided: { id: number | string; name: string; why: string }[];
  legs: { id: string; lengthMiles: number; bridges: number; bridgedMiles: number; points: number; joins: { from: LatLon; to: LatLon; miles: number }[] }[];
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
    && typeof s.key === 'string' && ID.test(s.key)
    && (s.breweryId === undefined || (Number.isInteger(s.breweryId) && s.breweryId > 0))
    && typeof s.name === 'string' && s.name.trim() !== ''
    && typeof s.evidence === 'string' && s.evidence.trim() !== ''
    && citable(s.evidenceUrl) !== ''
    && calendarDate(s.evidenceChecked) && s.evidenceChecked <= today
    && calendarDate(s.checked) && s.checked <= today
    && Number.isFinite(s.mile) && Number.isFinite(s.detourMiles) && (s.detourMiles as number) >= 0
    && typeof s.legId === 'string';
}

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/**
 * Everything wrong with a stop for the road it is on; empty when it may be shown. This is the check the builder, the
 * page and the verifier all use. On top of the gate above:
 * - a road whose stops are in this site's directory (stopsHavePages not false) REQUIRES a positive directory id on
 *   every stop, and the stop's key must be that id;
 * - a road of stand-alone stops (stopsHavePages: false) must have no directory id, and because there is no directory
 *   page to fall back on, every stop needs a sourced street address and a link to the brewery's own site;
 * - evidence that is a notice, not hours, must record what establishes its year and venue.
 */
export function stopProblems(s: Partial<RoadStop> | null | undefined, config: Pick<RoadConfig, 'stopsHavePages'>, today: string = currentDate()): string[] {
  if (!isShowableStop(s, today)) return ['fails the gate: not OPEN, or no dated operating evidence with a citable source, or a date in the future'];
  const out: string[] = [];
  if (config.stopsHavePages !== false) {
    if (!(Number.isInteger(s.breweryId) && (s.breweryId as number) > 0)) out.push('a stop on a directory road must carry a positive directory id');
    else if (s.key !== String(s.breweryId)) out.push('the stop key must be its directory id');
  } else {
    if (s.breweryId !== undefined) out.push('a stand-alone stop must not carry a directory id');
    if (!String(s.address ?? '').trim() || !citable(s.addressSourceUrl)) out.push('a stand-alone stop needs a sourced street address');
    if (!citable(s.website)) out.push('a stand-alone stop needs a link to the brewery\'s own site');
  }
  if (s.evidenceKind === 'notice' && !String(s.noticeContext ?? '').trim()) out.push('a notice needs the context that establishes its year and venue');
  return out;
}

/**
 * True when every part of `quote` is on the page, in order. An excerpt may leave words out, marked " ... " or "…".
 * An excerpt with nothing in it (empty, only spaces, only an ellipsis) matches nothing: it is never found.
 */
export function excerptFound(text: string, quote: string): boolean {
  const parts = pageText(String(quote ?? '')).split(/\s*(?:\.\.\.|…)\s*/).map((x) => x.trim()).filter(Boolean);
  if (!parts.length || !text) return false;
  let at = 0;
  for (const part of parts) { const i = text.indexOf(part, at); if (i < 0) return false; at = i + part.length; }
  return true;
}
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
    for (const u of leg.unmeasured ?? []) if (!ID.test(String(u.id))) out.push(`unmeasured group id ${JSON.stringify(u.id)} must be lower-case letters, digits and single hyphens`);
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
export const DECIDED_NOT_LISTED = ['CLOSED', 'MOVED/RENAMED', 'MOVED', 'RENAMED', 'DUPLICATE', 'NOT A BREWERY TAPROOM'];

export function segmentAt(leg: RoadLegConfig, mile: number): RoadSegmentConfig {
  return leg.segments.find((g) => g.toMile === null || mile < g.toMile) || leg.segments[leg.segments.length - 1];
}

export function buildRoad(config: RoadConfig, ways: LatLon[][], candidates: CandidateRow[], verified: VerifiedRow[], built: string, today: string = currentDate()): { road: BuiltRoad; report: BuildReport } {
  const problems = roadConfigProblems(config);
  if (problems.length) throw new Error(`road config: ${problems.join('; ')}`);
  const report: BuildReport = { left: [], undecided: [], legs: [] };
  const legs = config.legs.map((leg) => {
    const range = leg.lonRange;
    const legWays = range ? ways.filter((w) => w.length > 0 && w[0][1] >= range[0] && w[0][1] < range[1]) : ways;
    // One line from start to end, through each `via` point in order.
    const stopsAt = [leg.start, ...(leg.via ?? []), leg.end];
    const parts = stopsAt.slice(1).map((to, i) => stitchLeg(legWays, stopsAt[i], to, { bridgeMiles: leg.joinMiles }));
    const line = parts.flatMap((q, i) => (i ? q.line.slice(1) : q.line)), lineCum = cumulativeMiles(line);
    const st: StitchedLeg = {
      line, lengthMiles: lineCum[lineCum.length - 1], bridgedMiles: parts.reduce((n, q) => n + q.bridgedMiles, 0), bridges: parts.reduce((n, q) => n + q.bridges, 0),
      joins: parts.flatMap((q) => q.joins), startSnapMiles: Math.max(...parts.map((q) => q.startSnapMiles)), endSnapMiles: Math.max(...parts.map((q) => q.endSnapMiles)),
    };
    if (st.startSnapMiles > 0.5 || st.endSnapMiles > 0.5) throw new Error(`${config.slug}/${leg.id}: the configured ends are ${st.startSnapMiles.toFixed(2)} and ${st.endSnapMiles.toFixed(2)} miles from the mapped road`);
    if (st.bridgedMiles > (leg.maxJoinedMiles ?? 0.5)) throw new Error(`${config.slug}/${leg.id}: ${st.bridgedMiles.toFixed(2)} miles of the line are joins across gaps in the download`);
    if (!leg.segments.length || leg.segments[leg.segments.length - 1].toMile !== null) throw new Error(`${config.slug}/${leg.id}: the last segment must run to the end (toMile: null)`);
    leg.segments.forEach((g, i) => { const prev = i ? leg.segments[i - 1].toMile! : 0; if (g.toMile !== null && (g.toMile <= prev || g.toMile >= st.lengthMiles)) throw new Error(`${config.slug}/${leg.id}/${g.id}: toMile ${g.toMile} is out of order or past the end (${st.lengthMiles.toFixed(1)} mi)`); });
    report.legs.push({ id: leg.id, lengthMiles: st.lengthMiles, bridges: st.bridges, bridgedMiles: st.bridgedMiles, points: st.line.length, joins: st.joins });
    return { leg, st, cum: lineCum, candidates: 0, decided: 0 };
  });

  // Where each directory candidate falls: its nearest leg, the mile there, and the straight-line distance to the line.
  // With distanceTo 'any-way' the distance is to the nearest of every mapped alignment, so a brewery on an older
  // alignment is not penalised; its mile is still its nearest point on the leg's one chosen line.
  type Id = number | string;
  const validId = (id: unknown): id is Id => (Number.isInteger(id) && (id as number) > 0) || (typeof id === 'string' && ID.test(id));
  const placed = new Map<Id, { cand: CandidateRow; l: (typeof legs)[number]; along: number; detour: number; lineDetour: number; within: boolean; outer: boolean; unmeasured: string }>();
  for (const cand of candidates) {
    if (!validId(cand?.id) || placed.has(cand.id) || !Number.isFinite(cand.latitude) || !Number.isFinite(cand.longitude)) continue;
    const p: LatLon = [cand.latitude, cand.longitude];
    const near = legs.map((l) => ({ l, on: projectOntoLine(p, l.st.line, l.cum) })).sort((a, b) => a.on.detour - b.on.detour)[0];
    const seg = segmentAt(near.l.leg, near.on.along);
    // 'any-way': the advertised distance is to mapped ways alone, never to a join the stitched line makes across a gap.
    const detour = config.distanceTo === 'any-way' ? distanceToWays(p, ways) : near.on.detour;
    const tight = seg.maxDetourMiles ?? config.maxDetourMiles, limit = Math.max(tight, seg.furtherOffMiles ?? 0);
    // Too far from the line, but inside a box where the line is known to be missing: kept, in that group, unmeasured.
    const hole = detour <= limit ? undefined : legs.flatMap((l) => (l.leg.unmeasured ?? []).map((u) => ({ l, u }))).find(({ u }) => p[0] >= u.box[0] && p[0] <= u.box[2] && p[1] >= u.box[1] && p[1] <= u.box[3]);
    const l = hole ? hole.l : near.l, on = hole ? projectOntoLine(p, l.st.line, l.cum) : near.on;
    placed.set(cand.id, { cand, l, along: on.along, detour, lineDetour: on.detour, within: detour <= limit || !!hole, outer: detour > tight && detour <= limit, unmeasured: hole ? hole.u.id : '' });
  }

  if (config.stopsHavePages !== false) {
    const bad = [...candidates.map((x) => x?.id), ...verified.map((x) => x?.id)].find((id) => !(Number.isInteger(id) && (id as number) > 0));
    if (bad !== undefined) throw new Error(`${config.slug}: a directory road needs a positive whole-number directory id on every row; got ${JSON.stringify(bad)}`);
  }
  const seen = new Set<Id>(), decided = new Set<Id>(), stops: RoadStop[] = [];
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
    const atStart = along < 0.02 && !at.unmeasured, atEnd = along > l.st.lengthMiles - 0.02 && !at.unmeasured;
    const ev = row.operating_evidence || {};
    const quoteUrl = citable(row.quote_source_url), quote = quoteUrl ? String(row.quote || '').trim() : '';
    const stop: RoadStop = {
      key: String(row.id), ...(config.stopsHavePages !== false && typeof row.id === 'number' ? { breweryId: row.id } : {}),
      name: String(row.name || cand.name || '').trim(), town: String(cand.city || '').trim(), state: String(cand.state || '').trim(),
      lat: cand.latitude, lon: cand.longitude, status: 'OPEN',
      website: citable(row.official_url),
      address: citable(row.address_source_url) ? String(row.address_as_printed || '').trim() : '',
      addressSourceUrl: String(row.address_as_printed || '').trim() ? citable(row.address_source_url) : '',
      evidence: String(ev.excerpt || '').trim(), evidenceUrl: citable(ev.url), evidenceChecked: String(ev.checked || '').trim(),
      quote, quoteSourceUrl: quote ? quoteUrl : '', checked: String(row.checked || '').trim(),
      legId: l.leg.id, mile, detourMiles,
      pastEnd: at.lineDetour > PAST_END_MILES && (atStart || atEnd) ? (atStart ? 'start' : 'end') : '',
      ...(at.outer ? { outer: true } : {}), ...(at.unmeasured ? { unmeasured: at.unmeasured } : {}), ...(row.evidence_kind === 'notice' ? { evidenceKind: 'notice' as const, noticeContext: String(row.notice_context ?? '').trim() } : {}),
      ...(calendarDate(row.browser_checked) ? { browserChecked: row.browser_checked as string } : {}),
    };
    if (!isShowableStop(stop, today)) { leave('marked OPEN, but there is no usable operating evidence (excerpt, citable URL and a check date that is not in the future)'); continue; }
    const wrong = stopProblems(stop, config, today);
    if (wrong.length) { leave(`marked OPEN with evidence, but ${wrong.join('; ')}`); continue; }
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
      legs: legs.map((l) => ({ id: l.leg.id, lengthMiles: round(l.st.lengthMiles, 1), line: simplifyLine(l.st.line, config.drawToleranceMiles ?? 0.12).map((q) => [round(q[0], 5), round(q[1], 5)] as LatLon), candidates: l.candidates, decided: l.decided,
        ...(l.st.bridges ? { joins: l.st.bridges, joinedMiles: round(l.st.bridgedMiles, 2), widestJoinMiles: round(Math.max(...l.st.joins.map((j) => j.miles)), 2) } : {}) })),
      stops,
    },
    report,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Ingest for roads outside the directory: the regional checkers' files -> the same candidate and verified rows the
// build step takes. The checkers' files are never edited; this reads their slightly different shapes.

const STATE_ABBR: Record<string, string> = { illinois: 'IL', missouri: 'MO', kansas: 'KS', oklahoma: 'OK', texas: 'TX', 'new mexico': 'NM', arizona: 'AZ', california: 'CA' };
export const stateAbbr = (v: unknown): string => { const t = String(v ?? '').trim(); return /^[A-Za-z]{2}$/.test(t) ? t.toUpperCase() : STATE_ABBR[t.toLowerCase()] ?? t; };
/** "Bummin' Beaver Brewery", "Auburn Twp." -> "bummin-beaver-brewery-auburn-twp". Plain ASCII, safe as an id. */
export const stopKey = (name: unknown, city: unknown): string =>
  `${String(name ?? '')} ${String(city ?? '')}`.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’.]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
/** Page text as a reader sees it: tags dropped, common entities decoded, whitespace collapsed, no space before punctuation. */
export const pageText = (html: string): string => {
  const ENT: Record<string, string> = { amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', eacute: 'é', copy: '©', reg: '®', trade: '™', deg: '°', middot: '·', bull: '•' };
  return html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? m).replace(/[\u200b\u200c\u200d\ufeff]/g, '').replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').replace(/ ([,.;:!?])/g, '$1').trim();
};
const HOURS = /\d\s*(?::\d\d)?\s*(?:[ap]\.?m\.?|[ap])(?![a-z])|\bnoon\b|\d\s*[-–]\s*\d/i;
/**
 * The words of `wanted` as the page really prints them, or null. First the whole text, letting punctuation and
 * separators between its words differ (a checker's "12 Main St, Town" against the page's "12 Main St Town"). Failing
 * that, and only when `needHours` is set, the longest run of its words that the page prints word for word and that
 * still shows opening hours; or, with `streetOnly`, the street part of an address when the page prints the rest
 * differently. Whatever comes back is copied from `text`, never from `wanted`.
 */
export function asPrinted(wanted: string, text: string, needHours = false, streetOnly = false): string | null {
  const words = wanted.split(/[\s,|•·◆]+/).map((w) => w.replace(/^[^\p{L}\p{N}(]+|[^\p{L}\p{N}).!?]+$/gu, '')).filter(Boolean);
  if (!words.length) return null;
  if (text.includes(wanted)) return wanted;
  const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try { const m = text.match(new RegExp(words.map(esc).join('[^\\p{L}\\p{N}]{0,6}'), 'u')); if (m) return m[0]; } catch { /* a pattern too odd to build: fall through */ }
  const tokens = wanted.split(/\s+/).filter(Boolean); let best = '';
  if (streetOnly) {
    // An address: the longest run from its first word (the street number) that the page prints, at least three words.
    const parts = wanted.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    if (!/^\d/.test(parts[0]) || !text.includes(parts[0])) return null;
    let k = 0, run = parts[0];
    while (k + 1 < parts.length && text.includes(`${run} ${parts[k + 1]}`)) run += ` ${parts[++k]}`;
    return k >= 2 ? run.replace(/[,;]$/, '') : null;
  }
  if (!needHours) return null;
  // The longest run of the wanted words that the page prints, letting separators between words differ, and that
  // still shows opening hours.
  const loose = (from: number, to: number): string | null => {
    const ws = tokens.slice(from, to + 1).map((w) => w.replace(/^[^\p{L}\p{N}(]+|[^\p{L}\p{N}).!?]+$/gu, '')).filter(Boolean);
    if (!ws.length) return null;
    try { const m = text.match(new RegExp(ws.map(esc).join('[^\\p{L}\\p{N}]{0,6}'), 'u')); return m ? m[0] : null; } catch { return null; }
  };
  for (let i = 0; i < tokens.length; i++) {
    if (loose(i, i) === null) continue;
    let j = i, run = loose(i, i) as string;
    for (;;) { const next = j + 1 < tokens.length ? loose(i, j + 1) : null; if (next === null) break; run = next; j++; }
    if (run.length > best.length && HOURS.test(run)) best = run;
    if (j === tokens.length - 1) break;
  }
  return best.length >= 20 ? best : null;
}

const MERIDIEM = '(?:[ap]\\.?m\\.?|[ap])(?![a-z])';
const TIME_TOKEN = new RegExp(`\\b\\d{1,2}(?::\\d{2})?\\s*(?:${MERIDIEM})?\\s*(?:[-–—]|to)\\s*(?:\\d{1,2}(?::\\d{2})?\\s*(?:${MERIDIEM})?|noon|midnight|close)|\\d{1,2}(?::\\d{2})?\\s*${MERIDIEM}|\\bnoon\\b|\\bmidnight\\b`, 'gi');
/**
 * An hours excerpt cut back to the hours: whatever follows the last time is dropped (a phone number, a copyright
 * line, the first word of the next sentence), unless it is a day marked closed. Only ever removes words from the end,
 * so what is left is still word for word what the page prints. Text with no time in it is returned unchanged.
 */
export function hoursOnly(excerpt: string): string {
  let end = -1;
  for (const m of excerpt.matchAll(TIME_TOKEN)) end = (m.index ?? 0) + m[0].length;
  if (end < 0) return excerpt;
  const tail = excerpt.slice(end);
  if (/^[\s,;.|•·:/-]*(?:(?:(?:sun|mon|tue|wed|thu|fri|sat)[a-z]*\.?[\s:,&|/-]*)+closed[\s.]*)*$/i.test(tail)) return excerpt.trim();
  let cut = excerpt.slice(0, end);
  // Do not stop inside a bracket: "(8pm kitchen close)" stays whole.
  if ((cut.match(/\(/g) || []).length > (cut.match(/\)/g) || []).length) { const close = tail.indexOf(')'); if (close >= 0 && close <= 40) cut = excerpt.slice(0, end + close + 1); }
  cut = cut.trim();
  return cut.length >= 12 ? cut : excerpt;
}

/** A latitude and longitude from any of the shapes the checkers used, or null. */
export function readCoordinates(v: unknown): { lat: number; lon: number } | null {
  if (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n))) return ok(v[0], v[1]);
  if (v && typeof v === 'object') { const o = v as Record<string, unknown>; return ok(o.lat ?? o.latitude, o.lon ?? o.lng ?? o.longitude); }
  return null;
  function ok(lat: unknown, lon: unknown) { return typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0) ? { lat, lon } : null; }
}
// Where a checker recorded coordinates for the address the brewery prints today (US Census geocoder), by any field name.
const ROW_COORDINATE_FIELDS = ['coordinates', 'new_address_coordinates', 'address_coordinates', 'new_coordinates', 'census_geocode'];
const rowCoordinates = (r: Record<string, unknown>) => { for (const f of ROW_COORDINATE_FIELDS) { const c = readCoordinates(r[f]); if (c) return c; } return readCoordinates({ lat: r.lat, lon: r.lon }); };

/** An editor's or second check's ruling on one row, kept apart from the checkers' files. Matches a dataset id or a lead's key. */
export interface RowDecision {
  match: string; status?: string; reason: string;
  evidenceKind?: 'notice'; noticeContext?: string;
  /** Operating evidence an editor re-read on the brewery's own site, replacing the checker's (a notice replaced by hours, say). */
  evidence?: { excerpt: string; url: string; checked: string };
}
/**
 * A correction to one field of one row, made by re-reading the cited page: the text exactly as the page prints it, or
 * null when the page does not carry it. Written by scripts/reconcile-road-excerpts.mjs, never by hand, and kept apart
 * from the checkers' files. A row whose evidence is corrected to null has no operating evidence and is not listed.
 */
export interface RowCorrection { key: string; field: 'evidence' | 'address' | 'quote'; value: string | null; url?: string; reason: string }
export interface IngestResult {
  candidates: CandidateRow[]; verified: VerifiedRow[];
  unplaced: { key: string; name: string; city: string; state: string; why: string }[];
  applied: { key: string; name: string; status: string; reason: string }[];
  unmatchedDecisions: string[];
  retowned: { key: string; name: string; from: string; to: string }[]; // town taken from the printed address, not the row
}
const STREET_WORDS: Record<string, string> = { street: 'st', avenue: 'ave', av: 'ave', road: 'rd', boulevard: 'blvd', drive: 'dr', lane: 'ln', highway: 'hwy', parkway: 'pkwy', place: 'pl', court: 'ct', route: 'rte', rt: 'rte',
  north: 'n', south: 's', east: 'e', west: 'w', northeast: 'ne', northwest: 'nw', southeast: 'se', southwest: 'sw', first: '1st', second: '2nd', third: '3rd', fourth: '4th', fifth: '5th', sixth: '6th', seventh: '7th', eighth: '8th', ninth: '9th' };
const STREET_SUFFIX = new Set(['st', 'ave', 'rd', 'blvd', 'dr', 'ln', 'hwy', 'pkwy', 'pl', 'ct', 'way', 'rte', 'ter', 'cir', 'sq']);
const DIRECTIONS = new Set(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']);
/**
 * "1800 4th Street NW, Albuquerque" -> { number: "1800", street: "4th" }: the street number and the first word of the
 * street's own name (a leading compass word is skipped unless it is the name, as in "North Ave"), or null.
 */
export function streetOf(address: unknown): { number: string; street: string } | null {
  const words = String(address ?? '').toLowerCase().replace(/[.,#]/g, ' ').split(/\s+/).filter(Boolean).map((w) => STREET_WORDS[w] ?? w);
  const at = words.findIndex((w) => /^\d+[a-z]?$/.test(w));
  if (at < 0) return null;
  const rest = words.slice(at + 1);
  while (rest.length > 1 && DIRECTIONS.has(rest[0]) && !STREET_SUFFIX.has(rest[1])) rest.shift();
  return rest.length && !STREET_SUFFIX.has(rest[0]) ? { number: words[at], street: rest[0] } : null;
}
/**
 * The same-location check: do two addresses share a street number and the first word of the street name? False when
 * either cannot be read. (It cannot tell "100 Main St" from "100 Main Ave" in the same town; it is there to catch a
 * brewery that has moved, where the number or the street changes.)
 */
export function sameStreet(a: unknown, b: unknown): boolean {
  const x = streetOf(a), y = streetOf(b);
  return !!x && !!y && x.number === y.number && x.street === y.street;
}
const plainTown = (t: string) => t.toLowerCase().replace(/\bsaint\b/g, 'st').replace(/[.']/g, '').replace(/\s+/g, ' ').trim();
const TOWN_ALIASES: Record<string, string> = { okc: 'oklahoma city', la: 'los angeles', abq: 'albuquerque', stl: 'st louis' };
const STATE_NAMES = 'Illinois|Missouri|Kansas|Oklahoma|Texas|New Mexico|Arizona|California';
/**
 * The town a printed address names, so the town shown with a stop agrees with its address. If the address names the
 * town the row already has (or a usual short form of it), that stands. Otherwise: a town we know that appears in the
 * address (the last one, since the town follows the street); failing that, the words between the street and the
 * state. Null when the address names no town at all.
 */
export function townInAddress(address: unknown, known: string[], listed = ''): string | null {
  const raw = String(address ?? '').trim();
  if (!raw) return null;
  const text = ` ${plainTown(raw.replace(/[,·]/g, ' '))} `, mine = plainTown(listed);
  const names = (t: string) => text.includes(` ${t} `) || Object.entries(TOWN_ALIASES).some(([short, full]) => full === t && text.includes(` ${short} `));
  if (mine && names(mine)) return listed;
  let best: { town: string; at: number; len: number } | null = null;
  for (const town of known) {
    const t = plainTown(town); if (!t) continue;
    const at = text.lastIndexOf(` ${t} `);
    if (at >= 0 && (!best || at + t.length > best.at + best.len || (at + t.length === best.at + best.len && t.length > best.len))) best = { town, at, len: t.length };
  }
  if (best) return best.town;
  // "..., Lebanon, Missouri 65536" or "... 1st Street Alhambra, CA 91801": what sits just before the state.
  const m = raw.match(new RegExp(`^(.*?)[,\\s]+(?:[A-Z]{2}|${STATE_NAMES})\\.?,?\\s*(?:\\d{5}(?:-\\d{4})?)?\\s*$`));
  if (!m) return null;
  const before = m[1].trim(), afterComma = before.includes(',') ? before.slice(before.lastIndexOf(',') + 1).trim() : '';
  let town = afterComma;
  if (!town) { const words = before.replace(/[.#]/g, ' ').split(/\s+/); let cut = -1; words.forEach((w, i) => { if (STREET_SUFFIX.has(STREET_WORDS[w.toLowerCase()] ?? w.toLowerCase()) || /^\d/.test(w) || DIRECTIONS.has(w.toLowerCase())) cut = i; }); town = words.slice(cut + 1).join(' ').trim(); }
  if (!town || /\d/.test(town) || town.split(/\s+/).length > 4) return null;
  if (TOWN_ALIASES[plainTown(town)] === mine && mine) return listed;
  return town === town.toUpperCase() ? town.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()) : town;
}

/**
 * dataset: the Open Brewery DB rows (id, name, city, state, address_1, latitude, longitude). verified: checkers' rows
 * keyed by obdb_id. leads: breweries the checkers found that the dataset lacks.
 *
 * The coordinates a row is measured from must be those of the address it prints:
 * - Census coordinates the checker recorded for the printed address are used when the row has them;
 * - the dataset's coordinates are used ONLY when the final printed address (after corrections) has the same street
 *   number and street as the dataset's address (sameStreet), whatever the row's status word says;
 * - a row with neither cannot be placed: it is reported and stays off the list, never guessed.
 * The town shown is the one the printed address names, when it names a town we know and that differs from the row's.
 * MOVED and RENAMED rows that carry operating evidence are treated as open at the printed address. Decisions override
 * a row's status (and may supply evidence an editor re-read); corrections replace text with what the page prints.
 */
export function normaliseCheckerFiles(dataset: Record<string, unknown>[], verified: Record<string, unknown>[], leads: Record<string, unknown>[], decisions: RowDecision[] = [], corrections: RowCorrection[] = []): IngestResult {
  const out: IngestResult = { candidates: [], verified: [], unplaced: [], applied: [], unmatchedDecisions: [], retowned: [] };
  const byId = new Map(dataset.map((d) => [String(d.id), d]));
  const rule = new Map(decisions.map((d) => [d.match, d])), used = new Set<string>(), fixed = new Set<string>();
  const keys = new Set<string>();
  const unique = (base: string) => { let k = base || 'stop', n = 1; while (keys.has(k)) k = `${base}-${++n}`; keys.add(k); return k; };
  const towns = [...new Set([...dataset, ...verified, ...leads].map((r) => String(r.city ?? '').trim()).filter(Boolean))];
  const evidenceOf = (r: Record<string, unknown>) => { const e = r.operating_evidence as OperatingEvidence | null | undefined; return e && typeof e === 'object' && String(e.excerpt ?? '').trim() ? e : null; };
  // One row: rulings and corrections first, so that everything after (placement, town) works from the final text.
  const make = (r: Record<string, unknown>, key: string, status: string, matches: string[]): VerifiedRow => {
    const name = String(r.name ?? '').trim();
    const d = matches.map((m) => rule.get(m)).find(Boolean);
    let ev = evidenceOf(r);
    if (d) { used.add(d.match); status = d.status ?? status; if (d.evidence) ev = { ...d.evidence }; out.applied.push({ key, name, status, reason: d.reason }); }
    const row: VerifiedRow = {
      id: key, name, status, official_url: (r.official_url as string) ?? null,
      address_as_printed: (r.address_as_printed as string) ?? null, address_source_url: (r.address_source_url as string) ?? null,
      quote: (r.quote as string) ?? null, quote_source_url: (r.quote_source_url as string) ?? null,
      notes: [d ? d.reason : '', String(r.notes ?? '')].filter(Boolean).join(' | ') || null,
      checked: String(r.checked ?? ev?.checked ?? '') || null, operating_evidence: ev, browser_checked: (r.browser_checked as string) ?? null,
      evidence_kind: d?.evidence ? null : d?.evidenceKind ?? (r.evidence_kind as string) ?? null, notice_context: d?.noticeContext ?? (r.notice_context as string) ?? null,
    };
    for (const c of corrections.filter((x) => x.key === key)) {
      fixed.add(`${c.key}\n${c.field}`);
      if (c.field === 'evidence') row.operating_evidence = c.value && row.operating_evidence ? { ...row.operating_evidence, excerpt: c.value, ...(c.url ? { url: c.url } : {}) } : null;
      else if (c.field === 'address') { row.address_as_printed = c.value; if (!c.value) row.address_source_url = null; }
      else { row.quote = c.value; if (!c.value) row.quote_source_url = null; }
    }
    return row;
  };
  const place = (r: Record<string, unknown>, row: VerifiedRow, at: { lat: number; lon: number } | null, why: string) => {
    const listed = String(r.city ?? '').trim(), state = stateAbbr(r.state), key = String(row.id), name = String(row.name ?? '');
    const printed = townInAddress(row.address_as_printed, towns, listed), city = printed ?? listed;
    if (printed && plainTown(printed) !== plainTown(listed)) out.retowned.push({ key, name, from: listed, to: printed });
    out.verified.push(row);
    if (at) out.candidates.push({ id: key, name, city, state, latitude: at.lat, longitude: at.lon });
    else out.unplaced.push({ key, name, city, state, why });
  };
  const openByName = new Map<string, VerifiedRow>();
  for (const r of verified) {
    const id = String(r.obdb_id ?? ''), d = byId.get(id), raw = String(r.status ?? '');
    const status = (raw === 'MOVED' || raw === 'RENAMED') && evidenceOf(r) ? 'OPEN' : raw;
    const base = stopKey(r.name, r.city), row = make(r, unique(base), status, [id]);
    const here = rowCoordinates(r), dataAt = d ? readCoordinates({ lat: d.latitude, lon: d.longitude }) : null;
    const same = !!d && sameStreet(row.address_as_printed, d.address_1 ?? d.street);
    // A row that will not be listed keeps the dataset's point, so it still counts in the coverage figures.
    place(r, row, here ?? (same || row.status !== 'OPEN' ? dataAt : null), !row.address_as_printed
      ? 'no printed address to compare with the dataset\'s, and no Census coordinates for it'
      : 'the printed address is not the dataset\'s (street number or street differ), and no Census coordinates were recorded for it');
    if (row.status === 'OPEN') openByName.set(base, row);
  }
  // A lead that is the same place as a dataset row already listed as open (same name and town) is not listed twice:
  // the lead carries Census coordinates for the printed address, so it is kept and the dataset row is marked a duplicate.
  for (const r of leads) {
    const base = stopKey(r.name, r.city), twin = openByName.get(base);
    const at = rowCoordinates(r);
    if (twin && at) { twin.status = 'DUPLICATE'; twin.notes = `same place as the lead of the same name, which has Census coordinates | ${twin.notes ?? ''}`; }
    const key = unique(base);
    place(r, make(r, key, evidenceOf(r) ? 'OPEN' : 'UNCONFIRMED', [key, base, `lead:${String(r.name ?? '').trim()}`]), at, String(r.coordinates_note ?? 'the checker recorded no coordinates'));
  }
  for (const d of decisions) if (!used.has(d.match)) out.unmatchedDecisions.push(d.match);
  for (const c of corrections) if (!fixed.has(`${c.key}\n${c.field}`)) out.unmatchedDecisions.push(`correction:${c.key}`);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// View: what the page shows, worked out from the config and the built data

export interface StopView extends RoadStop { n: number; milesFromEnd: number; gapAfterMiles: number | null }
export interface SegmentView { id: string; name: string; fromMile: number; toMile: number; link?: { href: string; text: string }; notes: RoadNote[]; limitMiles: number; furtherOffMiles: number | null; stops: StopView[]; outer: StopView[] }
export interface LegView {
  id: string; name: string; side: boolean; notes: RoadNote[]; from: string; to: string; lengthMiles: number; line: LatLon[];
  candidates: number; decided: number; // directory breweries within the limit of this leg, and how many have a completed decision
  stops: StopView[]; segments: SegmentView[]; towns: number; // stops: the measured ones, in line order
  unmeasured: { id: string; name: string; note: string; stops: StopView[] }[]; // groups where the line is missing: no mile, no distance
  joins: number; joinedMiles: number; widestJoinMiles: number;
  listed: number;              // measured and unmeasured together
  gaps: { fromMile: number; toMile: number; miles: number }[]; // every stretch long enough to note, ends of the line included
  leadGapMiles: number | null; // start of the leg to the first listed stop, when long enough to note
  longestGap: { fromMile: number; toMile: number; miles: number } | null; // between consecutive listed stops; null with fewer than two
}
export interface RoadView {
  config: RoadConfig; legs: LegView[]; stops: StopView[]; // stops: every listed stop, measured and unmeasured
  unplaced: number;            // evidenced breweries left off because no coordinates could be had for them
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
    const mine = problems.length ? [] : built.stops.filter((s) => stopProblems(s, config, today).length === 0 && s.legId === leg.id);
    const groups = (leg.unmeasured ?? []).filter((u) => ID.test(String(u.id)));
    const shown = mine.filter((s) => !s.unmeasured && s.mile >= 0 && s.mile <= length + 0.05 && s.detourMiles <= Math.max(segmentAt(safeLeg, s.mile).maxDetourMiles ?? config.maxDetourMiles, segmentAt(safeLeg, s.mile).furtherOffMiles ?? 0))
      .slice().sort((a, c) => a.mile - c.mile || a.detourMiles - c.detourMiles || a.name.localeCompare(c.name));
    const note = (gap: number) => (gap >= config.gapNoteMiles ? round(gap, 1) : null);
    const stops: StopView[] = shown.map((s, i) => ({ ...s, n: ++n, milesFromEnd: round(length - s.mile, 1), gapAfterMiles: note((i + 1 < shown.length ? shown[i + 1].mile : length) - s.mile) }));
    // Between consecutive listed stops only. The ends of the line are not stops: the stretches from the start to the
    // first stop and from the last stop to the end are noted separately (leadGapMiles, the last stop's gapAfterMiles).
    let longestGap: LegView['longestGap'] = null;
    for (let i = 1; i < stops.length; i++) { const miles = round(stops[i].mile - stops[i - 1].mile, 1); if (!longestGap || miles > longestGap.miles) longestGap = { fromMile: stops[i - 1].mile, toMile: stops[i].mile, miles }; }
    const segments: SegmentView[] = segs.map((g, i) => {
      const fromMile = i ? segs[i - 1].toMile! : 0, toMile = g.toMile ?? length;
      const mine = stops.filter((s) => segmentAt(safeLeg, s.mile).id === g.id);
      const href = safeSitePath(g.link?.href);
      const limitMiles = g.maxDetourMiles ?? config.maxDetourMiles;
      return { id: g.id, name: g.name || townsName(mine.map((s) => s.town)) || `Mile ${Math.round(fromMile)} to ${Math.round(toMile)}`, fromMile, toMile, link: g.link && href ? { href, text: g.link.text } : undefined,
        notes: g.notes ?? [], limitMiles, furtherOffMiles: g.furtherOffMiles && g.furtherOffMiles > limitMiles ? g.furtherOffMiles : null,
        stops: mine.filter((s) => s.detourMiles <= limitMiles), outer: mine.filter((s) => s.detourMiles > limitMiles) };
    });
    const candidates = Math.max(0, b?.candidates ?? 0), decided = Math.min(candidates, Math.max(0, b?.decided ?? 0));
    return {
      id: leg.id, name: leg.name ?? '', side: leg.side === true, notes: leg.notes ?? [], from: leg.from, to: leg.to, lengthMiles: length, line: b?.line ?? [], candidates, decided,
      stops, segments, towns: new Set(stops.map((s) => `${s.town}, ${s.state}`)).size,
      leadGapMiles: stops.length ? note(stops[0].mile) : null, longestGap,
      unmeasured: groups.map((u) => ({ id: u.id, name: u.name, note: u.note, stops: mine.filter((x) => x.unmeasured === u.id).sort((a, c) => a.name.localeCompare(c.name)).map((x) => ({ ...x, n: ++n, milesFromEnd: 0, gapAfterMiles: null })) })).filter((u) => u.stops.length),
      joins: b?.joins ?? 0, joinedMiles: b?.joinedMiles ?? 0, widestJoinMiles: b?.widestJoinMiles ?? 0,
      listed: stops.length + mine.filter((x) => x.unmeasured && groups.some((u) => u.id === x.unmeasured)).length,
      gaps: [
        ...(stops.length && note(stops[0].mile) !== null ? [{ fromMile: 0, toMile: stops[0].mile, miles: round(stops[0].mile, 1) }] : []),
        ...stops.filter((x) => x.gapAfterMiles !== null).map((x) => ({ fromMile: x.mile, toMile: round(x.mile + (x.gapAfterMiles as number), 1), miles: x.gapAfterMiles as number })),
      ],
    };
  });
  const stops = legs.flatMap((l) => [...l.stops, ...l.unmeasured.flatMap((u) => u.stops)]), dates = stops.flatMap((s) => [s.evidenceChecked]).sort();
  return {
    config, legs, stops, problems, unplaced: Math.max(0, built.unplaced ?? 0),
    candidates: legs.reduce((a, l) => a + l.candidates, 0), decided: legs.reduce((a, l) => a + l.decided, 0),
    available: config.publish === true && problems.length === 0 && stops.length > 0,
    checkedFrom: dates[0] || '', checkedTo: dates[dates.length - 1] || '',
  };
}
