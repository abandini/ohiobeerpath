// Single-road brewery trips (/roads): the road-line maths, the build step that turns checked rows into stops, and the
// gate that decides what may be shown. Pure functions and types, NO imports, so the build script
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
 * it by the towns of its stops, so a heading never names a town that has no checked stop.
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
  headline?: boolean;      // the trip the /roads index leads with
  maxDetourMiles: number;  // straight-line distance from the road within which a brewery is listed
  gapNoteMiles: number;    // a stretch at least this long with no stop gets a note
  geometry: { source: string; downloaded: string };
  about: string;           // what the page says about the road itself; every statement in it is supported by roadSources
  roadSources: QuoteSource[];
  legs: RoadLegConfig[];
}

/** A row from the brewery directory that lies near the road. Not shown anywhere until a checked row says it is open. */
export interface CandidateRow { id: number; name: string; city: string; state: string; latitude: number; longitude: number }
/** A checker's finding for one candidate. Only status OPEN with a quote, its source and a check date becomes a stop. */
export interface VerifiedRow {
  id: number; name?: string | null; status?: string | null; official_url?: string | null;
  address_as_printed?: string | null; address_source_url?: string | null;
  quote?: string | null; quote_source_url?: string | null; notes?: string | null; checked?: string | null;
  browser_checked?: string | null; // the day a person read the quote (and address) on the rendered page, for sites a script cannot read
}

export interface RoadStop {
  breweryId: number; name: string; town: string; state: string; lat: number; lon: number;
  status: string;              // as the checker recorded it; only "OPEN" is ever shown
  website: string;             // the brewery's own site as the checker found it ('' when none)
  address: string;             // as printed at addressSourceUrl ('' when the checker found no printed address)
  addressSourceUrl: string;
  quote: string; quoteSourceUrl: string; checked: string;
  legId: string;
  mile: number;                // along the leg from its start
  detourMiles: number;         // straight-line distance to the nearest part of the road
  pastEnd: '' | 'start' | 'end'; // the brewery sits beyond the end of the road, so its nearest point is the end itself
  browserChecked?: string;     // set only when the checker's row records a browser check on a real date
}
export interface BuiltLeg { id: string; lengthMiles: number; line: LatLon[]; rowsChecked: number }
/** What the build step writes: stops with their place on the road, and a thinned line for drawing. */
export interface BuiltRoad { slug: string; built: string; legs: BuiltLeg[]; stops: RoadStop[] }
export interface BuildReport { left: { id: number; name: string; reason: string }[]; legs: { id: string; lengthMiles: number; bridges: number; bridgedMiles: number; points: number }[] }

// ---------------------------------------------------------------------------------------------------------------------
// The gate

const httpUrl = (v: unknown): string => {
  if (typeof v !== 'string' || !v.trim()) return '';
  try { const u = new URL(v.trim()); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : ''; } catch { return ''; }
};
const calendarDate = (v: unknown): boolean => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
// Sources this site does not cite.
const BARRED_HOSTS = /(^|\.)(facebook\.com|fb\.com|reddit\.com|nextdoor\.com)$/i;
const citable = (v: unknown): string => { const u = httpUrl(v); return u && !BARRED_HOSTS.test(new URL(u).hostname) ? u : ''; };

/**
 * The one rule for what may appear as a stop: the checker found it OPEN, and there is a quote, the page it came from
 * and the day it was read. Everything else (closed, moved, unconfirmed, unchecked, or missing any of the three) is
 * left out. The build step applies this, and so does the page, so a hand-edited data file cannot get around it.
 */
export function isShowableStop(s: Partial<RoadStop> | null | undefined): s is RoadStop {
  return !!s && s.status === 'OPEN'
    && Number.isInteger(s.breweryId) && (s.breweryId as number) > 0
    && typeof s.name === 'string' && s.name.trim() !== ''
    && typeof s.quote === 'string' && s.quote.trim() !== ''
    && citable(s.quoteSourceUrl) !== ''
    && calendarDate(s.checked)
    && Number.isFinite(s.mile) && Number.isFinite(s.detourMiles) && (s.detourMiles as number) >= 0
    && typeof s.legId === 'string';
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
// Build: checked rows + directory coordinates + the road's ways -> stops in driving order

const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;
const PAST_END_MILES = 0.25;

export function segmentAt(leg: RoadLegConfig, mile: number): RoadSegmentConfig {
  return leg.segments.find((g) => g.toMile === null || mile < g.toMile) || leg.segments[leg.segments.length - 1];
}

export function buildRoad(config: RoadConfig, ways: LatLon[][], candidates: CandidateRow[], verified: VerifiedRow[], built: string): { road: BuiltRoad; report: BuildReport } {
  const report: BuildReport = { left: [], legs: [] };
  const legs = config.legs.map((leg) => {
    const legWays = ways.filter((w) => w.length > 0 && w[0][1] >= leg.lonRange[0] && w[0][1] < leg.lonRange[1]);
    const st = stitchLeg(legWays, leg.start, leg.end);
    if (st.startSnapMiles > 0.5 || st.endSnapMiles > 0.5) throw new Error(`${config.slug}/${leg.id}: the configured ends are ${st.startSnapMiles.toFixed(2)} and ${st.endSnapMiles.toFixed(2)} miles from the mapped road`);
    if (st.bridgedMiles > 0.5) throw new Error(`${config.slug}/${leg.id}: ${st.bridgedMiles.toFixed(2)} miles of the line are joins across gaps in the download`);
    if (!leg.segments.length || leg.segments[leg.segments.length - 1].toMile !== null) throw new Error(`${config.slug}/${leg.id}: the last segment must run to the end (toMile: null)`);
    leg.segments.forEach((g, i) => { const prev = i ? leg.segments[i - 1].toMile! : 0; if (g.toMile !== null && (g.toMile <= prev || g.toMile >= st.lengthMiles)) throw new Error(`${config.slug}/${leg.id}/${g.id}: toMile ${g.toMile} is out of order or past the end (${st.lengthMiles.toFixed(1)} mi)`); });
    report.legs.push({ id: leg.id, lengthMiles: st.lengthMiles, bridges: st.bridges, bridgedMiles: st.bridgedMiles, points: st.line.length });
    return { leg, st, cum: cumulativeMiles(st.line), rowsChecked: 0 };
  });

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const seen = new Set<number>(), stops: RoadStop[] = [];
  for (const row of verified) {
    const label = String(row?.name || `id ${row?.id}`);
    const leave = (reason: string) => report.left.push({ id: row?.id, name: label, reason });
    const cand = byId.get(row?.id);
    if (!cand) { leave('not among the directory candidates for this road'); continue; }
    if (!Number.isFinite(cand.latitude) || !Number.isFinite(cand.longitude)) { leave('no coordinates in the directory'); continue; }
    const p: LatLon = [cand.latitude, cand.longitude];
    // Nearest leg. The detour is measured to the same stitched line the miles are measured along.
    const near = legs.map((l) => ({ l, on: projectOntoLine(p, l.st.line, l.cum) })).sort((a, b) => a.on.detour - b.on.detour)[0];
    const on = near.on;
    near.l.rowsChecked++;
    if (seen.has(row.id)) { leave('second row for the same brewery id'); continue; }
    seen.add(row.id);
    if (row.status !== 'OPEN') { leave(`status ${row.status || 'missing'}`); continue; }
    const mile = round(on.along, 1), detourMiles = round(on.detour, 2);
    const limit = segmentAt(near.l.leg, on.along).maxDetourMiles ?? config.maxDetourMiles;
    if (on.detour > limit) { leave(`${detourMiles} mi from the road, over the ${limit} mi limit`); continue; }
    const atStart = on.along < 0.02, atEnd = on.along > near.l.st.lengthMiles - 0.02;
    const stop: RoadStop = {
      breweryId: row.id, name: String(row.name || cand.name || '').trim(), town: String(cand.city || '').trim(), state: String(cand.state || '').trim(),
      lat: cand.latitude, lon: cand.longitude, status: 'OPEN',
      website: citable(row.official_url),
      address: citable(row.address_source_url) ? String(row.address_as_printed || '').trim() : '',
      addressSourceUrl: String(row.address_as_printed || '').trim() ? citable(row.address_source_url) : '',
      quote: String(row.quote || '').trim(), quoteSourceUrl: citable(row.quote_source_url), checked: String(row.checked || '').trim(),
      legId: near.l.leg.id, mile, detourMiles,
      pastEnd: on.detour > PAST_END_MILES && (atStart || atEnd) ? (atStart ? 'start' : 'end') : '',
      ...(calendarDate(row.browser_checked) ? { browserChecked: row.browser_checked as string } : {}),
    };
    if (!isShowableStop(stop)) { leave('OPEN, but the quote, its source URL or the check date is missing or not citable'); continue; }
    stops.push(stop);
  }
  const order = new Map(config.legs.map((l, i) => [l.id, i]));
  stops.sort((a, b) => order.get(a.legId)! - order.get(b.legId)! || a.mile - b.mile || a.detourMiles - b.detourMiles || a.name.localeCompare(b.name));
  return {
    road: {
      slug: config.slug, built,
      legs: legs.map((l) => ({ id: l.leg.id, lengthMiles: round(l.st.lengthMiles, 1), line: simplifyLine(l.st.line, 0.12).map((q) => [round(q[0], 5), round(q[1], 5)] as LatLon), rowsChecked: l.rowsChecked })),
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
  checked: boolean;            // false when no checked rows have been built for this leg yet
  stops: StopView[]; segments: SegmentView[]; towns: number;
  leadGapMiles: number | null; // start of the leg to the first stop, when long enough to note
  longestGap: { fromMile: number; toMile: number; miles: number } | null;
}
export interface RoadView {
  config: RoadConfig; legs: LegView[]; stops: StopView[];
  available: boolean;          // at least one stop passes the gate; an unavailable road has no page and no links
  lastChecked: string; firstChecked: string;
}

/** "Warren", "Warren and Youngstown", "A, B and C", or "A to D" for four or more towns, in driving order. */
export function townsName(towns: string[]): string {
  const t = towns.filter((x, i) => x && towns.indexOf(x) === i);
  if (t.length <= 1) return t[0] || '';
  if (t.length === 2) return `${t[0]} and ${t[1]}`;
  if (t.length === 3) return `${t[0]}, ${t[1]} and ${t[2]}`;
  return `${t[0]} to ${t[t.length - 1]}`;
}

export function viewRoad(config: RoadConfig, built: BuiltRoad): RoadView {
  let n = 0;
  const legs: LegView[] = config.legs.map((leg) => {
    const b = built.legs.find((x) => x.id === leg.id);
    const length = b?.lengthMiles ?? 0;
    const shown = built.stops.filter((s) => isShowableStop(s) && s.legId === leg.id && s.mile >= 0 && s.mile <= length + 0.05 && s.detourMiles <= (segmentAt(leg, s.mile).maxDetourMiles ?? config.maxDetourMiles))
      .slice().sort((a, c) => a.mile - c.mile || a.detourMiles - c.detourMiles || a.name.localeCompare(c.name));
    const note = (gap: number) => (gap >= config.gapNoteMiles ? round(gap, 1) : null);
    const stops: StopView[] = shown.map((s, i) => ({ ...s, n: ++n, milesFromEnd: round(length - s.mile, 1), gapAfterMiles: note((i + 1 < shown.length ? shown[i + 1].mile : length) - s.mile) }));
    const marks = [0, ...stops.map((s) => s.mile), length];
    let longestGap: LegView['longestGap'] = null;
    if (stops.length) for (let i = 1; i < marks.length; i++) { const miles = round(marks[i] - marks[i - 1], 1); if (!longestGap || miles > longestGap.miles) longestGap = { fromMile: marks[i - 1], toMile: marks[i], miles }; }
    const segments: SegmentView[] = leg.segments.map((g, i) => {
      const fromMile = i ? leg.segments[i - 1].toMile! : 0, toMile = g.toMile ?? length;
      const mine = stops.filter((s) => segmentAt(leg, s.mile).id === g.id);
      return { id: g.id, name: g.name || townsName(mine.map((s) => s.town)) || `Mile ${Math.round(fromMile)} to ${Math.round(toMile)}`, fromMile, toMile, link: g.link, stops: mine };
    });
    return {
      id: leg.id, from: leg.from, to: leg.to, lengthMiles: length, line: b?.line ?? [], checked: (b?.rowsChecked ?? 0) > 0,
      stops, segments, towns: new Set(stops.map((s) => `${s.town}, ${s.state}`)).size,
      leadGapMiles: stops.length ? note(stops[0].mile) : null, longestGap,
    };
  });
  const stops = legs.flatMap((l) => l.stops), dates = stops.map((s) => s.checked).sort();
  return { config, legs, stops, available: stops.length > 0, lastChecked: dates[dates.length - 1] || '', firstChecked: dates[0] || '' };
}
