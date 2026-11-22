import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildRoad, cumulativeMiles, isShowableStop, unreadVerdict, verifierExit, BROWSER_CHECK_MAX_DAYS, milesBetween, projectOntoLine, simplifyLine, stitchLeg, townsName, viewRoad,
  type BuiltRoad, type CandidateRow, type LatLon, type RoadConfig, type RoadStop, type VerifiedRow,
} from '../../src/lib/road-trip';
import { roadTripPage, roadsIndexPage, roadSummary, detourLabel, directionsUrl, mapsPlace, stretchLinks, MAPS_MAX_WAYPOINTS, OSM_ATTRIBUTION } from '../../src/templates/road-trip';
import { ALL_ROADS, availableRoads, roadBySlug, roadStopFor } from '../../src/data/roads';
import { US_422 } from '../../src/data/roads/us-422';
import { US_422_BUILT } from '../../src/data/roads/us-422.built';
import { roadCallout } from '../../src/templates/brewery';
import { trailsPage } from '../../src/templates/trails';
import pageRoutes from '../../src/routes/pages';
import { resetTapListCache } from '../../src/services/taplist';

// ---------------------------------------------------------------------------------------------------------------------
// A small made-up road: due east along latitude 40 from longitude -80 to -79. At that latitude one degree of longitude
// is 52.93 miles and one degree of latitude is 69.09 miles, so the answers can be worked out by hand.
// The ways arrive out of order, one of them backwards, with a second carriageway beside the middle and a side spur.
const LAT = 40, DEG_LON = 52.93, DEG_LAT = 69.09;
const run = (from: number, to: number, lat = LAT): LatLon[] => { const out: LatLon[] = []; for (let i = 0; i <= 10; i++) out.push([lat, +(from + (to - from) * i / 10).toFixed(6)]); return out; };
const WAYS: LatLon[][] = [
  run(-79.4, -79),                                            // last stretch, listed first
  run(-79.7, -80).map((p) => p),                              // first stretch, drawn east to west
  run(-79.7, -79.4),                                          // middle
  [[LAT, -79.7], [LAT + 0.0003, -79.69], [LAT + 0.0003, -79.41], [LAT, -79.4]], // the other carriageway of the middle
  [[LAT, -79.52], [LAT + 0.2, -79.52]],                       // a spur north from a point on the road, 13.8 miles
];
const START: LatLon = [LAT, -80], END: LatLon = [LAT, -79];
const ok = (id: number, more: Partial<VerifiedRow> = {}): VerifiedRow => ({
  id, name: `Fixture Brewing ${id}`, status: 'OPEN', official_url: `https://example.com/${id}`,
  address_as_printed: `${id} Fixture St`, address_source_url: `https://example.com/${id}/visit`,
  quote: `Fixture quote ${id}`, quote_source_url: `https://example.com/${id}/about`, checked: '2026-11-22', ...more,
});
const cand = (id: number, lon: number, latOff = 0, city = 'Fixtureville'): CandidateRow => ({ id, name: `Directory name ${id}`, city, state: 'PA', latitude: LAT + latOff, longitude: lon });
const CONFIG: RoadConfig = {
  slug: 'fixture-road', name: 'Fixture Route 1', shortName: 'FR 1', maxDetourMiles: 5, gapNoteMiles: 15,
  geometry: { source: 'A made-up line for tests', downloaded: '2026-11-22' },
  about: 'A made-up road for tests.', roadSources: [{ quote: 'made up', url: 'https://example.com/road', checked: '2026-11-22' }],
  legs: [{ id: 'only', from: 'Westend, Pennsylvania', to: 'Eastend, Pennsylvania', start: START, end: END, lonRange: [-81, -78], segments: [{ id: 'a', toMile: 20 }, { id: 'b', toMile: null }] }],
};
const CANDIDATES: CandidateRow[] = [
  cand(1, -79.9, 0, 'Alpha'), cand(2, -79.5, 0.02, 'Bravo'), cand(3, -79.1, -0.01, 'Charlie'), cand(4, -79.3), cand(5, -79.6), cand(6, -79.2),
  cand(7, -79.8), cand(8, -79.7), cand(9, -79.45), cand(10, -79.5, 0.09), cand(11, -79.75, 0, 'Alpha'), cand(12, -80.02, 0, 'Westend'),
];
const VERIFIED: VerifiedRow[] = [
  ok(3), ok(1), ok(2),                                             // out of driving order on purpose
  ok(4, { status: 'CLOSED' }), ok(5, { status: 'UNCONFIRMED' }), ok(6, { status: 'MOVED/RENAMED' }),
  ok(7, { quote: '  ' }), ok(8, { quote_source_url: null }), ok(9, { checked: '2026-02-30' }),
  ok(10),                                                          // open and sourced, but 6.2 miles off the road
  ok(11, { quote_source_url: 'https://www.facebook.com/fixture' }),
  ok(99),                                                          // not a directory candidate
  ok(12), ok(1, { name: 'Second row for brewery 1' }),
  { id: 13 } as VerifiedRow,
];
const built = () => buildRoad(CONFIG, WAYS, CANDIDATES, VERIFIED, '2026-11-22');

describe('road line maths', () => {
  it('measures distance the same way as the walking tour', () => {
    expect(milesBetween([41.5, -81.7], [41.51, -81.7])).toBeCloseTo(0.691, 2);
  });
  it('stitches shuffled and reversed ways into one line from start to end', () => {
    const s = stitchLeg(WAYS, START, END);
    expect(s.line[0]).toEqual(START); expect(s.line.at(-1)).toEqual(END);
    for (let i = 1; i < s.line.length; i++) expect(s.line[i][1]).toBeGreaterThan(s.line[i - 1][1]); // always heading east
    expect(s.bridges).toBe(0);
  });
  it('counts a divided stretch once and leaves the spur out', () => {
    const s = stitchLeg(WAYS, START, END);
    expect(s.lengthMiles).toBeCloseTo(DEG_LON, 1);                 // 52.9, not 52.9 + 15.9 (second carriageway) + 13.8 (spur)
    expect(s.line.every((p) => p[0] === LAT)).toBe(true);
  });
  it('joins way ends that nearly meet and says how much it joined, but refuses a real hole', () => {
    const nearly = [run(-80, -79.5), run(-79.499, -79)];           // 0.053 miles apart
    const s = stitchLeg(nearly, START, END);
    expect(s.bridges).toBe(1); expect(s.bridgedMiles).toBeCloseTo(0.053, 2);
    expect(() => stitchLeg([run(-80, -79.6), run(-79.4, -79)], START, END)).toThrow(/do not connect/);
  });
  it('projects a point onto the line: miles along and straight-line miles off', () => {
    const line = stitchLeg(WAYS, START, END).line, cum = cumulativeMiles(line);
    const p = projectOntoLine([LAT + 0.02, -79.5], line, cum);
    expect(p.along).toBeCloseTo(0.5 * DEG_LON, 1);                 // 26.5
    expect(p.detour).toBeCloseTo(0.02 * DEG_LAT, 2);               // 1.38
    const before = projectOntoLine([LAT, -80.02], line, cum);      // west of the start: clamps to mile 0
    expect(before.along).toBe(0); expect(before.detour).toBeCloseTo(0.02 * DEG_LON, 1);
  });
  it('thins a line for drawing without moving its ends', () => {
    const line = stitchLeg(WAYS, START, END).line, thin = simplifyLine(line, 0.1);
    expect(thin.length).toBe(2); expect(thin[0]).toEqual(line[0]); expect(thin[1]).toEqual(line.at(-1));
    expect(simplifyLine([[40, -80], [40.1, -79.5], [40, -79]], 0.1)).toHaveLength(3);
  });
  it('names a stretch by its towns', () => {
    expect(townsName([])).toBe(''); expect(townsName(['A', 'A'])).toBe('A'); expect(townsName(['A', 'B'])).toBe('A and B');
    expect(townsName(['A', 'B', 'C'])).toBe('A, B and C'); expect(townsName(['A', 'B', 'A', 'C', 'D'])).toBe('A to D');
  });
});

describe('building stops from checked rows', () => {
  const { road, report } = built();
  it('keeps only rows that are OPEN with a quote, a citable source and a real check date', () => {
    expect(road.stops.map((s) => s.breweryId)).toEqual([12, 1, 2, 3]);
    const why = (id: number) => report.left.filter((x) => x.id === id).map((x) => x.reason).join('; ');
    expect(why(4)).toMatch(/CLOSED/); expect(why(5)).toMatch(/UNCONFIRMED/); expect(why(6)).toMatch(/MOVED/);
    expect(why(7)).toMatch(/quote/); expect(why(8)).toMatch(/source/); expect(why(9)).toMatch(/check date/);
    expect(why(10)).toMatch(/over the 5 mi limit/); expect(why(11)).toMatch(/not citable/);
    expect(why(99)).toMatch(/not among the directory candidates/); expect(why(1)).toMatch(/second row/); expect(why(13)).toMatch(/not among|status missing/);
    expect(report.left).toHaveLength(VERIFIED.length - road.stops.length);
  });
  it('puts stops in driving order with hand-checkable miles and detours', () => {
    const [w, a, b, c] = road.stops;
    expect(a.mile).toBeCloseTo(0.1 * DEG_LON, 1); expect(a.detourMiles).toBe(0);
    expect(b.mile).toBeCloseTo(0.5 * DEG_LON, 1); expect(b.detourMiles).toBeCloseTo(0.02 * DEG_LAT, 1);
    expect(c.mile).toBeCloseTo(0.9 * DEG_LON, 1); expect(c.detourMiles).toBeCloseTo(0.01 * DEG_LAT, 1);
    expect(w.mile).toBe(0); expect(w.pastEnd).toBe('start'); expect(w.detourMiles).toBeCloseTo(0.02 * DEG_LON, 1);
    expect(road.legs[0].lengthMiles).toBeCloseTo(DEG_LON, 1); expect(road.legs[0].rowsChecked).toBe(13);
  });
  it('takes the name and links from the checked row and the town and coordinates from the directory', () => {
    const a = road.stops[1];
    expect(a).toMatchObject({ name: 'Fixture Brewing 1', town: 'Alpha', state: 'PA', website: 'https://example.com/1', address: '1 Fixture St', quote: 'Fixture quote 1', checked: '2026-11-22' });
  });
  it('drops a printed address that has no source, and a non-web link', () => {
    const r = buildRoad(CONFIG, WAYS, CANDIDATES, [ok(1, { address_source_url: null, official_url: 'javascript:alert(1)' })], '2026-11-22').road.stops[0];
    expect(r.address).toBe(''); expect(r.addressSourceUrl).toBe(''); expect(r.website).toBe('');
  });
  it('a tighter limit on one stretch applies only there', () => {
    const tight: RoadConfig = { ...CONFIG, legs: [{ ...CONFIG.legs[0], segments: [{ id: 'a', toMile: 20 }, { id: 'b', toMile: null, maxDetourMiles: 1 }] }] };
    expect(buildRoad(tight, WAYS, CANDIDATES, [ok(1), ok(2), ok(3)], '2026-11-22').road.stops.map((s) => s.breweryId)).toEqual([1, 3]);
  });
  it('refuses a config whose ends are off the mapped road or whose stretches are out of order', () => {
    expect(() => buildRoad({ ...CONFIG, legs: [{ ...CONFIG.legs[0], start: [40.3, -80] }] }, WAYS, [], [], 'x')).toThrow(/from the mapped road/);
    expect(() => buildRoad({ ...CONFIG, legs: [{ ...CONFIG.legs[0], segments: [{ id: 'a', toMile: 60 }, { id: 'b', toMile: null }] }] }, WAYS, [], [], 'x')).toThrow(/past the end/);
    expect(() => buildRoad({ ...CONFIG, legs: [{ ...CONFIG.legs[0], segments: [{ id: 'a', toMile: 20 }] }] }, WAYS, [], [], 'x')).toThrow(/to the end/);
  });
});

describe('the gate and the view', () => {
  const good = built().road.stops[1];
  it('isShowableStop refuses anything that is not open, sourced and dated', () => {
    expect(isShowableStop(good)).toBe(true);
    for (const bad of [{ status: 'CLOSED' }, { status: 'UNCONFIRMED' }, { status: 'open' }, { quote: '' }, { quoteSourceUrl: '' }, { quoteSourceUrl: 'javascript:alert(1)' },
      { quoteSourceUrl: 'https://m.facebook.com/x' }, { checked: '' }, { checked: 'yesterday' }, { breweryId: 0 }, { name: ' ' }, { mile: NaN }, { detourMiles: -1 }] as Partial<RoadStop>[])
      expect(isShowableStop({ ...good, ...bad }), JSON.stringify(bad)).toBe(false);
    expect(isShowableStop(null)).toBe(false);
  });
  it('a hand-edited data file cannot get an unverified stop onto the page', () => {
    const b = built().road;
    const tampered: BuiltRoad = { ...b, stops: [...b.stops, { ...good, breweryId: 500, name: 'Sneaked In Closed', status: 'CLOSED' }, { ...good, breweryId: 501, name: 'Sneaked In Unsourced', quoteSourceUrl: '' }, { ...good, breweryId: 502, name: 'Sneaked In Far Away', detourMiles: 9 }] };
    const v = viewRoad(CONFIG, tampered);
    expect(v.stops.map((s) => s.breweryId)).toEqual([12, 1, 2, 3]);
    const html = roadTripPage(v);
    expect(html).not.toContain('Sneaked In');
  });
  it('works out stretches, gaps, totals and the last-checked date', () => {
    const v = viewRoad(CONFIG, built().road), leg = v.legs[0];
    expect(v.available).toBe(true); expect(v.lastChecked).toBe('2026-11-22');
    expect(leg.stops.map((s) => s.n)).toEqual([1, 2, 3, 4]);
    expect(leg.segments.map((g) => [g.name, g.stops.length])).toEqual([['Westend and Alpha', 2], ['Bravo and Charlie', 2]]);
    expect(leg.towns).toBe(4);
    expect(leg.stops[1].gapAfterMiles).toBeCloseTo(0.4 * DEG_LON, 1);   // Alpha to Bravo, 21.2 miles: noted
    expect(leg.stops[0].gapAfterMiles).toBeNull();                       // 5.3 miles: not noted
    expect(leg.longestGap!.miles).toBeCloseTo(0.4 * DEG_LON, 1);
    expect(leg.stops[3].milesFromEnd).toBeCloseTo(0.1 * DEG_LON, 1);
    expect(leg.leadGapMiles).toBeNull();
  });
  it('a road with no showable stop is not available, and a leg with no checked rows says so', () => {
    const none = viewRoad(CONFIG, buildRoad(CONFIG, WAYS, CANDIDATES, [ok(4, { status: 'CLOSED' })], '2026-11-22').road);
    expect(none.available).toBe(false); expect(none.legs[0].checked).toBe(true);
    expect(viewRoad(CONFIG, buildRoad(CONFIG, WAYS, CANDIDATES, [], '2026-11-22').road).legs[0].checked).toBe(false);
    expect(availableRoads([none])).toEqual([]); expect(roadBySlug('fixture-road', [none])).toBeUndefined();
  });
});

describe('road trip page', () => {
  const view = viewRoad(CONFIG, built().road);
  const html = roadTripPage(view);
  const main = html.slice(html.indexOf('<h1'));
  it('renders the open, sourced stops in driving order and nothing else', () => {
    const order = [...main.matchAll(/id="stop-(\d+)"/g)].map((m) => Number(m[1]));
    expect(order).toEqual([12, 1, 2, 3]);
    for (const id of [4, 5, 6, 7, 8, 9, 10, 11, 99]) { expect(html).not.toContain(`Fixture Brewing ${id}<`); expect(html).not.toContain(`/brewery/${id}"`); }
    expect(html).not.toContain('Directory name');
  });
  it('gives every stop its mile, detour, address, quote, source, date and both links', () => {
    for (const s of view.stops) {
      const li = main.slice(main.indexOf(`id="stop-${s.breweryId}"`), main.indexOf('</li>', main.indexOf(`id="stop-${s.breweryId}"`)));
      expect(li).toContain(`href="/brewery/${s.breweryId}"`); expect(li).toContain(`href="${s.website}"`);
      expect(li).toContain(`“${s.quote}”`); expect(li).toContain(`href="${s.quoteSourceUrl}"`); expect(li).toContain(`checked ${s.checked}`);
      expect(li).toContain(s.address); expect(li).toContain(`href="${s.addressSourceUrl}"`);
      expect(li).toContain(`mile ${s.mile.toFixed(1)} from Westend, ${s.milesFromEnd.toFixed(1)} from Eastend`);
      expect(li).toContain('straight-line');
    }
    expect(main).toContain('Its nearest point on the road is the Westend end.');
  });
  it('labels detours by size and always as straight-line', () => {
    expect(detourLabel(0.04)).toBe('On the road: under 0.1 mi off, straight-line');
    expect(detourLabel(1.38)).toBe('Short detour: 1.4 mi off, straight-line');
    expect(detourLabel(3.66)).toBe('Longer detour: 3.7 mi off, straight-line');
  });
  it('marks the long stretch with no stop, and the totals for the leg', () => {
    expect(main).toMatch(/<strong>21\.2 miles<\/strong> from here \(mile 5\.3\) to the next stop on this list/);
    expect(main).toMatch(/52\.9 miles on our line · 4 stops in 4 towns · longest stretch with no stop: 21\.2 miles/);
    expect(main).toContain('Last checked'); expect(main).toContain('2026-11-22');
  });
  it('says what the list is and does not claim to be complete', () => {
    expect(main).toContain('4 breweries from our directory within 5 miles of FR 1, in driving order, each checked against its own website on 2026-11-22.');
    expect(main).toContain('It is not every brewery near the road');
    expect(main).not.toMatch(/\b(every|all) (the )?brewer(y|ies) (on|along)\b/i);
  });
  it('says so when a stop was confirmed from a site other than the brewery\'s own', () => {
    const v = viewRoad(CONFIG, buildRoad(CONFIG, WAYS, CANDIDATES, [ok(1), ok(2, { quote_source_url: 'https://untappd.com/v/fixture/2' }), ok(3, { official_url: null })], '2026-11-22').road);
    expect(roadSummary(v)).toBe("3 breweries from our directory within 5 miles of FR 1, in driving order, each confirmed open on 2026-11-22 from the source linked under it: the brewery's own website for 1, another site for 2.");
    expect(roadTripPage(v)).toContain('Read on <a href="https://untappd.com/v/fixture/2" rel="noopener" target="_blank">untappd.com</a>, checked 2026-11-22');
  });
  it('carries plain responsible-travel wording near the top', () => {
    const at = main.indexOf('Decide who is driving before the first stop.');
    expect(at).toBeGreaterThan(0); expect(at).toBeLessThan(main.indexOf('id="leg-only"'));
    expect(main).toContain('It is not a plan to visit them all in a day');
  });
  it('credits OpenStreetMap beside the map and in the method notes, and loads nothing for the map', () => {
    expect(OSM_ATTRIBUTION).toBe('© OpenStreetMap contributors');
    const fig = main.slice(main.indexOf('<figure class="rt-map">'), main.indexOf('</figure>'));
    expect(fig).toContain('<svg'); expect(fig).toContain('<polyline'); expect(fig).toContain(OSM_ATTRIBUTION); expect(fig).toContain('https://www.openstreetmap.org/copyright');
    expect((fig.match(/<circle class="dot"/g) || []).length).toBe(4);
    expect(fig).toMatch(/role="img" aria-labelledby="map-only-t"/);
    expect(main.split(OSM_ATTRIBUTION).length - 1).toBeGreaterThanOrEqual(2);
    const content = main.slice(0, main.indexOf('</main>') > 0 ? main.indexOf('</main>') : main.length);
    expect(content.slice(0, content.indexOf('id="how"'))).not.toMatch(/<script(?! type="application\/ld\+json")|<iframe|<img/);
  });
  it('has one h1, a canonical on the national site, breadcrumbs and headings in order', () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('<link rel="canonical" href="https://brewerytrip.com/roads/fixture-road"');
    expect(html).toContain('<li class="breadcrumb-item"><a href="/roads" class="text-white-50">Road trips</a></li>');
    const body = main.slice(0, main.indexOf('id="how"'));
    const levels = [...body.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1], `heading ${i}`).toBeLessThanOrEqual(1);
  });
  it('emits a TouristTrip with every stop and a BreadcrumbList', () => {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
    const trip = blocks.find((b) => b['@type'] === 'TouristTrip');
    expect(trip.itinerary.itemListElement).toHaveLength(4);
    expect(trip.itinerary.itemListElement[1].item).toMatchObject({ '@type': 'Brewery', name: 'Fixture Brewing 1', url: 'https://brewerytrip.com/brewery/1', sameAs: 'https://example.com/1' });
    expect(blocks.find((b) => b['@type'] === 'BreadcrumbList').itemListElement.map((x: { name: string }) => x.name)).toEqual(['Home', 'Road trips', 'Fixture Route 1']);
  });
  it('escapes every value that comes from the data', () => {
    const X = '<script>alert(1)</script>"\'<b>';
    const evil: VerifiedRow[] = [ok(1, { name: `N${X}`, address_as_printed: `A${X}`, quote: `Q${X}`, quote_source_url: `https://example.com/q?x="><script>alert(2)</script>`, official_url: 'javascript:alert(3)', checked: '2026-11-22' })];
    const cfg: RoadConfig = { ...CONFIG, name: `R${X}`, shortName: `S${X}`, about: `B${X}`, geometry: { source: `G${X}`, downloaded: `D${X}` }, roadSources: [{ quote: `RQ${X}`, url: 'https://example.com/"><script>alert(4)</script>', checked: `C${X}` }],
      legs: [{ ...CONFIG.legs[0], from: `F${X}, PA`, to: `T${X}, PA`, segments: [{ id: 'a', toMile: null, name: `SEG${X}`, link: { href: `/x"><script>alert(5)</script>`, text: `L${X}` } }] }] };
    const out = roadTripPage(viewRoad(cfg, buildRoad(cfg, WAYS, [{ ...cand(1, -79.9), city: `C${X}`, state: `S${X}` }], evil, '2026-11-22').road));
    // JSON-LD blocks are data, not markup: they are checked separately below (they must parse, and cannot close early).
    const body = out.slice(out.indexOf('<h1')).replace(/<script type="application\/ld\+json">.*?<\/script>/gs, '');
    expect(body).not.toContain('<script>alert'); expect(body).not.toContain(`'<b>`); expect(body).not.toContain('javascript:');
    expect(body).not.toMatch(/"><script/);
    expect(out.slice(0, out.indexOf('<h1')).replace(/<script type="application\/ld\+json">.*?<\/script>/gs, '')).not.toContain('<script>alert');
    expect(body).toContain('N&lt;script&gt;alert(1)&lt;/script&gt;');
    for (const m of out.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) expect(() => JSON.parse(m[1])).not.toThrow();
    const idx = roadsIndexPage([viewRoad(cfg, buildRoad(cfg, WAYS, [cand(1, -79.9)], evil, '2026-11-22').road)]);
    expect(idx.slice(idx.indexOf('<h1')).replace(/<script type="application\/ld\+json">.*?<\/script>/gs, '')).not.toContain('<script>alert');
    expect(idx).toContain('Breweries along R&lt;script&gt;alert(1)&lt;/script&gt;');
  });
  it('shows a stop without a printed address as such, never a directory address', () => {
    const v = viewRoad(CONFIG, buildRoad(CONFIG, WAYS, CANDIDATES, [ok(1, { address_as_printed: null, address_source_url: null })], '2026-11-22').road);
    expect(roadTripPage(v)).toContain('We did not find a street address printed on its site; see the site for directions.');
  });
  it('says a leg is still being checked when no rows have been built for it', () => {
    const two: RoadConfig = { ...CONFIG, legs: [CONFIG.legs[0], { ...CONFIG.legs[0], id: 'second', from: 'Farwest, Ohio', to: 'Nearwest, Ohio', start: [41, -85], end: [41, -84], lonRange: [-86, -83] }] };
    const out = roadTripPage(viewRoad(two, buildRoad(two, [...WAYS, run(-85, -84, 41)], CANDIDATES, VERIFIED, '2026-11-22').road));
    expect(out).toContain('The Farwest to Nearwest leg is still being checked and has no stops yet.');
    expect(out).toContain('We have not finished checking the breweries along this leg');
    expect(out).toContain('Leg 2: Farwest to Nearwest');
  });
  it('marks medal winners, and tap lists only when a current one is on file', () => {
    const medal = viewRoad(CONFIG, buildRoad(CONFIG, WAYS, [cand(218, -79.9), cand(208, -79.8), cand(1, -79.7)], [ok(218), ok(208), ok(1)], '2026-11-22').road);
    const now = Date.parse('2026-11-22T12:00:00Z');
    const fresh = roadTripPage(medal, { now, tapLists: new Map([[218, '2026-11-14T15:00:00.000Z'], [1, '2026-09-01T15:00:00.000Z'], [208, null]]) });
    expect(fresh).toContain('7 Ohio Craft Brewers Cup medals'); expect(fresh).toMatch(/7 GABF medals<\/a>|7 GABF medals since 2013/);
    expect(fresh).toContain('<a href="/brewery/218#on-tap-heading"><span aria-hidden="true">🍺</span> Tap list, updated November 14, 2026</a>');
    expect(fresh.match(/Tap list, updated/g)).toHaveLength(1);       // the September list is stale, the third has no date
    expect(roadTripPage(medal, { now, tapLists: null })).not.toContain('Tap list, updated');
    expect(roadTripPage(medal, { now })).not.toContain('Tap list, updated');
  });
  it('stays inside a phone screen: the map scales and long words wrap', () => {
    expect(html).toMatch(/\.rt-map svg\{display:block;width:100%;height:auto/);
    expect(html).toMatch(/\.rt\{[^}]*overflow-wrap:anywhere/);
    expect(html).toMatch(/<svg viewBox="0 0 360 \d+"/);
  });
});

describe('browser checks for sources a script cannot read', () => {
  it('carries a real browser-check date from the row into the built stop, and nothing otherwise', () => {
    const r = buildRoad(CONFIG, WAYS, CANDIDATES, [ok(1, { browser_checked: '2026-11-22' }), ok(2), ok(3, { browser_checked: 'by eye' })], '2026-11-22').road.stops;
    expect(r.map((s) => s.browserChecked)).toEqual(['2026-11-22', undefined, undefined]);
  });
  it('fresh, stale and absent browser checks', () => {
    expect(BROWSER_CHECK_MAX_DAYS).toBe(45);
    expect(unreadVerdict('2026-11-22', '2026-11-22')).toBe('browser-checked');
    expect(unreadVerdict('2026-11-22', '2027-01-06')).toBe('browser-checked');       // day 45
    expect(unreadVerdict('2026-11-22', '2027-01-07')).toBe('browser-check-stale');   // day 46
    expect(unreadVerdict(undefined, '2026-11-22')).toBe('unread'); expect(unreadVerdict('', '2026-11-22')).toBe('unread');
    expect(unreadVerdict('2026-02-30', '2026-11-22')).toBe('unread'); expect(unreadVerdict('2026-12-01', '2026-11-22')).toBe('unread'); // not a date; in the future
  });
  it('exit 0 only when nothing is missing and every unread source has a current browser check', () => {
    expect(verifierExit({ total: 78, missing: 0, unread: 0, stale: 0 })).toBe(0);   // browser-checked ones are in neither count
    expect(verifierExit({ total: 78, missing: 1, unread: 0, stale: 0 })).toBe(2);
    expect(verifierExit({ total: 78, missing: 0, unread: 1, stale: 0 })).toBe(2);
    expect(verifierExit({ total: 78, missing: 0, unread: 0, stale: 1 })).toBe(2);
    expect(verifierExit({ total: 0, missing: 0, unread: 0, stale: 0 })).toBe(2);
  });
  it('the three script-rendered US 422 sites carry the browser check, and no other stop does', () => {
    expect(US_422_BUILT.stops.filter((s) => s.browserChecked).map((s) => s.breweryId).sort((a, b) => a - b)).toEqual([82, 261, 1082]);
    expect(US_422_BUILT.stops.find((s) => s.breweryId === 82)!.address).toBe('8284 Washington St Chagrin Falls, Ohio 44023-4508');
  });
});

describe('Google Maps links', () => {
  const st = (name: string, address = '', more: Record<string, string> = {}) => ({ name, address, addressSourceUrl: address ? 'https://example.com/visit' : '', town: 'Alpha', state: 'PA', ...more });
  const params = (href: string) => new URL(href).searchParams;
  it('names a place by its printed address, adding town and state only when the address lacks them', () => {
    expect(mapsPlace(st('Troegs', '200 East Hershey Park Drive, Hershey, PA 17033', { town: 'Hershey' }))).toBe('Troegs, 200 East Hershey Park Drive, Hershey, PA 17033');
    expect(mapsPlace(st('CR Brewing', '3009 Wilmington Rd #B', { town: 'New Castle' }))).toBe('CR Brewing, 3009 Wilmington Rd #B, New Castle, PA');
    expect(mapsPlace(st('Crooked Pecker', '8284 East Washington St CHAGRIN FALLS, Ohio 44023', { town: 'Newbury', state: 'OH' }))).not.toContain('Newbury');
    expect(mapsPlace(st('Noble Beast', '1470 Lakeside Ave E Cleveland, OH', { town: 'Cleveland', state: 'OH' }))).toBe('Noble Beast, 1470 Lakeside Ave E Cleveland, OH');
  });
  it('a stop with no printed address goes by name, town and state, never a directory street', () => {
    expect(mapsPlace(st('Pompatus'))).toBe('Pompatus, Alpha, PA');
    expect(mapsPlace({ ...st('Unsourced', '12 Directory St'), addressSourceUrl: '' })).toBe('Unsourced, Alpha, PA');
    const v = viewRoad(CONFIG, buildRoad(CONFIG, WAYS, [{ ...cand(1, -79.9, 0, 'Alpha'), street: '99 Directory Street' } as CandidateRow], [ok(1, { address_as_printed: null, address_source_url: null })], '2026-11-22').road);
    const html = roadTripPage(v);
    expect(html).not.toContain('Directory Street');
    expect(html).toContain('destination=Fixture%20Brewing%201%2C%20Alpha%2C%20PA"');
  });
  it('encodes apostrophes, ampersands, # and commas so the place survives the trip', () => {
    const s = st("Bummin' Beaver & Sons #2", '11610 Washington St, Unit #B, Chagrin Falls, OH 44023');
    const href = directionsUrl(s);
    expect(href.startsWith('https://www.google.com/maps/dir/?api=1&destination=')).toBe(true);
    expect(href).not.toMatch(/#| /);
    expect(href.split('&')).toHaveLength(2);                          // only api=1 and destination: the "&" in the name is encoded
    expect(params(href).get('destination')).toBe("Bummin' Beaver & Sons #2, 11610 Washington St, Unit #B, Chagrin Falls, OH 44023");
    expect(params(href).get('api')).toBe('1');
  });
  it('a stretch link runs origin, waypoints, destination in driving order', () => {
    const stops = ['A & A', 'B #2', "C's", 'D|D'].map((n) => st(n));
    const [l] = stretchLinks(stops);
    expect(stretchLinks(stops)).toHaveLength(1); expect([l.from, l.to]).toEqual([1, 4]);
    expect(params(l.href).get('origin')).toBe('A & A, Alpha, PA'); expect(params(l.href).get('destination')).toBe('D|D, Alpha, PA');
    expect(l.href).toContain('&waypoints=B%20%232%2C%20Alpha%2C%20PA%7CC\'s%2C%20Alpha%2C%20PA');
    expect(l.href.match(/%7C/g)).toHaveLength(2);                     // one separator, plus the encoded pipe inside "D|D"
    expect(params(l.href).get('travelmode')).toBe('driving');
    expect(params(stretchLinks(stops.slice(0, 2))[0].href).has('waypoints')).toBe(false);
  });
  it('splits a long stretch into consecutive links of at most three waypoints, dropping no stop', () => {
    expect(MAPS_MAX_WAYPOINTS).toBe(3);
    expect(stretchLinks([])).toEqual([]); expect(stretchLinks([st('only')])).toEqual([]);
    for (const n of [2, 5, 6, 7, 10, 11, 16, 23]) {
      const stops = Array.from({ length: n }, (_, i) => st(`S${i + 1}`)), links = stretchLinks(stops);
      const seen: string[] = [];
      links.forEach((l, i) => {
        expect(l.from).toBe(i ? links[i - 1].to + 1 : 1);
        const q = params(l.href), way = (q.get('waypoints') || '').split('|').filter(Boolean);
        expect(way.length).toBeLessThanOrEqual(3); expect(l.to - l.from).toBeGreaterThanOrEqual(1);
        seen.push(q.get('origin')!, ...way, q.get('destination')!);
      });
      expect(links.at(-1)!.to).toBe(n);
      expect(seen).toEqual(stops.map((s) => `${s.name}, Alpha, PA`));
    }
    expect(stretchLinks(Array.from({ length: 16 }, (_, i) => st(`S${i}`))).map((l) => [l.from, l.to])).toEqual([[1, 5], [6, 10], [11, 14], [15, 16]]);
  });
  it('the page carries one Directions link per stop and stretch links only where a stretch has two or more stops', () => {
    const view = viewRoad(CONFIG, built().road), html = roadTripPage(view);
    const links = [...html.matchAll(/<a href="(https:\/\/www\.google\.com\/maps\/dir\/[^"]+)" rel="noopener nofollow" target="_blank">([^<]+)<\/a>/g)];
    expect(links.filter((m) => m[2] === 'Directions (opens Google Maps)')).toHaveLength(view.stops.length);
    expect(links.filter((m) => m[2] === 'Open this stretch in Google Maps')).toHaveLength(2);
    expect((html.match(/google\.com\/maps/g) || []).length).toBe(links.length);  // every Google link has the rel, target and text
    expect(html).toContain("The route Google draws is Google's and may not follow FR 1. Our miles are measured on our own line.");
    expect(html).not.toMatch(/maps\.googleapis|maps\/embed|<iframe/);
    const one = roadTripPage(viewRoad(CONFIG, buildRoad(CONFIG, WAYS, CANDIDATES, [ok(1)], '2026-11-22').road));
    expect(one).not.toContain('Open this stretch'); expect(one).toContain('Directions (opens Google Maps)');
  });
  it('escapes the link inside the attribute', () => {
    const v = viewRoad(CONFIG, buildRoad(CONFIG, WAYS, CANDIDATES, [ok(1, { name: 'A "quoted" <b> & Co' }), ok(2, { name: "O'Brien & Sons" })], '2026-11-22').road);
    const html = roadTripPage(v);
    const hrefs = [...html.matchAll(/href="(https:\/\/www\.google\.com\/maps\/dir\/[^"]*)"/g)].map((m) => m[1]);
    expect(hrefs).toHaveLength(2);                                   // two stops, in different stretches: no stretch link
    expect(hrefs[0]).toContain('&amp;destination=A%20%22quoted%22%20%3Cb%3E%20%26%20Co%2C');
    for (const x of hrefs) { expect(x).not.toMatch(/[<> ]/); expect(x.replace(/&amp;/g, '')).not.toContain('&'); }
    expect(new URL(hrefs[1].replace(/&amp;/g, '&')).searchParams.get('destination')).toBe("O'Brien & Sons, 2 Fixture St, Bravo, PA");
  });
  it('every real link stays under Google\'s 2,048-character limit', () => {
    for (const road of ALL_ROADS) for (const leg of road.legs) for (const g of leg.segments) {
      for (const l of stretchLinks(g.stops)) expect(l.href.length).toBeLessThan(2048);
      for (const s of g.stops) expect(directionsUrl(s).length).toBeLessThan(2048);
    }
  });
});

describe('/roads index', () => {
  const a = viewRoad(CONFIG, built().road);
  const empty = viewRoad({ ...CONFIG, slug: 'not-ready', name: 'Not Ready Road' }, buildRoad(CONFIG, WAYS, CANDIDATES, [], '2026-11-22').road);
  const headline = viewRoad({ ...CONFIG, slug: 'headline-road', name: 'Headline Road', headline: true }, built().road);
  it('lists only roads that have checked stops, the headline trip first', () => {
    const list = availableRoads([a, empty, headline]);
    expect(list.map((r) => r.config.slug)).toEqual(['headline-road', 'fixture-road']);
    const html = roadsIndexPage(list), main = html.slice(html.indexOf('<h1'));
    expect(main).not.toContain('Not Ready Road'); expect(main).not.toContain('/roads/not-ready');
    expect(main.indexOf('/roads/headline-road')).toBeLessThan(main.indexOf('/roads/fixture-road'));
    expect(main.match(/class="rt-card rt-headline"/g)).toHaveLength(1);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('<link rel="canonical" href="https://brewerytrip.com/roads"');
    expect(main).toContain(OSM_ATTRIBUTION); expect(main).toContain('Decide who is driving before the first stop.');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
    expect(blocks.find((b) => b['@type'] === 'ItemList' && b.url === 'https://brewerytrip.com/roads').itemListElement.map((x: { url: string }) => x.url)).toEqual(['https://brewerytrip.com/roads/headline-road', 'https://brewerytrip.com/roads/fixture-road']);
  });
  it('a stop brewery page links to its road trip; others do not', () => {
    expect(roadCallout(2, [a])).toContain('href="/roads/fixture-road#stop-2"');
    expect(roadCallout(2, [a])).toContain('Mile 26.5 of the Westend to Eastend leg, 1.4 miles off the road in a straight line. Checked 2026-11-22.');
    expect(roadCallout(4, [a])).toBe(''); expect(roadStopFor(2, [empty])).toBeNull();
  });
});

describe('the real road data (src/data/roads)', () => {
  it('every stop that is published passes the gate, sits within the limit and is in driving order', () => {
    for (const road of ALL_ROADS) {
      for (const leg of road.legs) {
        expect(leg.lengthMiles).toBeGreaterThan(1); expect(leg.line.length).toBeGreaterThan(1);
        leg.stops.forEach((s, i) => {
          expect(isShowableStop(s), s.name).toBe(true);
          expect(s.detourMiles).toBeLessThanOrEqual(road.config.maxDetourMiles);
          expect(s.quoteSourceUrl).toMatch(/^https?:\/\//); expect(s.quoteSourceUrl).not.toMatch(/facebook|reddit|nextdoor/i);
          if (s.address) expect(s.addressSourceUrl).toMatch(/^https?:\/\//);
          if (i) expect(s.mile).toBeGreaterThanOrEqual(leg.stops[i - 1].mile);
        });
      }
      for (const src of road.config.roadSources) { expect(src.quote.length).toBeGreaterThan(8); expect(src.url).toMatch(/^https:\/\//); expect(src.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
    }
  });
  it('US 422 is two legs of about 187 and 82 miles, measured from the committed OpenStreetMap ways', () => {
    expect(US_422_BUILT.legs.map((l) => [l.id, Math.round(l.lengthMiles)])).toEqual([['west', 187], ['east', 82]]);
  });
  it('the built file is exactly what the build step makes from data/roads/us-422 (no hand edits, no stale build)', () => {
    const dir = join(__dirname, '../../data/roads/us-422');
    const read = (f: string) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const verified: VerifiedRow[] = readdirSync(dir).filter((f) => /^verified.*\.json$/.test(f)).sort().flatMap(read);
    const fresh = buildRoad(US_422, read('osm-ways.json'), read('candidates.json'), verified, US_422_BUILT.built).road;
    expect(fresh).toEqual(US_422_BUILT);
    const open = new Set(verified.filter((r) => r.status === 'OPEN').map((r) => r.id));
    for (const s of US_422_BUILT.stops) expect(open.has(s.breweryId), s.name).toBe(true);
    for (const r of verified.filter((x) => x.status !== 'OPEN')) expect(US_422_BUILT.stops.some((s) => s.breweryId === r.id), String(r.name)).toBe(false);
  });
});

describe('routes and links', () => {
  const env = { TAPLIST_API_URL: 'http://not-used.invalid' }; // not https, so the tap-list lookup fails closed without a request
  it('serves /roads and each available road, and 404s an unknown one', async () => {
    resetTapListCache();
    const roads = availableRoads();
    const index = await pageRoutes.request('/roads', {}, env);
    expect(index.status).toBe(roads.length ? 200 : 404);
    for (const r of roads) {
      const res = await pageRoutes.request(`/roads/${r.config.slug}`, {}, env);
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain(OSM_ATTRIBUTION); expect(body).not.toContain('Tap list, updated');
      expect((await index.clone().text())).toContain(`href="/roads/${r.config.slug}"`);
    }
    expect((await pageRoutes.request('/roads/route-66', {}, env)).status).toBe(404);
    expect((await pageRoutes.request('/roads/__proto__', {}, env)).status).toBe(404);
  });
  it('the trails page and footer link to /roads only while a road is available', () => {
    const html = trailsPage([]);
    expect(html.includes('href="/roads"')).toBe(availableRoads().length > 0);
  });
});
