import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildRoad, cumulativeMiles, isShowableStop, unreadVerdict, verifierExit, BROWSER_CHECK_MAX_DAYS, milesBetween, projectOntoLine, simplifyLine, stitchLeg, townsName, viewRoad,
  roadConfigProblems, safeSitePath, normaliseCheckerFiles, applyRowEdits, readCoordinates, stopKey, stateAbbr, distanceToWays, asPrinted, pageText, hoursOnly, sameStreet, sameLocation, townInAddress, stopProblems, excerptFound,
  type AddressGeocode, type BuiltRoad, type CandidateRow, type LatLon, type RoadConfig, type RoadStop, type VerifiedRow,
} from '../../src/lib/road-trip';
import {
  roadTripPage, roadsIndexPage, roadSummary, roadsBlurb, coverageText, distanceLabel, directionsUrl, mapsPlace, stretchLinks, quoteAdds,
  MAPS_MAX_WAYPOINTS, MAPS_URL_LIMIT, OSM_ATTRIBUTION, DRIVING_NOTICE,
} from '../../src/templates/road-trip';
import { allRoads, availableRoads, roadBySlug, roadStopFor } from '../../src/data/roads';
import { US_422 } from '../../src/data/roads/us-422';
import { US_422_BUILT } from '../../src/data/roads/us-422.built';
import { ROUTE_66 } from '../../src/data/roads/route-66';
import { ROUTE_66_BUILT } from '../../src/data/roads/route-66.built';
import { I_71 } from '../../src/data/roads/i-71';
import { I_71_BUILT } from '../../src/data/roads/i-71.built';
import { roadCallout } from '../../src/templates/brewery';
import { trailsPage } from '../../src/templates/trails';
import pageRoutes from '../../src/routes/pages';
import { resetTapListCache } from '../../src/services/taplist';

// ---------------------------------------------------------------------------------------------------------------------
// A small made-up road: due east along latitude 40 from longitude -80 to -79. At that latitude one degree of longitude
// is 52.93 miles and one degree of latitude is 69.09 miles, so the answers can be worked out by hand.
// The ways arrive out of order, one of them backwards, with a second carriageway beside the middle and a side spur.
const LAT = 40, DEG_LON = 52.93, DEG_LAT = 69.09, TODAY = '2026-11-22';
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
  quote: `Fixture quote ${id}`, quote_source_url: `https://example.com/${id}/about`, checked: TODAY,
  operating_evidence: { excerpt: `Fixture hours ${id}: Monday 12pm - 9pm`, url: `https://example.com/${id}/hours`, checked: TODAY }, ...more,
});
const cand = (id: number, lon: number, latOff = 0, city = 'Fixtureville'): CandidateRow => ({ id, name: `Directory name ${id}`, city, state: 'PA', latitude: LAT + latOff, longitude: lon });
const CONFIG: RoadConfig = {
  slug: 'fixture-road', name: 'Fixture Route 1', shortName: 'FR 1', publish: true, maxDetourMiles: 5, gapNoteMiles: 15,
  geometry: { source: 'A made-up line for tests', downloaded: TODAY },
  about: 'A made-up road for tests.', roadSources: [{ quote: 'made up', url: 'https://example.com/road', checked: TODAY }],
  legs: [{ id: 'only', from: 'Westend, Pennsylvania', to: 'Eastend, Pennsylvania', start: START, end: END, lonRange: [-81, -78], segments: [{ id: 'a', toMile: 20 }, { id: 'b', toMile: null }] }],
};
const CANDIDATES: CandidateRow[] = [
  cand(1, -79.9, 0, 'Alpha'), cand(2, -79.5, 0.02, 'Bravo'), cand(3, -79.1, -0.01, 'Charlie'), cand(4, -79.3), cand(5, -79.6), cand(6, -79.2),
  cand(7, -79.8), cand(8, -79.7), cand(9, -79.45), cand(10, -79.5, 0.09), cand(11, -79.75, 0, 'Alpha'), cand(12, -80.02, 0, 'Westend'), cand(14, -79.35), cand(15, -79.25),
];
const VERIFIED: VerifiedRow[] = [
  ok(3), ok(1), ok(2),                                             // out of line order on purpose
  ok(4, { status: 'CLOSED' }), ok(5, { status: 'UNCONFIRMED' }), ok(6, { status: 'MOVED/RENAMED' }),
  ok(7, { operating_evidence: null }),                             // OPEN with a quote but no operating evidence
  ok(8, { operating_evidence: { excerpt: 'Open daily', url: null, checked: TODAY } }),
  ok(9, { checked: '2026-02-30' }),
  ok(10),                                                          // open and evidenced, but 6.2 miles from the line
  ok(11, { operating_evidence: { excerpt: 'Open daily 12-9', url: 'https://www.facebook.com/fixture', checked: TODAY } }),
  ok(99),                                                          // not a directory candidate
  ok(12), ok(1, { name: 'Second row for brewery 1' }),
  { id: 13 } as VerifiedRow,
  ok(14, { operating_evidence: { excerpt: 'Open daily 12-9', url: 'https://example.com/14', checked: '2026-11-23' } }), // read "tomorrow"
];                                                                 // candidate 15 has no row at all
const built = (rows: VerifiedRow[] = VERIFIED, config: RoadConfig = CONFIG, cands: CandidateRow[] = CANDIDATES) => buildRoad(config, WAYS, cands, rows, TODAY, TODAY);
const view = (rows?: VerifiedRow[], config: RoadConfig = CONFIG, cands?: CandidateRow[]) => viewRoad(config, built(rows, config, cands).road, TODAY);
const noLd = (html: string) => html.replace(/<script type="application\/ld\+json">.*?<\/script>/gs, '');

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
  it('keeps only rows that are OPEN with operating evidence: an excerpt, a citable page and a real, past check date', () => {
    expect(road.stops.map((s) => s.breweryId)).toEqual([12, 1, 2, 3]);
    const why = (id: number) => report.left.filter((x) => x.id === id).map((x) => x.reason).join('; ');
    expect(why(4)).toMatch(/CLOSED/); expect(why(5)).toMatch(/UNCONFIRMED/); expect(why(6)).toMatch(/MOVED/);
    for (const id of [7, 8, 9, 11, 14]) expect(why(id), String(id)).toMatch(/no usable operating evidence/);
    expect(why(10)).toMatch(/over the limit/);
    expect(why(99)).toMatch(/not among the directory candidates/); expect(why(1)).toMatch(/second row/); expect(why(13)).toMatch(/not among/);
    expect(report.left).toHaveLength(VERIFIED.length - road.stops.length);
  });
  it('a quote, however good, does not make a stop without operating evidence', () => {
    const r = built([ok(1, { operating_evidence: null, quote: 'Established in 2016 by three longtime friends who love beer.' }), ok(2, { operating_evidence: { excerpt: '  ', url: 'https://example.com/2', checked: TODAY } })]);
    expect(r.road.stops).toEqual([]);
  });
  it('a stop needs no descriptive quote, and a quote without a citable page is dropped', () => {
    const s = built([ok(1, { quote: null, quote_source_url: null }), ok(2, { quote_source_url: 'https://www.reddit.com/r/x' })]).road.stops;
    expect(s.map((x) => [x.breweryId, x.quote, x.quoteSourceUrl])).toEqual([[1, '', ''], [2, '', '']]);
  });
  it('orders stops by nearest point along the line, with hand-checkable miles and straight-line distances', () => {
    const [w, a, b, c] = road.stops;
    expect(a.mile).toBeCloseTo(0.1 * DEG_LON, 1); expect(a.detourMiles).toBe(0);
    expect(b.mile).toBeCloseTo(0.5 * DEG_LON, 1); expect(b.detourMiles).toBeCloseTo(0.02 * DEG_LAT, 1);
    expect(c.mile).toBeCloseTo(0.9 * DEG_LON, 1); expect(c.detourMiles).toBeCloseTo(0.01 * DEG_LAT, 1);
    expect(w.mile).toBe(0); expect(w.pastEnd).toBe('start'); expect(w.detourMiles).toBeCloseTo(0.02 * DEG_LON, 1);
    expect(road.legs[0].lengthMiles).toBeCloseTo(DEG_LON, 1);
  });
  it('counts a candidate as decided only when it is listed or its row settles it', () => {
    // Within 5 miles: 1-9, 11, 12, 14, 15 (10 is 6.2 miles off). Decided: stops 12, 1, 2, 3; CLOSED 4; MOVED 6.
    expect(road.legs[0]).toMatchObject({ candidates: 13, decided: 6 });
    expect(report.undecided.map((x) => x.id).sort((a, b) => a - b)).toEqual([5, 7, 8, 9, 11, 14, 15]);
    expect(report.undecided.find((x) => x.id === 15)!.why).toBe('no checked row');
    expect(report.undecided.find((x) => x.id === 5)!.why).toBe('checked without a completed decision');
    // one processed but unconfirmed row does not make a leg "checked"
    expect(built([ok(5, { status: 'UNCONFIRMED' })]).road.legs[0]).toMatchObject({ candidates: 13, decided: 0 });
  });
  it('takes the name, links and evidence from the checked row and the town and coordinates from the directory', () => {
    expect(road.stops[1]).toMatchObject({ name: 'Fixture Brewing 1', town: 'Alpha', state: 'PA', website: 'https://example.com/1', address: '1 Fixture St',
      evidence: 'Fixture hours 1: Monday 12pm - 9pm', evidenceUrl: 'https://example.com/1/hours', evidenceChecked: TODAY, quote: 'Fixture quote 1', checked: TODAY });
  });
  it('drops a printed address that has no source, and a non-web link', () => {
    const r = built([ok(1, { address_source_url: null, official_url: 'javascript:alert(1)' })]).road.stops[0];
    expect(r.address).toBe(''); expect(r.addressSourceUrl).toBe(''); expect(r.website).toBe('');
  });
  it('a tighter limit on one stretch applies only there', () => {
    const tight: RoadConfig = { ...CONFIG, legs: [{ ...CONFIG.legs[0], segments: [{ id: 'a', toMile: 20 }, { id: 'b', toMile: null, maxDetourMiles: 1 }] }] };
    expect(built([ok(1), ok(2), ok(3)], tight).road.stops.map((s) => s.breweryId)).toEqual([1, 3]);
  });
  it('refuses a config whose ends are off the mapped road, whose stretches are out of order, or whose ids are not plain', () => {
    expect(() => built([], { ...CONFIG, legs: [{ ...CONFIG.legs[0], start: [40.3, -80] }] }, [])).toThrow(/from the mapped road/);
    expect(() => built([], { ...CONFIG, legs: [{ ...CONFIG.legs[0], segments: [{ id: 'a', toMile: 60 }, { id: 'b', toMile: null }] }] }, [])).toThrow(/past the end/);
    expect(() => built([], { ...CONFIG, legs: [{ ...CONFIG.legs[0], segments: [{ id: 'a', toMile: 20 }] }] }, [])).toThrow(/to the end/);
    expect(() => built([], { ...CONFIG, slug: 'Bad Slug' }, [])).toThrow(/slug/);
    expect(() => built([], { ...CONFIG, legs: [{ ...CONFIG.legs[0], id: 'x" onclick="y' }] }, [])).toThrow(/leg id/);
  });
});

describe('the gate and the view', () => {
  const good = built().road.stops[1];
  it('isShowableStop refuses anything that is not open, evidenced and dated in the past', () => {
    expect(isShowableStop(good, TODAY)).toBe(true);
    expect(isShowableStop({ ...good, quote: '', quoteSourceUrl: '' }, TODAY)).toBe(true);     // the quote is optional
    for (const bad of [{ status: 'CLOSED' }, { status: 'UNCONFIRMED' }, { status: 'open' }, { evidence: '' }, { evidence: '   ' }, { evidenceUrl: '' }, { evidenceUrl: 'javascript:alert(1)' },
      { evidenceUrl: 'https://m.facebook.com/x' }, { evidenceChecked: '' }, { evidenceChecked: 'yesterday' }, { evidenceChecked: '2026-11-23' }, { checked: '' }, { checked: '2027-01-01' },
      { breweryId: 0 }, { name: ' ' }, { mile: NaN }, { detourMiles: -1 }] as Partial<RoadStop>[])
      expect(isShowableStop({ ...good, ...bad }, TODAY), JSON.stringify(bad)).toBe(false);
    expect(isShowableStop(null, TODAY)).toBe(false);
    const { evidence: _e, evidenceUrl: _u, evidenceChecked: _c, ...old } = good;               // a stop built before evidence was required
    expect(isShowableStop(old as Partial<RoadStop>, TODAY)).toBe(false);
  });
  it('a check dated in the future is refused, and with the clock unset nothing shows', () => {
    expect(isShowableStop(good, '2026-11-21')).toBe(false);
    expect(isShowableStop(good, '1970-01-01')).toBe(false);          // a Worker's top level: fails closed
    expect(viewRoad(CONFIG, built().road, '1970-01-01').available).toBe(false);
    expect(isShowableStop(good, '2027-06-01')).toBe(true);
  });
  it('a hand-edited data file cannot get an unverified stop onto the page', () => {
    const b = built().road;
    const tampered: BuiltRoad = { ...b, stops: [...b.stops, { ...good, breweryId: 500, name: 'Sneaked In Closed', status: 'CLOSED' }, { ...good, breweryId: 501, name: 'Sneaked In Unevidenced', evidence: '' },
      { ...good, breweryId: 502, name: 'Sneaked In Far Away', detourMiles: 9 }, { ...good, breweryId: 503, name: 'Sneaked In From Tomorrow', evidenceChecked: '2026-11-23' }] };
    const v = viewRoad(CONFIG, tampered, TODAY);
    expect(v.stops.map((s) => s.breweryId)).toEqual([12, 1, 2, 3]);
    expect(roadTripPage(v)).not.toContain('Sneaked In');
  });
  it('works out stretches, gaps, coverage and the source-check dates', () => {
    const v = view(), leg = v.legs[0];
    expect(v.available).toBe(true); expect([v.checkedFrom, v.checkedTo]).toEqual([TODAY, TODAY]);
    expect([v.candidates, v.decided]).toEqual([13, 6]);
    expect(leg.stops.map((s) => s.n)).toEqual([1, 2, 3, 4]);
    expect(leg.segments.map((g) => [g.name, g.stops.length])).toEqual([['Westend and Alpha', 2], ['Bravo and Charlie', 2]]);
    expect(leg.towns).toBe(4);
    expect(leg.stops[1].gapAfterMiles).toBeCloseTo(0.4 * DEG_LON, 1);   // Alpha to Bravo, 21.2 miles: noted
    expect(leg.stops[0].gapAfterMiles).toBeNull();                       // 5.3 miles: not noted
    expect(leg.longestGap!.miles).toBeCloseTo(0.4 * DEG_LON, 1);
    expect(leg.stops[3].milesFromEnd).toBeCloseTo(0.1 * DEG_LON, 1);
    expect(leg.leadGapMiles).toBeNull();
    const mixed = view([ok(1), ok(2, { operating_evidence: { excerpt: 'Open daily 12-9', url: 'https://example.com/2', checked: '2026-11-20' } })]);
    expect([mixed.checkedFrom, mixed.checkedTo]).toEqual(['2026-11-20', TODAY]);
  });
  it('publication needs the explicit flag as well as stops; stops alone are never enough', () => {
    expect(view(undefined, { ...CONFIG, publish: false }).available).toBe(false);
    expect(view(undefined, { ...CONFIG, publish: 'yes' as unknown as boolean }).available).toBe(false);
    const { publish: _p, ...unset } = CONFIG;
    expect(viewRoad(unset as RoadConfig, built().road, TODAY).available).toBe(false);
    const none = view([ok(4, { status: 'CLOSED' })]);
    expect(none.available).toBe(false);                                  // flag set, nothing to list
    expect(availableRoads([none, view(undefined, { ...CONFIG, publish: false })])).toEqual([]);
    expect(roadBySlug('fixture-road', [view(undefined, { ...CONFIG, publish: false })])).toBeUndefined();
    expect(roadStopFor(2, [view(undefined, { ...CONFIG, publish: false })])).toBeNull();
    expect(roadCallout(2, [view(undefined, { ...CONFIG, publish: false })])).toBe('');
  });
  it('a config with an unsafe id, slug or link is reported and never published', () => {
    expect(roadConfigProblems(CONFIG)).toEqual([]);
    const badId: RoadConfig = { ...CONFIG, legs: [{ ...CONFIG.legs[0], id: 'x" onmouseover="alert(1)' }] };
    expect(roadConfigProblems(badId).join(' ')).toMatch(/leg id/);
    expect(roadConfigProblems({ ...CONFIG, slug: '../admin' }).join(' ')).toMatch(/slug/);
    expect(roadConfigProblems({ ...CONFIG, legs: [{ ...CONFIG.legs[0], segments: [{ id: 'A b', toMile: null }] }] }).join(' ')).toMatch(/segment id/);
    const badLink: RoadConfig = { ...CONFIG, legs: [{ ...CONFIG.legs[0], segments: [{ id: 'a', toMile: null, link: { href: 'javascript:alert(1)', text: 'click' } }] }] };
    expect(roadConfigProblems(badLink).join(' ')).toMatch(/link/);
    const v = viewRoad(badId, built().road, TODAY);
    expect(v.available).toBe(false); expect(v.stops).toEqual([]);
  });
  it('site links must be plain root-relative paths', () => {
    for (const good of ['/trails/downtown-cleveland', '/roads/us-422#stop-1', '/plan?from=a&to=b']) expect(safeSitePath(good)).toBe(good);
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', '//evil.example/x', '/\\evil.example', 'https://evil.example/', 'data:text/html,x', '/a\nb', '/a\tb', '/a b', '/a"b', '\\\\evil', '', 'trails', undefined, null, 7])
      expect(safeSitePath(bad), String(bad)).toBe('');
  });
});

describe('road trip page', () => {
  const v = view();
  const html = roadTripPage(v);
  const main = html.slice(html.indexOf('<h1'));
  const item = (id: number) => main.slice(main.indexOf(`id="stop-${id}"`), main.indexOf('</li>', main.indexOf(`id="stop-${id}"`)));
  it('renders the open, evidenced stops ordered by nearest point along the line, and nothing else', () => {
    expect([...main.matchAll(/id="stop-(\d+)"/g)].map((m) => Number(m[1]))).toEqual([12, 1, 2, 3]);
    for (const id of [4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 99]) { expect(html).not.toContain(`Fixture Brewing ${id}<`); expect(html).not.toContain(`/brewery/${id}"`); }
    expect(html).not.toContain('Directory name');
  });
  it('shows the operating evidence as the reason a stop is listed, with its page and date', () => {
    for (const s of v.stops) {
      const li = item(s.breweryId);
      expect(li).toContain(`<strong>Operating evidence: hours read on ${TODAY}</strong>`);
      expect(li).toContain(`“${s.evidence}”`); expect(li).toContain(`href="${s.evidenceUrl}"`);
      expect(li).toContain(`</a>. Check current opening information with the brewery before you travel.`);
      expect(li).toContain(`href="/brewery/${s.breweryId}"`); expect(li).toContain(`href="${s.website}"`);
      expect(li).toContain(s.address); expect(li).toContain(`href="${s.addressSourceUrl}"`);
      expect(li).toContain(`nearest point on our mapped line: mile ${s.mile.toFixed(1)} from Westend, ${s.milesFromEnd.toFixed(1)} from Eastend`);
      expect(li).toContain('from the mapped road, straight-line');
      expect(li).not.toContain('Fixture quote');                       // a short quote adds nothing and is not shown
    }
    expect(main).toContain('Its nearest point on our mapped line is the Westend end.');
  });
  it('keeps the descriptive quote only when it adds something', () => {
    const long = 'Downtown Fixtureville’s first brewery since 1880, with a kitchen and a garden.';
    const w = view([ok(1, { quote: long }), ok(2, { quote: 'OPEN FOR DINING!' }), ok(3, { quote: 'Fixture hours 3: Monday 12pm - 9pm and every other day too, we promise' })]);
    expect(w.stops.map(quoteAdds)).toEqual([true, false, false]);
    const out = roadTripPage(w);
    expect(out).toContain(`“${long}”`); expect(out).toContain('Also read on <a href="https://example.com/1/about"');
    expect(out).not.toContain('OPEN FOR DINING!');
  });
  it('gives the straight-line distance without calling it a detour or "on the road"', () => {
    expect(distanceLabel(0.04)).toBe('Under 0.1 miles from the mapped road, straight-line');
    expect(distanceLabel(1.38)).toBe('1.4 miles from the mapped road, straight-line');
    expect(distanceLabel(1.02)).toBe('1.0 mile from the mapped road, straight-line');
    expect(distanceLabel(3.66)).toBe('3.7 miles from the mapped road, straight-line');
  });
  it('never claims driving order, detours, or that a place is on the road', () => {
    for (const page of [main, roadsIndexPage([v]).slice(roadsIndexPage([v]).indexOf('<h1'))]) {
      // also: the date is when we read the hours, never a claim the place was open that day
      expect(page).not.toMatch(/driving order|in the order you reach|detour|on the road:|pick one or two|drive will be longer|confirmed open|open on \d{4}|list it as open|listed as open|was operating when|operating on the date/i);
      expect(page).toContain('ordered by their nearest point along');
      expect(page).toMatch(/not driving distances/);
    }
    expect(main).toContain('Driving distance and access may differ substantially.');
    expect(main).toContain('it is not the order or the distance you would drive');
  });
  it('marks the long gap and the leg totals as being about listed stops on our line', () => {
    expect(main).toMatch(/<strong>21\.2 miles<\/strong> along our mapped line from here \(mile 5\.3\) to the next listed stop, with nothing on this list in between\./);
    expect(main).toMatch(/52\.9 miles on our mapped line · 4 listed stops in 4 towns · longest gap between listed stops along our mapped line: 21\.2 miles \(mile 5\.3 to 26\.5\)/);
    // The ends of the line are not stops. Two stops 5 miles apart near the west end: the 42-mile run to the east end is
    // noted on its own and does not become the "longest gap between listed stops".
    const west = view([ok(12), ok(1)]), wl = west.legs[0], wHtml = roadTripPage(west);
    expect(wl.longestGap).toEqual({ fromMile: 0, toMile: 5.3, miles: 5.3 });
    expect(wl.stops[1].gapAfterMiles).toBeCloseTo(0.9 * DEG_LON, 1);
    expect(wHtml).toContain('longest gap between listed stops along our mapped line: 5.3 miles (mile 0.0 to 5.3)');
    expect(wHtml).toMatch(/<strong>47\.6 miles<\/strong> along our mapped line from here \(mile 5\.3\) to the end of the line at Eastend/);
    // and a long run from the start to the first stop is labelled as that
    const east = view([ok(2), ok(3)]), eHtml = roadTripPage(east);
    expect(east.legs[0].longestGap).toEqual({ fromMile: 26.5, toMile: 47.6, miles: 21.1 }); expect(east.legs[0].leadGapMiles).toBeCloseTo(0.5 * DEG_LON, 1);
    expect(eHtml).toMatch(/<strong>26\.5 miles<\/strong> along our mapped line from its start at Westend to the first listed stop\./);
    expect(eHtml).toContain('longest gap between listed stops along our mapped line: 21.1 miles (mile 26.5 to 47.6)');
    // one stop: no such figure at all
    const one = view([ok(2)]), oHtml = roadTripPage(one);
    expect(one.legs[0].longestGap).toBeNull();
    expect(oHtml).not.toContain('longest gap between listed stops'); expect(oHtml).toContain('1 listed stop in 1 town');
    expect(oHtml).toContain('from its start at Westend to the first listed stop'); expect(oHtml).toContain('to the end of the line at Eastend');
    expect(main).not.toMatch(/longest stretch with no stop/);
  });
  it('says what the list is, in the past tense, with honest dates and coverage', () => {
    expect(roadSummary(v)).toBe('4 breweries from our directory within 5 straight-line miles of our mapped line of FR 1, ordered by their nearest point along it; these are not driving distances. Each listing is supported by published visiting hours read on the date shown.');
    expect(main).toContain(roadSummary(v)); expect(main).toContain('It is not every brewery near the road.');
    expect(main).toMatch(/Source-check dates <b[^>]*>2026-11-22<\/b>/); expect(main).not.toContain('Last checked');
    expect(main).toContain('Our directory has 13 breweries within 5 straight-line miles of our mapped line of FR 1. We reached a decision on 6 of them. The other 7 could not be confirmed either way and are not listed.');
    expect(main).not.toMatch(/\b(every|all) (the )?brewer(y|ies) (on|along)\b/i);
    expect(main).not.toMatch(/passed our check|have been checked one at a time|confirmed open/);
    const mixed = view([ok(1), ok(2, { operating_evidence: { excerpt: 'Open daily 12-9', url: 'https://example.com/2', checked: '2026-11-20' } })]);
    expect(roadTripPage(mixed)).toMatch(/Source-check dates <b[^>]*>2026-11-20 to 2026-11-22<\/b>/);
    expect(roadTripPage(mixed)).toContain(`<strong>Operating evidence: hours read on 2026-11-20</strong>`);
  });
  it('coverage wording never implies a full review unless the counts say so', () => {
    expect(coverageText(3, 3, 5, 'this leg')).toBe('Our directory has 3 breweries within 5 straight-line miles of this leg. We reached a decision on all 3: listed here, or found closed, moved, a duplicate or not a taproom.');
    expect(coverageText(1, 3, 5, 'this leg')).toContain('We reached a decision on 1 of them. The other 2 could not be confirmed either way and are not listed.');
    expect(coverageText(0, 3, 5, 'this leg')).toContain('We have not reached a decision on any of them yet.');
    expect(coverageText(0, 0, 5, 'this leg')).toBe('Our directory has no brewery within 5 straight-line miles of this leg.');
    const two: RoadConfig = { ...CONFIG, legs: [CONFIG.legs[0], { ...CONFIG.legs[0], id: 'second', from: 'Farwest, Ohio', to: 'Nearwest, Ohio', start: [41, -85], end: [41, -84], lonRange: [-86, -83] }] };
    const cands = [...CANDIDATES, { ...cand(40, -84.5), latitude: 41 }, { ...cand(41, -84.6), latitude: 41 }];
    const out = roadTripPage(viewRoad(two, buildRoad(two, [...WAYS, run(-85, -84, 41)], cands, [...VERIFIED, { ...ok(40), status: 'UNCONFIRMED' }], TODAY, TODAY).road, TODAY));
    expect(out).toContain('Leg 2: Farwest to Nearwest');
    expect(out).toContain('Our directory has 2 breweries within 5 straight-line miles of this leg of our mapped line. We have not reached a decision on any of them yet. Nothing is listed on this leg.');
  });
  it('says plainly that a drinker must not drive, at the top and beside the multi-stop links', () => {
    expect(DRIVING_NOTICE).toBe('If you drink, do not drive. Arrange a driver who will not drink, or other transport, before you set out. This is a list of places, not a drinking itinerary.');
    const text = main.replace(/<[^>]+>/g, '');
    const at = text.indexOf(DRIVING_NOTICE);
    expect(at).toBeGreaterThan(0); expect(at).toBeLessThan(text.indexOf('Leg 1:'));
    expect(main).not.toMatch(/Decide who is driving|pick one or two/);
    const stretches = [...main.matchAll(/<p class="rt-links rt-stretch">.*?<\/p>\s*<p class="rt-src">([^<]*)<\/p>/gs)];
    expect(stretches).toHaveLength(2);
    for (const m of stretches) expect(m[1]).toBe('If you drink, do not drive: arrange a driver who will not drink, or other transport. Google chooses the route: it may not follow FR 1, and our miles are measured on our own mapped line.');
    expect(roadsIndexPage([v]).replace(/<[^>]+>/g, '')).toContain(DRIVING_NOTICE);
  });
  it('explains the Google Maps links and missing addresses as the code really behaves', () => {
    expect(main).toContain('We send Google the brewery name and sourced address where available. Otherwise we use its name and directory town and state; town and state may also supplement an incomplete address. Check the destination before travelling.');
    expect(main).not.toContain('and nothing else');
    const none = roadTripPage(view([ok(1, { address_as_printed: null, address_source_url: null, official_url: null })]));
    expect(none).toContain('We do not have a sourced street address for this listing.');
    expect(none).not.toMatch(/printed on its site|did not find a street address/);
    expect(main).toContain('They support listing the brewery as operating. They do not mean it was open on that date, and they are not a current timetable. Check current opening information with the brewery before you travel.');
  });
  it('names third-party sources, and pages a person read by eye, in the method notes', () => {
    expect(main).not.toContain('is not the brewery\'s own site');
    const w = view([ok(1), ok(2, { operating_evidence: { excerpt: 'Hours Monday Closed Tuesday 11:30AM - 11PM', url: 'https://untappd.com/v/fixture/2', checked: TODAY } }), ok(3, { browser_checked: TODAY })]);
    const out = roadTripPage(w);
    expect(roadSummary(w)).toContain("Each listing is supported by published visiting hours read on the date shown. For 1, the source is not the brewery's own site.");
    expect(out).toContain("For 1 stop the source is not the brewery's own site: Untappd (untappd.com).");
    expect(out).toContain('1 page could only be read in a browser; a person read it, not our checking script.');
    expect(roadsBlurb([w])).toBe('Breweries near one road, listed by where they fall along it, with straight-line distances that are not driving distances. Each listing is supported by published visiting hours read on the date shown; some sources are third-party.');
    expect(roadsBlurb([v])).toBe('Breweries near one road, listed by where they fall along it, with straight-line distances that are not driving distances. Each listing is supported by published visiting hours read on the date shown.');
  });
  it('credits OpenStreetMap beside the map and in the method notes, and loads nothing for the map', () => {
    expect(OSM_ATTRIBUTION).toBe('© OpenStreetMap contributors');
    const fig = main.slice(main.indexOf('<figure class="rt-map">'), main.indexOf('</figure>'));
    expect(fig).toContain('<svg'); expect(fig).toContain('<polyline'); expect(fig).toContain(OSM_ATTRIBUTION); expect(fig).toContain('https://www.openstreetmap.org/copyright');
    expect((fig.match(/<circle class="dot"/g) || []).length).toBe(4);
    expect(fig).toMatch(/role="img" aria-labelledby="map-only-t"/);
    expect(main.split(OSM_ATTRIBUTION).length - 1).toBeGreaterThanOrEqual(2);
    expect(main.slice(0, main.indexOf('id="how"'))).not.toMatch(/<script(?! type="application\/ld\+json")|<iframe|<img/);
  });
  it('has one h1, a canonical on the national site whatever host served it, breadcrumbs and headings in order', () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('<link rel="canonical" href="https://brewerytrip.com/roads/fixture-road"');
    const sub = { stateSubdomain: 'ohio', stateName: 'Ohio', stateAbbreviation: 'OH', isMultiState: false, baseUrl: 'https://ohio.brewerytrip.com', brandDomain: 'brewerytrip' as const };
    expect(roadTripPage(v, { subdomain: sub })).toContain('<link rel="canonical" href="https://brewerytrip.com/roads/fixture-road"');
    expect(roadsIndexPage([v], sub)).toContain('<link rel="canonical" href="https://brewerytrip.com/roads"');
    expect(html).toContain('<li class="breadcrumb-item"><a href="/roads" class="text-white-50">Road trips</a></li>');
    const levels = [...main.slice(0, main.indexOf('id="how"')).matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1], `heading ${i}`).toBeLessThanOrEqual(1);
  });
  it('emits a TouristTrip with every stop and a BreadcrumbList', () => {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
    const trip = blocks.find((b) => b['@type'] === 'TouristTrip');
    expect(trip.itinerary.itemListElement).toHaveLength(4); expect(trip.description).toBe(roadSummary(v));
    expect(trip.itinerary.itemListElement[1].item).toMatchObject({ '@type': 'Brewery', name: 'Fixture Brewing 1', url: 'https://brewerytrip.com/brewery/1', sameAs: 'https://example.com/1' });
    expect(blocks.find((b) => b['@type'] === 'BreadcrumbList').itemListElement.map((x: { name: string }) => x.name)).toEqual(['Home', 'Road trips', 'Fixture Route 1']);
  });
  it('escapes every value that comes from the data', () => {
    const X = '<script>alert(1)</script>"\'<b>';
    const evil: VerifiedRow[] = [ok(1, { name: `N${X}`, address_as_printed: `A${X}`, quote: `Q${X} and enough more words to be shown as a quote`, quote_source_url: `https://example.com/q?x="><script>alert(2)</script>`, official_url: 'javascript:alert(3)',
      operating_evidence: { excerpt: `E${X}`, url: `https://example.com/e?x="><script>alert(6)</script>`, checked: TODAY } })];
    const cfg: RoadConfig = { ...CONFIG, name: `R${X}`, shortName: `S${X}`, about: `B${X}`, geometry: { source: `G${X}`, downloaded: `D${X}` }, roadSources: [{ quote: `RQ${X}`, url: 'https://example.com/"><script>alert(4)</script>', checked: `C${X}` }],
      legs: [{ ...CONFIG.legs[0], from: `F${X}, PA`, to: `T${X}, PA`, segments: [{ id: 'a', toMile: null, name: `SEG${X}`, link: { href: '/trails', text: `L${X}` } }] }] };
    const w = viewRoad(cfg, buildRoad(cfg, WAYS, [{ ...cand(1, -79.9), city: `C${X}`, state: `S${X}` }, cand(2, -79.8)], [...evil, ok(2)], TODAY, TODAY).road, TODAY);
    const out = roadTripPage(w), body = noLd(out.slice(out.indexOf('<h1')));
    expect(body).not.toContain('<script>alert'); expect(body).not.toContain(`'<b>`); expect(body).not.toContain('javascript:');
    expect(body).not.toMatch(/"><script/);
    expect(noLd(out.slice(0, out.indexOf('<h1')))).not.toContain('<script>alert');
    expect(body).toContain('N&lt;script&gt;alert(1)&lt;/script&gt;'); expect(body).toContain('“E&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(body).toContain('>L&lt;script&gt;');                        // the link text of the stretch link
    for (const m of out.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) expect(() => JSON.parse(m[1])).not.toThrow();
    const idx = roadsIndexPage([w]);
    expect(noLd(idx.slice(idx.indexOf('<h1')))).not.toContain('<script>alert');
    expect(idx).toContain('Breweries along R&lt;script&gt;alert(1)&lt;/script&gt;');
  });
  it('an id with quotes cannot break out of an attribute, and a javascript: stretch link is never rendered', () => {
    // Such a config is refused by roadConfigProblems and never published; this renders it anyway, as a hand-built view,
    // to show the template itself does not depend on that.
    const good = view();
    const hostile = { ...good, legs: good.legs.map((l) => ({ ...l, id: 'x" onmouseover="alert(1)', segments: l.segments.map((g) => ({ ...g, id: 'y"><script>alert(7)</script>', link: { href: 'javascript:alert(8)', text: 'Click me' } })) })) };
    const out = noLd(roadTripPage(hostile));
    expect(out).not.toContain('onmouseover="alert(1)"'); expect(out).not.toContain('<script>alert(7)'); expect(out).not.toContain('javascript:');
    expect(out).not.toContain('Click me');
    expect(out).toContain('id="leg-x&quot; onmouseover=&quot;alert(1)"'); expect(out).toContain('aria-labelledby="leg-x&quot; onmouseover=&quot;alert(1)-h"');
    for (const bad of ['//evil.example/x', '/\\evil.example', 'https://evil.example', 'data:text/html,x']) {
      const cfg: RoadConfig = { ...CONFIG, legs: [{ ...CONFIG.legs[0], segments: [{ id: 'a', toMile: null, link: { href: bad, text: 'Bad link text' } }] }] };
      expect(roadConfigProblems(cfg)).toHaveLength(1);
      expect(roadTripPage({ ...good, config: cfg })).not.toContain('Bad link text');
    }
    const fine = view(undefined, { ...CONFIG, legs: [{ ...CONFIG.legs[0], segments: [{ id: 'a', toMile: null, link: { href: '/trails/downtown-cleveland', text: 'Good link text' } }] }] });
    expect(roadTripPage(fine)).toContain('<a href="/trails/downtown-cleveland">Good link text</a>');
  });
  it('marks medal winners, and tap lists only when a current one is on file', () => {
    const medal = view([ok(218), ok(208), ok(1)], CONFIG, [cand(218, -79.9), cand(208, -79.8), cand(1, -79.7)]);
    const now = Date.parse('2026-11-22T12:00:00Z');
    const fresh = roadTripPage(medal, { now, tapLists: new Map([[218, '2026-11-14T15:00:00.000Z'], [1, '2026-09-01T15:00:00.000Z'], [208, null]]) });
    expect(fresh).toContain('7 Ohio Craft Brewers Cup medals'); expect(fresh).toContain('7 GABF medals since 2013');
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
    const r = built([ok(1, { browser_checked: TODAY }), ok(2), ok(3, { browser_checked: 'by eye' })]).road.stops;
    expect(r.map((s) => s.browserChecked)).toEqual([TODAY, undefined, undefined]);
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
});

describe('Google Maps links', () => {
  const st = (name: string, address = '', more: Record<string, string> = {}) => ({ name, address, addressSourceUrl: address ? 'https://example.com/visit' : '', town: 'Alpha', state: 'PA', ...more });
  const params = (href: string) => new URL(href).searchParams;
  it('names a place by its sourced address, adding town and state only when the address lacks them', () => {
    expect(mapsPlace(st('Troegs', '200 East Hershey Park Drive, Hershey, PA 17033', { town: 'Hershey' }))).toBe('Troegs, 200 East Hershey Park Drive, Hershey, PA 17033');
    expect(mapsPlace(st('CR Brewing', '3009 Wilmington Rd #B', { town: 'New Castle' }))).toBe('CR Brewing, 3009 Wilmington Rd #B, New Castle, PA');
    expect(mapsPlace(st('Crooked Pecker', '8284 Washington St Chagrin Falls, Ohio 44023-4508', { town: 'Newbury', state: 'OH' }))).not.toContain('Newbury');
    expect(mapsPlace(st('Noble Beast', '1470 Lakeside Ave E Cleveland, OH', { town: 'Cleveland', state: 'OH' }))).toBe('Noble Beast, 1470 Lakeside Ave E Cleveland, OH');
  });
  it('a stop with no sourced address goes by name, town and state, never a directory street', () => {
    expect(mapsPlace(st('Pompatus'))).toBe('Pompatus, Alpha, PA');
    expect(mapsPlace({ ...st('Unsourced', '12 Directory St'), addressSourceUrl: '' })).toBe('Unsourced, Alpha, PA');
    const html = roadTripPage(view([ok(1, { address_as_printed: null, address_source_url: null })], CONFIG, [{ ...cand(1, -79.9, 0, 'Alpha'), street: '99 Directory Street' } as CandidateRow]));
    expect(html).not.toContain('Directory Street');
    expect(html).toContain('destination=Fixture%20Brewing%201%2C%20Alpha%2C%20PA"');
  });
  it('encodes apostrophes, ampersands, # and commas so the place survives the trip', () => {
    const href = directionsUrl(st("Bummin' Beaver & Sons #2", '11610 Washington St, Unit #B, Chagrin Falls, OH 44023'));
    expect(href.startsWith('https://www.google.com/maps/dir/?api=1&destination=')).toBe(true);
    expect(href).not.toMatch(/#| /);
    expect(href.split('&')).toHaveLength(2);                          // only api=1 and destination: the "&" in the name is encoded
    expect(params(href).get('destination')).toBe("Bummin' Beaver & Sons #2, 11610 Washington St, Unit #B, Chagrin Falls, OH 44023");
    expect(params(href).get('api')).toBe('1');
  });
  it('a stretch link runs origin, waypoints, destination in list order', () => {
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
  it('enforces Google\'s 2,048-character limit in code: long links are cut shorter or not made', () => {
    expect(MAPS_URL_LIMIT).toBe(2048);
    const long = (i: number) => st(`Brewery ${i} ${'& Sons '.repeat(40)}`);                 // about 570 characters once encoded
    const links = stretchLinks(Array.from({ length: 6 }, (_, i) => long(i)));
    expect(links.map((l) => [l.from, l.to])).toEqual([[1, 3], [4, 6]]);                     // five would be about 2,900 characters, so three per link
    for (const l of links) expect(l.href.length).toBeLessThanOrEqual(2048);
    const huge = st(`Huge ${'x&'.repeat(900)}`);
    expect(directionsUrl(huge)).toBe('');
    expect(stretchLinks([huge, st('B')])).toEqual([]);
    const out = roadTripPage(view([ok(1, { name: `Huge ${'x&'.repeat(900)}` }), ok(12)]));
    expect(out.match(/Directions \(opens Google Maps\)/g)).toHaveLength(1);                 // the over-long one is left out
    expect(out).not.toContain('Open this stretch');
    for (const m of out.matchAll(/href="(https:\/\/www\.google\.com\/maps\/[^"]+)"/g)) expect(m[1].replace(/&amp;/g, '&').length).toBeLessThanOrEqual(2048);
    for (const road of allRoads()) for (const leg of road.legs) for (const g of leg.segments) {
      for (const l of stretchLinks(g.stops)) expect(l.href.length).toBeLessThanOrEqual(2048);
      for (const s of g.stops) expect(directionsUrl(s)).not.toBe('');
    }
  });
  it('the page carries one Directions link per stop and stretch links only where a stretch has two or more stops', () => {
    const v = view(), html = roadTripPage(v);
    const links = [...html.matchAll(/<a href="(https:\/\/www\.google\.com\/maps\/dir\/[^"]+)" rel="noopener nofollow" target="_blank">([^<]+)<\/a>/g)];
    expect(links.filter((m) => m[2] === 'Directions (opens Google Maps)')).toHaveLength(v.stops.length);
    expect(links.filter((m) => m[2] === 'Open this stretch in Google Maps')).toHaveLength(2);
    expect((html.match(/google\.com\/maps/g) || []).length).toBe(links.length);  // every Google link has the rel, target and text
    expect(html).not.toMatch(/maps\.googleapis|maps\/embed|<iframe/);
    const one = roadTripPage(view([ok(1)]));
    expect(one).not.toContain('Open this stretch'); expect(one).toContain('Directions (opens Google Maps)');
  });
  it('escapes the link inside the attribute', () => {
    const html = roadTripPage(view([ok(1, { name: 'A "quoted" <b> & Co' }), ok(2, { name: "O'Brien & Sons" })]));
    const hrefs = [...html.matchAll(/href="(https:\/\/www\.google\.com\/maps\/dir\/[^"]*)"/g)].map((m) => m[1]);
    expect(hrefs).toHaveLength(2);                                   // two stops, in different stretches: no stretch link
    expect(hrefs[0]).toContain('&amp;destination=A%20%22quoted%22%20%3Cb%3E%20%26%20Co%2C');
    for (const x of hrefs) { expect(x).not.toMatch(/[<> ]/); expect(x.replace(/&amp;/g, '')).not.toContain('&'); }
    expect(new URL(hrefs[1].replace(/&amp;/g, '&')).searchParams.get('destination')).toBe("O'Brien & Sons, 2 Fixture St, Bravo, PA");
  });
});

describe('/roads index', () => {
  const a = view();
  const empty = viewRoad({ ...CONFIG, slug: 'not-ready', name: 'Not Ready Road' }, built([]).road, TODAY);
  const unpublished = view(undefined, { ...CONFIG, slug: 'held-back', name: 'Held Back Road', publish: false });
  const headline = view(undefined, { ...CONFIG, slug: 'headline-road', name: 'Headline Road', headline: true });
  it('lists only published roads with listed stops, the headline trip first', () => {
    const list = availableRoads([a, empty, unpublished, headline]);
    expect(list.map((r) => r.config.slug)).toEqual(['headline-road', 'fixture-road']);
    const html = roadsIndexPage(list), main = html.slice(html.indexOf('<h1'));
    for (const hidden of ['Not Ready Road', '/roads/not-ready', 'Held Back Road', '/roads/held-back']) expect(main).not.toContain(hidden);
    expect(main.indexOf('/roads/headline-road')).toBeLessThan(main.indexOf('/roads/fixture-road'));
    expect(main.match(/class="rt-card rt-headline"/g)).toHaveLength(1);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('<link rel="canonical" href="https://brewerytrip.com/roads"');
    expect(main).toContain(OSM_ATTRIBUTION);
    expect(main).toContain('Westend to Eastend: 52.9 miles of mapped line, 4 listed stops; a decision reached on 6 of 13 nearby directory breweries');
    expect(main).toContain('It is not a claim that every brewery near the road was reviewed.');
    expect(main).toContain('See the list for FR 1');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
    expect(blocks.find((b) => b['@type'] === 'ItemList' && b.url === 'https://brewerytrip.com/roads').itemListElement.map((x: { url: string }) => x.url)).toEqual(['https://brewerytrip.com/roads/headline-road', 'https://brewerytrip.com/roads/fixture-road']);
  });
  it('a listed stop\'s brewery page links to its road list; others do not', () => {
    const card = roadCallout(2, [a]);
    expect(card).toContain('href="/roads/fixture-road#stop-2"');
    expect(card).toContain('Its nearest point on our mapped line of FR 1 is mile 26.5 of the Westend to Eastend leg; it is 1.4 miles from that line, straight-line (not a driving distance). Its listing there is supported by published visiting hours read on 2026-11-22.');
    expect(card).not.toMatch(/open on \d{4}|confirmed open|was operating/i);
    expect(card).not.toMatch(/detour|driving order/i);
    expect(roadCallout(4, [a])).toBe(''); expect(roadStopFor(2, [empty])).toBeNull();
    // a brewery on two published roads gets a card for each
    const other = view(undefined, { ...CONFIG, slug: 'other-road', name: 'Other Road', shortName: 'OR 2' });
    const both = roadCallout(2, [a, other]);
    expect(both.match(/class="content-card"/g)).toHaveLength(2); expect(both).toContain('href="/roads/fixture-road#stop-2"'); expect(both).toContain('href="/roads/other-road#stop-2"');
  });
});

describe('the real road data (src/data/roads)', () => {
  it('every published stop passes the gate, has operating evidence, sits within the limit and is in line order', () => {
    for (const road of allRoads()) {
      expect(roadConfigProblems(road.config)).toEqual([]);
      for (const leg of road.legs) {
        expect(leg.lengthMiles).toBeGreaterThan(1); expect(leg.line.length).toBeGreaterThan(1);
        expect(leg.decided).toBeLessThanOrEqual(leg.candidates); expect(leg.stops.length).toBeLessThanOrEqual(leg.decided);
        leg.stops.forEach((s, i) => {
          expect(isShowableStop(s), s.name).toBe(true);
          expect(s.evidence.length, s.name).toBeGreaterThan(15); expect(s.evidenceUrl).toMatch(/^https?:\/\//); expect(s.evidenceChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(s.evidenceUrl).not.toMatch(/facebook|reddit|nextdoor/i);
          expect(s.detourMiles).toBeLessThanOrEqual(road.config.maxDetourMiles);
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
    expect(buildRoad(US_422, read('osm-ways.json'), read('candidates.json'), verified, US_422_BUILT.built, undefined, read('geocodes.json')).road).toEqual(US_422_BUILT);
    const evidenced = new Set(verified.filter((r) => r.status === 'OPEN' && r.operating_evidence?.excerpt && r.operating_evidence?.url).map((r) => r.id));
    for (const s of US_422_BUILT.stops) expect(evidenced.has(s.breweryId), s.name).toBe(true);
    for (const r of verified.filter((x) => x.status !== 'OPEN' || !x.operating_evidence)) expect(US_422_BUILT.stops.some((s) => s.breweryId === r.id), String(r.name)).toBe(false);
  });
  it('only pages a person read in a browser carry a browser check', () => {
    // 82 Crooked Pecker, 261 Pompatus and 1082 Hidden River are script-rendered sites read in a real browser on 2026-11-22.
    // Pompatus (261) prints no street address, so under the location-identity rule it cannot be placed and is not a stop.
    expect(US_422_BUILT.stops.filter((s) => s.browserChecked).map((s) => s.breweryId).sort((a, b) => a! - b!)).toEqual([82, 1082]);
    expect(US_422_BUILT.stops.some((s) => s.breweryId === 261)).toBe(false);
  });
});

describe('stops that stand alone (a road outside the directory)', () => {
  const alone: RoadConfig = { ...CONFIG, stopsHavePages: false, startingList: 'an outside dataset and our checkers’ finds' };
  const rows = [{ ...ok(1), id: 'alpha-ales-alpha' }, { ...ok(2), id: 'bravo-beer-bravo' }] as VerifiedRow[];
  const cands = [{ ...cand(1, -79.9, 0, 'Alpha'), id: 'alpha-ales-alpha' }, { ...cand(2, -79.5, 0.02, 'Bravo'), id: 'bravo-beer-bravo' }] as CandidateRow[];
  const v = view(rows, alone, cands), html = roadTripPage(v), main = html.slice(html.indexOf('<h1'));
  it('a stop needs a plain key, and its directory id is optional', () => {
    expect(v.stops.map((s) => [s.key, s.breweryId])).toEqual([['alpha-ales-alpha', undefined], ['bravo-beer-bravo', undefined]]);
    const s = v.stops[0];
    expect(isShowableStop(s, TODAY)).toBe(true);
    for (const bad of [{ key: '' }, { key: 'Has Space' }, { key: 'x"y' }, { key: undefined as unknown as string }, { breweryId: 0 }, { breweryId: 1.5 }]) expect(isShowableStop({ ...s, ...bad }, TODAY), JSON.stringify(bad)).toBe(false);
    expect(built().road.stops.map((x) => [x.key, x.breweryId])).toEqual([['12', 12], ['1', 1], ['2', 2], ['3', 3]]);   // directory roads are unchanged
  });
  it('the page gives no /brewery link, no medal or tap-list marker, and links the brewery\'s own site and directions', () => {
    expect(main).toContain('<li class="rt-stop" id="stop-alpha-ales-alpha">');
    expect(main).toContain('<h4>Fixture Brewing 1</h4>');
    expect(main).not.toContain('/brewery/'); expect(main).not.toContain('Brewery Trip page');
    expect(main).toContain('Its own site'); expect(main.match(/Directions \(opens Google Maps\)/g)).toHaveLength(2);
    expect(roadTripPage(v, { tapLists: new Map([[1, new Date().toISOString()]]) })).not.toContain('Tap list, updated');
    const trip = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1])).find((b) => b['@type'] === 'TouristTrip');
    expect(trip.itinerary.itemListElement[0].item.url).toBe('https://example.com/1');
    expect(roadCallout(1, [v])).toBe(''); expect(roadStopFor(1, [v])).toBeNull();
  });
  it('says where the starting list came from instead of "our directory"', () => {
    expect(roadSummary(v)).toBe('2 breweries within 5 straight-line miles of our mapped line of FR 1, ordered by their nearest point along it; these are not driving distances. Each listing is supported by published visiting hours read on the date shown.');
    expect(main).toContain('We started from 2 breweries within 5 straight-line miles of our mapped line of FR 1, or in a place where that line is missing, drawn from an outside dataset and our checkers’ finds. We reached a decision on all 2');
    expect(main).not.toContain('our directory'); expect(main).not.toContain('Our directory');
  });
});

describe('reading the checkers\' files', () => {
  const dataset = [
    { id: 'aaa', name: 'Old Name Ales', city: 'Alpha', state: 'Illinois', address_1: '10 Main St', latitude: 40, longitude: -79.9 },
    { id: 'bbb', name: 'Moved Brewing', city: 'Bravo', state: 'Illinois', address_1: '20 Old Rd', latitude: 40, longitude: -79.5 },
    { id: 'ccc', name: 'Closed Co', city: 'Charlie', state: 'Illinois', address_1: '30 Oak Ave', latitude: 40, longitude: -79.1 },
    { id: 'ddd', name: 'Second Signal Brewing', city: 'Delta', state: 'Illinois', address_1: '40 Elm St', latitude: 40, longitude: -79.3 },
    { id: 'eee', name: 'Twin Taproom', city: 'Echo', state: 'Illinois', address_1: '50 Pine St', latitude: 40, longitude: -79.6 },
    { id: 'fff', name: 'Moved Nowhere', city: 'Foxtrot', state: 'Illinois', address_1: '60 First St', latitude: 40, longitude: -79.7 },
    { id: 'ggg', name: 'Quietly Moved', city: 'Alpha', state: 'Illinois', address_1: '70 Birch St', latitude: 40, longitude: -79.85 },
  ];
  const ev = (n: string) => ({ excerpt: `Hours ${n} Monday 12pm - 9pm`, url: `https://example.com/${n}`, checked: TODAY });
  const site = (n: string, address: string) => ({ official_url: `https://example.com/${n}`, address_as_printed: address, address_source_url: `https://example.com/${n}/visit` });
  const verifiedRows = [
    { obdb_id: 'aaa', name: 'Old Name Ales', city: 'Alpha', state: 'Illinois', status: 'OPEN', ...site('a', '10 Main Street, Alpha, IL 60000'), operating_evidence: ev('a') },
    { obdb_id: 'bbb', name: 'Moved Brewing', city: 'Bravo', state: 'IL', status: 'MOVED', ...site('b', '25 New Road, Hotel, IL 60000'), operating_evidence: ev('b'), new_coordinates: { lat: 40.01, lon: -79.45, coordinates_source: 'US Census geocoder' } },
    { obdb_id: 'ccc', name: 'Closed Co', city: 'Charlie', state: 'IL', status: 'CLOSED', operating_evidence: null },
    { obdb_id: 'ddd', name: 'Second Signal Brewing', city: 'Delta', state: 'IL', status: 'OPEN', ...site('d', '40 Elm St, Delta, IL'), operating_evidence: ev('d') },
    { obdb_id: 'eee', name: 'Twin Taproom', city: 'Echo', state: 'IL', status: 'RENAMED', ...site('e', '50 Pine St, Echo, IL'), operating_evidence: ev('e') },
    { obdb_id: 'fff', name: 'Moved Nowhere', city: 'Foxtrot', state: 'IL', status: 'MOVED', ...site('f', '99 Somewhere Else Ave, Foxtrot, IL'), operating_evidence: ev('f') },
    // The checker called it OPEN, but it prints a different street from the dataset's and no Census coordinates were recorded.
    { obdb_id: 'ggg', name: 'Quietly Moved', city: 'Alpha', state: 'IL', status: 'OPEN', ...site('q', '214 West Commercial Street, Lebanon, Illinois 60000'), operating_evidence: ev('q') },
  ];
  const leadRows = [
    { name: 'Array Coordinates', city: 'Golf', state: 'IL', ...site('g', '1 Golf St, Golf, IL'), operating_evidence: ev('g'), coordinates: [40, -79.2] },
    { name: 'Object Coordinates', city: 'Hotel', state: 'Illinois', ...site('h', '2 Hotel St, Hotel, IL'), operating_evidence: ev('h'), coordinates: { lat: 40, lon: -79.25 } },
    { name: 'Flat Coordinates', city: 'India', state: 'IL', ...site('i', '3 India St, India, IL'), operating_evidence: ev('i'), lat: 40, lon: -79.35 },
    { name: 'No Coordinates', city: 'Juliet', state: 'IL', ...site('j', '4 Juliet St, Juliet, IL'), operating_evidence: ev('j'), lat: null, lon: null, coordinates_note: 'geocoder returned no match' },
    { name: 'No Evidence', city: 'Kilo', state: 'IL', operating_evidence: null, coordinates: [40, -79.15] },
    { name: 'Twin Taproom', city: 'Echo', state: 'IL', ...site('e2', '50 Pine St, Echo, IL'), operating_evidence: ev('e2'), coordinates: [40, -79.61] },
    { name: 'Pub Not Brewery', city: 'Lima', state: 'IL', ...site('l', '5 Lima St, Lima, IL'), operating_evidence: ev('l'), coordinates: [40, -79.05] },
    { name: 'No Address Ales', city: 'Golf', state: 'IL', official_url: 'https://example.com/n', operating_evidence: ev('n'), coordinates: [40, -79.22] },
    { name: 'No Site Ales', city: 'Golf', state: 'IL', address_as_printed: '6 Golf St, Golf, IL', address_source_url: 'https://example.org/listing', operating_evidence: ev('s'), coordinates: [40, -79.23] },
  ];
  const decisions = [{ match: 'ddd', status: 'UNCONFIRMED', reason: 'second same-day check conflicted' }, { match: 'lead:Pub Not Brewery', status: 'NOT A BREWERY TAPROOM', reason: 'editor: does not brew' }, { match: 'aaa', evidenceKind: 'notice' as const, noticeContext: 'The notice prints the date 11/24/26 and names the taproom.', reason: 'the evidence is a dated event' },
    { match: 'lead:Flat Coordinates', reason: 'editor re-read the hours', evidence: { excerpt: 'Hours Tuesday 3pm - 9pm', url: 'https://example.com/i/hours', checked: TODAY } }];
  const got = normaliseCheckerFiles(dataset, verifiedRows, leadRows, decisions);
  const row = (key: string) => got.verified.find((r) => r.id === key)!, at = (key: string) => got.candidates.find((c) => c.id === key);
  it('reads every coordinate shape the checkers used', () => {
    expect(readCoordinates([40, -79])).toEqual({ lat: 40, lon: -79 }); expect(readCoordinates({ lat: 40, lon: -79, coordinates_source: 'x' })).toEqual({ lat: 40, lon: -79 });
    expect(readCoordinates({ address: 'x', lat: 35.2, lon: -112.1, miles_from_66: 0.1 })).toEqual({ lat: 35.2, lon: -112.1 });
    for (const bad of [null, undefined, [40], ['40', '-79'], { lat: null, lon: null }, { lat: 0, lon: 0 }, { lat: 95, lon: 10 }, 'x', 7]) expect(readCoordinates(bad), JSON.stringify(bad)).toBeNull();
    expect([at('array-coordinates-golf'), at('object-coordinates-hotel'), at('flat-coordinates-india')].map((c) => [c!.latitude, c!.longitude])).toEqual([[40, -79.2], [40, -79.25], [40, -79.35]]);
  });
  it('makes plain keys and two-letter states', () => {
    expect(stopKey("Bummin' Beaver & Sons #2", 'Auburn Twp.')).toBe('bummin-beaver-and-sons-2-auburn-twp');
    expect(stopKey('Hofbräuhaus', 'St. Louis')).toBe('hofbrauhaus-st-louis');
    expect(stateAbbr('New Mexico')).toBe('NM'); expect(stateAbbr('mo')).toBe('MO'); expect(stateAbbr('Illinois')).toBe('IL');
    expect(got.candidates.every((c) => c.state === 'IL')).toBe(true);
    expect(new Set(got.verified.map((r) => r.id)).size).toBe(got.verified.length);
  });
  it('a row with no coordinates cannot be placed, is reported, and never becomes a stop', () => {
    expect(got.unplaced.map((u) => u.key)).toEqual(['moved-nowhere-foxtrot', 'quietly-moved-alpha', 'no-coordinates-juliet']);
    expect(got.unplaced[0].why).toMatch(/not a full match for the dataset's/); expect(got.unplaced[2].why).toBe('geocoder returned no match');
    for (const k of ['no-coordinates-juliet', 'moved-nowhere-foxtrot', 'quietly-moved-alpha']) expect(at(k), k).toBeUndefined();
    const b = buildRoad({ ...CONFIG, stopsHavePages: false }, WAYS, got.candidates, got.verified, TODAY, TODAY);
    expect(b.road.stops.some((s) => /no-coordinates|moved-nowhere|quietly-moved/.test(s.key))).toBe(false);
    expect(b.report.left.find((x) => x.id === 'no-coordinates-juliet')!.reason).toMatch(/no coordinates/);
  });
  it('dataset coordinates are used only when the printed address is the dataset\'s; the status word does not decide it', () => {
    // the street line must match in full: number, direction, every word of the name, suffix
    expect(sameStreet('100 N Main St', '100 S Main Ave')).toBe(false);                       // direction and suffix differ
    expect(sameStreet('100 Martin Luther King Blvd', '100 Martin Way')).toBe(false);          // a different street that starts alike
    expect(sameStreet('100 N Main St', '100 N Main Ave')).toBe(false); expect(sameStreet('100 N Main St', '100 S Main St')).toBe(false);
    expect(sameStreet('100 Main St', '100 Main')).toBe(false); expect(sameStreet('12 Main St', '14 Main St')).toBe(false); expect(sameStreet('Main Street', 'Main St')).toBe(false);
    expect(sameStreet('100 North Main Street', '100 N. Main St')).toBe(true); expect(sameStreet('1927 W. North Ave.', '1927 W North Ave')).toBe(true);
    expect(sameStreet('8920 Vernon Avenue Suite 122', '8920 Vernon Ave Ste 122')).toBe(true); expect(sameStreet('720 E Arrow Hwy Unit C', '720 E Arrow Hwy Ste C')).toBe(true);
    expect(sameStreet('908 S.W. 4th Street', '908 SW 4th St')).toBe(true); expect(sameStreet('16 East Route 66', '16 E Route 66')).toBe(true);
    expect(sameStreet('2896 Metropolitan Place', '2896 Metropolitan Pl')).toBe(true); expect(sameStreet('300 Sunset Boulevard', '300 Sunset Blvd')).toBe(true);
    // and the town and state must be the dataset's
    const il = (address_1: string, city = 'Alpha') => ({ address_1, city, state: 'Illinois' });
    expect(sameLocation('10 Main Street, Alpha, IL 60000', il('10 Main St'))).toBe(true);
    expect(sameLocation('235 N Ashland Ave - Chicago, IL 60607', il('235 N Ashland Ave', 'Chicago'))).toBe(true);
    expect(sameLocation('Lemont 431 Talcott Avenue Lemont, IL 60439', il('431 Talcott Ave', 'Lemont'))).toBe(true);
    expect(sameLocation('1912 2nd St. NW 87102 Albuquerque', { address_1: '1912 2nd Street NW', city: 'Albuquerque', state: 'New Mexico' })).toBe(true);
    expect(sameLocation('908 S.W. 4th Street OKC, OK', { address_1: '908 SW 4th St', city: 'Oklahoma City', state: 'Oklahoma' })).toBe(true);
    expect(sameLocation('10 Main Street, Bravo, IL 60000', il('10 Main St'))).toBe(false);          // same street line, another town
    expect(sameLocation('10 Main Street, Alpha, MO 60000', il('10 Main St'))).toBe(false);          // another state
    expect(sameLocation('10 Main Street', il('10 Main St'))).toBe(false);                           // names no town: cannot be told apart
    expect(sameLocation('100 N Main St, Alpha, IL', il('100 S Main Ave'))).toBe(false);
    expect(sameLocation('100 Martin Luther King Blvd, Alpha, IL', il('100 Martin Way'))).toBe(false);
    expect(sameLocation('3313 Girard NE Albuquerque, NM 87107', { address_1: '3313 Girard Blvd NE', city: 'Albuquerque', state: 'New Mexico' })).toBe(false);   // suffix left off
    expect(sameLocation('1717 East 7th Street, Tulsa, OK', { address_1: '1717 E. 7th Steeet', city: 'Tulsa', state: 'Oklahoma' })).toBe(false);            // dataset misspelt
    expect(sameLocation('2840 w armitage ave. logan square chicago, il', il('2840 W Armitage Ave', 'Chicago'))).toBe(false);                               // extra words in the line
    expect(sameLocation('214 West Commercial Street, Lebanon, Missouri 65536', { address_1: '110 Sherman Ave', city: 'Phillipsburg', state: 'Missouri' })).toBe(false);
    expect(sameLocation(null, il('10 Main St'))).toBe(false); expect(sameLocation('10 Main St, Alpha, IL', null)).toBe(false);
    expect([at('old-name-ales-alpha')!.latitude, at('old-name-ales-alpha')!.longitude]).toEqual([40, -79.9]);      // same street: the dataset's point
    expect(at('quietly-moved-alpha')).toBeUndefined();                                                              // OPEN, but a different street and no Census point
    expect([at('closed-co-charlie')!.latitude]).toEqual([40]);                                                      // not listed anyway: kept for the coverage count
    expect([at('moved-brewing-bravo')!.latitude, at('moved-brewing-bravo')!.longitude]).toEqual([40.01, -79.45]);
    expect(row('moved-brewing-bravo').status).toBe('OPEN'); expect(row('closed-co-charlie').status).toBe('CLOSED');
  });
  it('applies the rulings kept apart from the checkers\' files, and says when one matches nothing', () => {
    expect(row('second-signal-brewing-delta')).toMatchObject({ status: 'UNCONFIRMED' }); expect(row('second-signal-brewing-delta').notes).toContain('second same-day check conflicted');
    expect(row('pub-not-brewery-lima').status).toBe('NOT A BREWERY TAPROOM');
    expect(row('old-name-ales-alpha')).toMatchObject({ status: 'OPEN', evidence_kind: 'notice' });
    expect(got.unmatchedDecisions).toEqual([]);
    expect(normaliseCheckerFiles(dataset, verifiedRows, leadRows, [{ match: 'zzz', status: 'CLOSED', reason: 'x' }]).unmatchedDecisions).toEqual(['zzz']);
    const b = buildRoad({ ...CONFIG, stopsHavePages: false }, WAYS, got.candidates, got.verified, TODAY, TODAY);
    expect(b.road.stops.map((s) => s.key)).not.toContain('second-signal-brewing-delta'); expect(b.road.stops.map((s) => s.key)).not.toContain('pub-not-brewery-lima');
    expect(b.road.stops.map((s) => s.key)).not.toContain('no-evidence-kilo');
    expect(b.road.stops.find((s) => s.key === 'old-name-ales-alpha')).toMatchObject({ evidenceKind: 'notice', noticeContext: 'The notice prints the date 11/24/26 and names the taproom.' });
    expect(b.road.stops.find((s) => s.key === 'flat-coordinates-india')!.evidence).toBe('Hours Tuesday 3pm - 9pm');   // evidence an editor re-read replaces the checker's
  });
  it('a lead and a dataset row for the same place are listed once', () => {
    expect(row('twin-taproom-echo').status).toBe('DUPLICATE'); expect(row('twin-taproom-echo-2').status).toBe('OPEN');
    const keys = buildRoad({ ...CONFIG, stopsHavePages: false }, WAYS, got.candidates, got.verified, TODAY, TODAY).road.stops.map((s) => s.key);
    expect(keys.filter((k) => k.startsWith('twin-taproom'))).toEqual(['twin-taproom-echo-2']);
  });
  it('a correction replaces an excerpt with what the page prints; a null one removes it, and null evidence takes the row off', () => {
    const fixed = normaliseCheckerFiles(dataset, verifiedRows, leadRows, decisions, [
      { key: 'old-name-ales-alpha', field: 'evidence', value: 'Monday 12pm - 9pm', url: 'https://example.com/a/visit', reason: 're-read' },
      { key: 'array-coordinates-golf', field: 'evidence', value: null, reason: 'not found' },
      { key: 'object-coordinates-hotel', field: 'address', value: null, reason: 'not found' },
      { key: 'no-such-row', field: 'quote', value: null, reason: 'x' },
    ]);
    const r = (k: string) => fixed.verified.find((x) => x.id === k)!;
    expect(r('old-name-ales-alpha').operating_evidence).toEqual({ excerpt: 'Monday 12pm - 9pm', url: 'https://example.com/a/visit', checked: TODAY });
    expect(r('array-coordinates-golf').operating_evidence).toBeNull(); expect(r('object-coordinates-hotel').address_as_printed).toBeNull();
    expect(fixed.unmatchedDecisions).toEqual(['correction:no-such-row']);
    const keys = buildRoad({ ...CONFIG, stopsHavePages: false }, WAYS, fixed.candidates, fixed.verified, TODAY, TODAY).road.stops.map((x) => x.key);
    expect(keys).toContain('old-name-ales-alpha'); expect(keys).not.toContain('array-coordinates-golf');
  });
  it('asPrinted only ever returns text copied from the page', () => {
    const page = pageText('<p>Visit us at 111 Harvard Dr SE Albuquerque, NM&nbsp;87106 <a>Get Directions</a></p><p>Hours Mon, Tue 2:00 PM - 10:00 PM | Fri, Sat 11:00 AM - 11:00 PM</p><p>Est. 2015 ◆ Brewed on site</p>');
    expect(asPrinted('111 Harvard Dr SE, Albuquerque, NM 87106', page)).toBe('111 Harvard Dr SE Albuquerque, NM 87106');                 // the checker added a comma
    expect(asPrinted('Est. 2015 Brewed on site', page)).toBe('Est. 2015 ◆ Brewed on site');
    expect(asPrinted('111 Harvard Dr SE Albuquerque, NM 87106 Hours Mon, Tue 2:00 PM - 10:00 PM', page, true)).toBe('Hours Mon, Tue 2:00 PM - 10:00 PM'); // a link sat between them
    expect(asPrinted('111 Harvard Dr SE, Albuquerque, New Mexico 87106', page, false, true)).toBe('111 Harvard Dr SE Albuquerque');       // as far as the page agrees
    expect(asPrinted('Open every day from noon', page, true)).toBeNull(); expect(asPrinted('A slogan that is not there', page)).toBeNull();
    expect(asPrinted('99 Other St, Elsewhere', page, false, true)).toBeNull();
    for (const got of [asPrinted('Hours Mon, Tue 2:00 PM - 10:00 PM Fri, Sat 11:00 AM - 11:00 PM', page, true)!]) expect(page).toContain(got);
  });
  it('a dated notice is headed as a notice, not as hours', () => {
    const v = viewRoad({ ...CONFIG, stopsHavePages: false }, buildRoad({ ...CONFIG, stopsHavePages: false }, WAYS, got.candidates, got.verified, TODAY, TODAY).road, TODAY), html = roadTripPage(v);
    expect(html).toContain(`<strong>Operating evidence: event notice read on ${TODAY}</strong>`); expect(html).toContain(`<strong>Operating evidence: hours read on ${TODAY}</strong>`);
    expect(html).toContain('Event notice; regular visiting hours not established here. The notice prints the date 11/24/26 and names the taproom.');
    expect(roadSummary(v)).toContain('Each listing is supported by published visiting hours or a dated operating notice read on the date shown.');
    expect(roadsBlurb([v])).toContain('published visiting hours or a dated operating notice'); expect(roadsIndexPage([v])).toContain('published visiting hours or a dated operating notice');
    // a notice with nothing to establish its year and venue is not shown
    const bare = normaliseCheckerFiles(dataset, verifiedRows, leadRows, [{ match: 'aaa', evidenceKind: 'notice', reason: 'no context recorded' }]);
    expect(buildRoad({ ...CONFIG, stopsHavePages: false }, WAYS, bare.candidates, bare.verified, TODAY, TODAY).road.stops.map((x) => x.key)).not.toContain('old-name-ales-alpha');
  });
  it('the town shown is the one the printed address names', () => {
    const known = ['Phillipsburg', 'Rancho Cucamonga', 'Upland', 'Los Angeles', 'Albuquerque', 'Los Ranchos de Albuquerque', 'Saint Louis', 'St. Louis', 'Oklahoma City'];
    expect(townInAddress('214 West Commercial Street, Lebanon, Missouri 65536', known, 'Phillipsburg')).toBe('Lebanon');
    expect(townInAddress('296 N. 2ND AVE. UPLAND CA 91786', known, 'Rancho Cucamonga')).toBe('Upland');
    expect(townInAddress('7 South 1st Street Alhambra, CA 91801', known, 'Los Angeles')).toBe('Alhambra');
    expect(townInAddress('8305 2nd St. NW Los Ranchos de Albuquerque, NM 87114', known, 'Los Ranchos de Albuquerque')).toBe('Los Ranchos de Albuquerque');
    expect(townInAddress('1220 S. 8th Street St. Louis, MO', known, 'St. Louis')).toBe('St. Louis');
    expect(townInAddress('7 N Lee Avenue OKC, OK 73102', known, 'Oklahoma City')).toBe('Oklahoma City');
    expect(townInAddress('704 W Reno Ave', known, 'Oklahoma City')).toBeNull(); expect(townInAddress(null, known, 'X')).toBeNull();
    // a town's name in the STREET is not the address's town: only the locality before the state counts
    expect(townInAddress('100 Lebanon Road, Springfield, MO 65801', ['Lebanon', 'Springfield'], 'Lebanon')).toBe('Springfield');
    expect(townInAddress('100 Lebanon Road, Springfield, MO 65801', ['Lebanon'], 'Lebanon')).toBe('Springfield');          // even when Springfield is not a town we know
    expect(townInAddress('100 Lebanon Road Springfield MO 65801', ['Lebanon'], 'Lebanon')).toBe('Springfield');
    expect(townInAddress('500 Upland Avenue, Rancho Cucamonga, CA 91730', known, 'Upland')).toBe('Rancho Cucamonga');
    expect(townInAddress('12 Springfield Street, Lebanon, MO', ['Springfield'], 'Lebanon')).toBe('Lebanon');
    expect(townInAddress('828 Traction Ave · Arts District, Downtown LA', known, 'Los Angeles', 'California')).toBe('Los Angeles');  // LA is the city here, not Louisiana
    expect(townInAddress('1519 N. Main Street, Suite 102 Flagstaff, AZ 86004', [], 'Flagstaff')).toBe('Flagstaff');
    expect(got.candidates.find((c) => c.id === 'moved-brewing-bravo')!.city).toBe('Hotel');                    // its row said Bravo, its address says Hotel
    expect(got.retowned).toContainEqual({ key: 'moved-brewing-bravo', name: 'Moved Brewing', from: 'Bravo', to: 'Hotel' });
  });
  it('a stand-alone stop needs a sourced street address and a link to its own site', () => {
    const keys = buildRoad({ ...CONFIG, stopsHavePages: false }, WAYS, got.candidates, got.verified, TODAY, TODAY);
    expect(keys.road.stops.map((x) => x.key)).not.toContain('no-address-ales-golf'); expect(keys.road.stops.map((x) => x.key)).not.toContain('no-site-ales-golf');
    expect(keys.report.left.find((x) => x.id === 'no-address-ales-golf')!.reason).toMatch(/sourced street address/);
    expect(keys.report.left.find((x) => x.id === 'no-site-ales-golf')!.reason).toMatch(/own site/);
  });
});

describe('state legs, a side leg, a tighter limit and a hole in the line', () => {
  // The straight fixture road, cut into two "states", plus a loop north from mile 15.9 (-79.7) that comes back at -79.4.
  const LOOP: LatLon[] = [[LAT, -79.7], [LAT + 0.1, -79.65], [LAT + 0.15, -79.55], [LAT + 0.1, -79.45], [LAT, -79.4]];
  const ways = [...WAYS, LOOP];
  const cfg: RoadConfig = {
    ...CONFIG, stopsHavePages: false, distanceTo: 'any-way', startingList: 'a test list',
    legs: [
      { id: 'east-state', name: 'Eastland', from: 'Westend', to: 'the Midland line', start: START, end: [LAT, -79.55], notes: [{ text: 'A note about this state.', sources: [{ quote: 'quoted words', url: 'https://example.com/law', checked: TODAY }] }],
        unmeasured: [{ id: 'hole-city', name: 'In Hole City', note: 'The line is missing in Hole City.', box: [40.3, -80.0, 40.5, -79.6] }],
        segments: [{ id: 'dense', toMile: 12, maxDetourMiles: 1, furtherOffMiles: 5 }, { id: 'rest', toMile: null, notes: [{ text: 'A note about this stretch.' }] }] },
      { id: 'mid-state', name: 'Midland', from: 'the Eastland line', to: 'Eastend', start: [LAT, -79.55], end: END, segments: [{ id: 'all', toMile: null }] },
      { id: 'loop', name: 'Eastland: the old loop', side: true, from: 'Loop Junction', to: 'Loop End', start: [LAT, -79.7], via: [[LAT + 0.15, -79.55]], end: [LAT, -79.4], segments: [{ id: 'all', toMile: null }] },
    ],
  };
  const c = (id: string, lon: number, latOff: number, city: string): CandidateRow => ({ id, name: id, city, state: 'PA', latitude: LAT + latOff, longitude: lon });
  const cands = [c('near-dense', -79.95, 0.005, 'Alpha'), c('far-dense', -79.9, 0.04, 'Alpha'), c('too-far-dense', -79.9, 0.09, 'Alpha'), c('on-loop', -79.55, 0.149, 'Loopville'), c('mid-one', -79.2, 0, 'Midtown'), c('in-hole', -79.8, 0.4, 'Hole City'), c('far-anywhere', -79.2, 0.4, 'Nowhere'), c('rest-one', -79.75, 0.01, 'Restville')];
  const rows = cands.map((x) => ({ ...ok(1), id: x.id, name: `Brewery ${x.id}` })) as VerifiedRow[];
  const b = buildRoad(cfg, ways, cands, rows, TODAY, TODAY), v = viewRoad(cfg, b.road, TODAY), html = roadTripPage(v), main = html.slice(html.indexOf('<h1'));
  const stop = (k: string) => b.road.stops.find((s) => s.key === k)!;
  it('each leg is measured from its own start, and legs are listed in order', () => {
    expect(b.road.legs.map((l) => [l.id, l.lengthMiles])).toEqual([['east-state', 23.8], ['mid-state', 29.1], ['loop', expect.any(Number)]]);
    expect(stop('mid-one').legId).toBe('mid-state'); expect(stop('mid-one').mile).toBeCloseTo(0.35 * DEG_LON, 1);
    expect(v.legs.map((l) => [l.name, l.side, l.stops.length])).toEqual([['Eastland', false, 3], ['Midland', false, 1], ['Eastland: the old loop', true, 1]]);
    expect([...main.matchAll(/<h2 id="leg-[a-z-]+-h">([^<]+)<\/h2>/g)].map((m) => m[1])).toEqual(['Eastland: Westend to the Midland line', 'Midland: the Eastland line to Eastend', 'Eastland: the old loop: Loop Junction to Loop End']);
    expect(main).toMatch(/<b>52\.9<\/b>miles of measuring line in 2 legs, plus 1 side leg/);
  });
  it('the side leg follows its via point and takes the stops nearest to it', () => {
    const loop = b.road.legs.find((l) => l.id === 'loop')!;
    expect(loop.lengthMiles).toBeGreaterThan(0.3 * DEG_LON);          // longer than the straight road between its ends
    expect(loop.line.some((p) => p[0] > LAT + 0.14)).toBe(true);
    expect(stop('on-loop')).toMatchObject({ legId: 'loop' }); expect(stop('on-loop').detourMiles).toBeLessThan(0.2);
    expect(main).toContain('Side leg · Loop Junction to Loop End');
  });
  it('with distance to any way, a brewery on another alignment is near, though its mile is on the chosen line', () => {
    expect(distanceToWays([LAT + 0.149, -79.55], ways)).toBeLessThan(0.2);
    const lineOnly = buildRoad({ ...cfg, distanceTo: 'line', legs: cfg.legs.slice(0, 2) }, ways, cands, rows, TODAY, TODAY).road.stops.map((s) => s.key);
    expect(lineOnly).not.toContain('on-loop');                         // 10.3 miles from the straight line alone
    const anyWay = buildRoad({ ...cfg, legs: cfg.legs.slice(0, 2) }, ways, cands, rows, TODAY, TODAY).road.stops.find((s) => s.key === 'on-loop')!;
    expect(anyWay.detourMiles).toBeLessThan(0.2); expect(anyWay.mile).toBeGreaterThan(0);
  });
  it('a tighter limit on a dense stretch keeps the further ones, shown apart; beyond the outer limit they are dropped', () => {
    expect(stop('near-dense').outer).toBeUndefined(); expect(stop('far-dense').outer).toBe(true);
    expect(b.road.stops.some((s) => s.key === 'too-far-dense')).toBe(false);
    expect(b.report.left.find((x) => x.id === 'too-far-dense')!.reason).toMatch(/over the limit/);
    const dense = v.legs[0].segments[0];
    expect([dense.stops.map((s) => s.key), dense.outer.map((s) => s.key), dense.limitMiles, dense.furtherOffMiles]).toEqual([['near-dense'], ['far-dense'], 1, 5]);
    expect(main).toContain('the main list here is within 1 straight-line miles of the nearest mapped alignment');
    expect(main).toContain('<h4 class="rt-outer">A little further off (1 to 5 straight-line miles from the nearest mapped alignment)</h4>');
    expect(main.indexOf('id="stop-near-dense"')).toBeLessThan(main.indexOf('rt-outer')); expect(main.indexOf('rt-outer')).toBeLessThan(main.indexOf('id="stop-far-dense"'));
    const noOuter = buildRoad({ ...cfg, legs: [{ ...cfg.legs[0], segments: [{ id: 'dense', toMile: 12, maxDetourMiles: 1 }, { id: 'rest', toMile: null }] }, ...cfg.legs.slice(1)] }, ways, cands, rows, TODAY, TODAY).road.stops.map((s) => s.key);
    expect(noOuter).not.toContain('far-dense'); expect(noOuter).toContain('near-dense');
  });
  it('where the line is missing, a brewery is listed with no mile and no distance, under the reason', () => {
    expect(stop('in-hole').unmeasured).toBe('hole-city'); expect(b.road.stops.some((s) => s.key === 'far-anywhere')).toBe(false);
    expect(v.legs[0].unmeasured.map((u) => [u.name, u.stops.map((s) => s.key)])).toEqual([['In Hole City', ['in-hole']]]);
    expect(v.legs[0].stops.some((s) => s.key === 'in-hole')).toBe(false);   // not in the measured list, so not in gaps or totals of the line
    const li = main.slice(main.indexOf('id="stop-in-hole"'), main.indexOf('</li>', main.indexOf('id="stop-in-hole"')));
    expect(li).toContain('<span>no mile</span>'); expect(li).not.toMatch(/mile \d|from the mapped road|nearest point/);
    expect(main).toContain('The line is missing in Hole City.');
    expect(roadSummary(v)).toContain('5 listed breweries within 5 straight-line miles of an alignment in our downloaded FR 1 mapping; these are not driving distances. Their mile positions are measured separately, on the one line we measure along for each leg.');
    expect(roadSummary(v)).toContain('1 more is listed without a distance where the mapping is missing (Hole City).');
    expect(v.stops).toHaveLength(6);
  });
  it('shows leg and stretch notes with their quoted sources, and one jump link per named leg', () => {
    expect(main).toContain('<p>A note about this state.</p>'); expect(main).toContain('“quoted words”'); expect(main).toContain('href="https://example.com/law"');
    expect(main).toContain('<p>A note about this stretch.</p>');
    expect([...main.matchAll(/<li><a href="#leg-([a-z-]+)">([^<]+)<\/a><\/li>/g)].map((m) => m[2])).toEqual(['Eastland (4)', 'Midland (1)', 'Eastland: the old loop (1)']);
    const levels = [...main.slice(0, main.indexOf('id="how"')).matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  });
});

describe('Route 66 (src/data/roads/route-66)', () => {
  const road = allRoads().find((r) => r.config.slug === 'route-66')!;
  const dir = join(__dirname, '../../data/roads/route-66');
  const read = (f: string) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const files = readdirSync(dir).sort();
  const ingest = () => normaliseCheckerFiles(read('candidates.json'), files.filter((f) => /^verified_/.test(f)).flatMap(read), files.filter((f) => /^leads_/.test(f)).flatMap(read), read('decisions.json'), read('corrections.json'));
  it('is the headline road, with eight state legs westbound and the Santa Fe side leg', () => {
    expect(availableRoads()[0].config.slug).toBe(road.config.publish ? 'route-66' : 'us-422');
    expect(road.config.headline).toBe(true); expect(roadConfigProblems(road.config)).toEqual([]);
    expect(road.legs.filter((l) => !l.side).map((l) => l.name)).toEqual(['Illinois', 'Missouri', 'Kansas', 'Oklahoma', 'Texas', 'New Mexico', 'Arizona', 'California']);
    expect(road.legs.filter((l) => l.side).map((l) => l.id)).toEqual(['santa-fe-loop']);
    expect(road.legs.findIndex((l) => l.id === 'santa-fe-loop')).toBe(road.legs.findIndex((l) => l.id === 'new-mexico') + 1);
    for (const l of road.legs) expect(l.lengthMiles, l.id).toBeGreaterThan(10);
  });
  it('Kansas has no stop and Texas has only Amarillo, and the page says so', () => {
    const ks = road.legs.find((l) => l.id === 'kansas')!, tx = road.legs.find((l) => l.id === 'texas')!;
    expect(ks.stops).toEqual([]); expect(Math.round(ks.lengthMiles)).toBe(12);
    expect(new Set(tx.stops.map((s) => s.town))).toEqual(new Set(['Amarillo']));
    const html = roadTripPage(road);
    expect(html).toContain('Nothing is listed on this leg.'); expect(html).toContain('Amarillo is the only place with anything on this list.');
    expect(html).toContain('That is what our list holds, not proof that there is none.');
  });
  it('Santa Fe breweries are on the side leg, and every stop stands alone', () => {
    const santaFe = road.stops.filter((s) => s.town === 'Santa Fe');
    expect(santaFe.length).toBeGreaterThan(2); expect(new Set(santaFe.map((s) => s.legId))).toEqual(new Set(['santa-fe-loop']));
    for (const s of road.stops) { expect(s.breweryId, s.name).toBeUndefined(); expect(s.key).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/); expect(isShowableStop(s), s.name).toBe(true); }
    expect(new Set(road.stops.map((s) => s.key)).size).toBe(road.stops.length);
    expect(roadTripPage(road)).not.toContain('href="/brewery/');
  });
  it('leaves off the five rows a second same-day check conflicted with, and the editor\'s other rulings', () => {
    const names = road.stops.map((s) => s.name).join(' | ');
    for (const off of ['Battered Boar', 'Legends Craft', 'No Clue', 'Congregation', 'Marble Brewery - NE Heights', 'Flix', 'Molson', 'DESTIHL Restaurant', 'Bricktown', 'Six Car', 'Piney River']) expect(names, off).not.toContain(off);
    const second = (read('decisions.json') as { match: string; status?: string; reason: string }[]).filter((d) => d.reason === 'second same-day check conflicted');
    expect(second).toHaveLength(5); expect(second.every((d) => d.status === 'UNCONFIRMED')).toBe(true);
    expect(ingest().unmatchedDecisions).toEqual([]);
    const html = roadTripPage(road) + roadsIndexPage([road]);
    expect(html).not.toMatch(/second same-day|Google Maps status|not found operating/i);   // internal only
  });
  it('rows with no coordinates stay off and are counted', () => {
    const got = ingest();
    const noCoords = got.unplaced.map((u) => u.name);
    for (const n of ['RT66 Old School Brewing', 'Elgin Park Brewery', 'Second Street Brewery - The Railyard', 'JUNO Brewery - Edgewood']) { expect(noCoords, n).toContain(n); expect(road.stops.some((s) => s.name === n), n).toBe(false); }
    expect(road.unplaced).toBeGreaterThan(0); expect(road.unplaced).toBeLessThanOrEqual(got.unplaced.length);
    expect(roadTripPage(road)).toContain('left out because we could not tie coordinates to the printed address');
  });
  it('Chicago and Los Angeles use a 2-mile list with the 2-to-5-mile stops shown apart, not dropped', () => {
    const chi = road.legs.find((l) => l.id === 'illinois')!.segments[0], la = road.legs.find((l) => l.id === 'california')!.segments.at(-1)!;
    for (const g of [chi, la]) {
      expect([g.limitMiles, g.furtherOffMiles]).toEqual([2, 5]);
      expect(g.stops.every((s) => s.detourMiles <= 2)).toBe(true); expect(g.outer.length).toBeGreaterThan(0);
      expect(g.outer.every((s) => s.detourMiles > 2 && s.detourMiles <= 5)).toBe(true);
    }
  });
  it('St. Louis city stops carry no mile and no distance, and the page says why', () => {
    const stl = road.legs.find((l) => l.id === 'missouri')!.unmeasured;
    expect(stl).toHaveLength(1); expect(stl[0].stops.length).toBeGreaterThan(5); expect(stl[0].stops.every((s) => s.town === 'St. Louis')).toBe(true);
    expect(roadTripPage(road)).toContain('We give no mile and no distance for them, because we have no mapped line there to measure from.');
  });
  it('does not claim to be official or complete, uses no shield or logo, and gives the dates only in the Park Service\'s words', () => {
    const html = roadTripPage(road), main = html.slice(html.indexOf('<h1'));
    expect(main).toContain('It is not an official guide, it is not complete');
    expect(main).not.toMatch(/\bthe official\b|every brewery (on|along)|complete (guide|list)|centennial|Mother Road/i);
    expect(main.slice(0, main.indexOf('id="how"'))).not.toMatch(/<img|shield/i);
    for (const y of ['1926', '1985']) for (const m of main.replace(/<script.*?<\/script>/gs, '').matchAll(new RegExp(`.{0,60}${y}.{0,10}`, 'g'))) expect(road.config.roadSources.some((q) => m[0].includes(q.quote.slice(-20)) || q.quote.includes(y) && (m[0] + '').includes(y) && road.config.about.includes(q.quote)), m[0]).toBe(true);
    for (const q of road.config.roadSources) { expect(road.config.about).toContain(q.quote); expect(q.url).toMatch(/^https:\/\/www\.nps\.gov\//); }
    expect(main).toContain('If you drink, do not drive.'); expect(main).toContain(OSM_ATTRIBUTION);
    expect(main).not.toMatch(/driving order|detour|confirmed open|open on \d{4}/i);
  });
  it('shows the tribal alcohol material as dated Federal Register excerpts, claiming neither geography nor current law', () => {
    const TITLE = 'Selected Federal Register publications on tribal alcohol regulation';
    const block = (id: string) => road.legs.find((l) => l.id === id)!.notes.find((n) => n.title === TITLE)!;
    const nm = block('new-mexico'), az = block('arizona');
    expect(nm.sources!.map((q) => q.intro)).toEqual(['Federal Register, published December 24, 2008:', 'Federal Register, published June 1, 2000:']);
    expect(az.sources!.map((q) => q.intro)).toEqual(['Federal Register, published December 24, 2008:', 'Federal Register, published September 10, 2008:']);
    for (const n of [nm, az]) {
      expect(n.text).toBeUndefined();
      expect(n.closing).toBe('These excerpts do not establish current requirements or whether they apply to your journey. Check current requirements with the relevant tribal authority before travelling.');
      for (const q of n.sources!) { expect(q.url).toMatch(/^https:\/\/www\.federalregister\.gov\/documents\/full_text\/html\/(2000\/06\/01|2008\/09\/10|2008\/12\/24)\//); }
    }
    for (const l of road.legs) for (const g of l.segments) expect(g.notes, `${l.id}/${g.id}`).toEqual([]);
    const html = roadTripPage(road), text = html.replace(/<[^>]+>/g, ' ');
    expect(html).toContain('bars the transportation, sale, and consumption of alcoholic beverages on the Navajo Reservation');
    expect(text.match(new RegExp(TITLE, 'g'))).toHaveLength(2); expect(text.match(/Check current requirements with the relevant tribal authority before travelling\./g)).toHaveLength(2);
    expect(text).not.toMatch(/tribal lands near the route|Alcohol rules on|liquor rule, as published|runs through or beside|passes the Pueblo|Peach Springs|East of Holbrook|Towards the Arizona line|Between Seligman/);
    const outside = html.replace(/<details class="rt-fold">.*?<\/details>/gs, '');
    expect(outside.match(new RegExp(TITLE, 'g'))).toHaveLength(2);     // never inside the collapsed part
  });
  it('says what the distance is measured to, and states every exception beside the rule it qualifies', () => {
    const html = roadTripPage(road), main = html.slice(html.indexOf('<h1')), text = main.replace(/<script.*?<\/script>/gs, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const measured = road.stops.length - road.legs.flatMap((l) => l.unmeasured).reduce((k, u) => k + u.stops.length, 0);
    expect(roadSummary(road)).toBe(`${measured} listed breweries within 5 straight-line miles of an alignment in our downloaded Route 66 mapping; these are not driving distances. Their mile positions are measured separately, on the one line we measure along for each leg. 10 more are listed without a distance where the mapping is missing (the city of St. Louis). Each listing is supported by published visiting hours read on the date shown.`);
    expect(text).not.toMatch(/straight-line miles of our mapped line|nearest point on our mapped line|from the mapped road/);
    expect(text).toContain('from the nearest mapped alignment, straight-line'); expect(text).toContain('nearest point on our measuring line: mile');
    expect(text).toContain('It is a separate measurement from the mile: it is not taken to the line we measure miles along, and never to a join across a gap.');
    // Missouri: the visible facts, outside the fold, give both counts
    const mo = main.slice(main.indexOf('<section id="leg-missouri"'), main.indexOf('<details', main.indexOf('<section id="leg-missouri"')));
    expect(mo).toContain('16 measured stops in 11 towns, plus 10 unmeasured stops in the city of St. Louis');
    expect(main).toContain('Missouri · 322.2 mapped miles · 26 listed stops (10 not measured)');
    expect(main).toMatch(/A sketch of our measuring line with each measured stop as a dot/);
    expect(text).toContain('The stops in the city of St. Louis are the exception to the distance test: the mapping is missing there, so they are listed in a labelled group of their own with no distance.');
    expect(text).toContain('Measured stops are ordered by their nearest point along our measuring line, within each displayed group');
    expect(text).toContain('Stops in the city of St. Louis are alphabetical.');
    expect(text).toContain('Each stop must also have a street address we can source and a link to the brewery’s own site.');
    // US 422 measures to its one line and keeps saying so
    const us = roadTripPage(allRoads().find((r) => r.config.slug === 'us-422')!);
    expect(us).toContain('from the mapped road, straight-line'); expect(us).toContain('nearest point on our mapped line: mile'); expect(us).not.toContain('measuring line');
  });
  it('every stop has a sourced address, its own site, and a town its address agrees with', () => {
    const plain = (t: string) => t.toLowerCase().replace(/\bsaint\b/g, 'st').replace(/[.']/g, '');
    const alias: Record<string, string> = { 'oklahoma city': 'okc', 'los angeles': 'la' };
    for (const s of road.stops) {
      expect(stopProblems(s, road.config), s.name).toEqual([]);
      expect(s.address.trim(), s.name).not.toBe(''); expect(s.addressSourceUrl, s.name).toMatch(/^https?:\/\//); expect(s.website, s.name).toMatch(/^https?:\/\//);
      // where the address names a town at all (it ends in a state or ZIP), it is the town we show
      if (/\b(?:[A-Z]{2}|Illinois|Missouri|Oklahoma|Texas|New Mexico|Arizona|California)\.?,?\s*(?:\d{5}(?:-\d{4})?)?\s*$/.test(s.address)) { const a = ` ${plain(s.address.replace(/[,·]/g, ' '))} `, t = plain(s.town); expect(a.includes(` ${t} `) || a.includes(` ${alias[t]} `), `${s.name}: ${s.town} / ${s.address}`).toBe(true); }
    }
    const boat = road.stops.find((s) => s.name.startsWith('Boat Town'))!;
    expect([boat.town, boat.address]).toEqual(['Lebanon', '214 West Commercial Street, Lebanon, Missouri 65536']);
    for (const gone of ['Marz', 'Ponderosa', 'Rickety Cricket', '3 Iron', 'Hop Secret', 'Middle Brow', 'Welltown', 'Angry Scotsman', 'La Cumbre Brewing Co (Brewery', 'Arts District', 'Cabin Boys Brewery (Utica']) expect(road.stops.some((s) => s.name.startsWith(gone)), gone).toBe(false);
    expect(road.stops.some((s) => s.evidenceKind === 'notice')).toBe(false);   // the three notice-only stops now rest on hours read on their own sites
    for (const k of ['keg-grove', 'destihl-brewery', 'tractor-brewing-co-wells-park']) expect(road.stops.find((s) => s.key.startsWith(k))!.evidence, k).toMatch(/\d\s*(am|pm|:00)/i);
  });
  it('folds each leg into a closed <details>, keeping the heading, notes and long gaps in view', () => {
    const html = roadTripPage(road), main = html.slice(html.indexOf('<h1'));
    expect(road.config.collapseLegs).toBe(true);
    expect(main.match(/<details class="rt-fold">/g)).toHaveLength(road.legs.length); expect(main).not.toContain('<details class="rt-fold" open');
    const leg = (id: string) => { const a = main.indexOf(`<section id="leg-${id}"`), b = main.indexOf('</details>', a); return { before: main.slice(a, main.indexOf('<details', a)), inside: main.slice(main.indexOf('<details', a), b) }; };
    const il = leg('illinois'), nm = leg('new-mexico'), ks = leg('kansas'), sf = leg('santa-fe-loop');
    expect(il.inside).toMatch(/<summary><span class="rt-sum">Illinois · 285\.4 mapped miles · \d+ listed stops<\/span><span class="rt-sum-towns">Chicago, Oak Park, /);
    expect(il.before).toContain('<h2 id="leg-illinois-h">Illinois: Chicago to the Missouri line</h2>');
    expect(il.before).not.toContain('class="rt-stop"'); expect(il.inside.match(/class="rt-stop"/g)).toHaveLength(road.legs.find((l) => l.id === 'illinois')!.listed); expect(il.inside).toContain('<svg');
    expect(nm.before).toContain('Selected Federal Register publications on tribal alcohol regulation'); expect(nm.before).toMatch(/<strong>207\.1 miles<\/strong> along our measuring line with nothing on this list: from its start at the Texas line to the first listed stop/);
    expect(nm.before).toMatch(/to the end of the line at the Arizona line/);
    expect(ks.before).toContain('That is what our list holds, not proof that there is none.'); expect(ks.inside).toContain('Kansas · 11.9 mapped miles · nothing listed');
    expect(sf.before).toContain('Side leg'); expect(main.indexOf('id="leg-santa-fe-loop"')).toBeGreaterThan(main.indexOf('id="leg-new-mexico"'));
    // always in view: the intro, the driving notice, the jump index and the method notes
    const outside = main.replace(/<details class="rt-fold">.*?<\/details>/gs, '');
    for (const t of ['If you drink, do not drive.', 'Jump to a state.', 'How this list was made', 'It is not an official guide', 'Amarillo is the only place']) expect(outside, t).toContain(t);
    expect([...main.matchAll(/<li><a href="#(leg-[a-z-]+)">/g)].map((m) => m[1])).toEqual(road.legs.map((l) => `leg-${l.id}`));
    // every stop is still in the page source (find-in-page once open, JSON-LD, verifier) and a small script opens a linked leg
    expect(main.match(/class="rt-stop"/g)).toHaveLength(road.stops.length);
    const trip = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1])).find((b) => b['@type'] === 'TouristTrip');
    expect(trip.itinerary.itemListElement).toHaveLength(road.stops.length);
    expect(main).toContain("closest('details.rt-fold')"); expect(main).toContain("addEventListener('hashchange'");
    const levels = [...main.slice(0, main.indexOf('id="how"')).matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    // US 422 is short enough to read straight through and is left as it was
    expect(roadTripPage(allRoads().find((r) => r.config.slug === 'us-422')!)).not.toContain('<details class="rt-fold"');
  });
  it('hours evidence ends at the hours: no phone number, copyright line or stray next word', () => {
    expect(hoursOnly('Hours Mon Closed Tue 2:00pm - 8:00pm Sun 12:00pm - 6:00pm Our')).toBe('Hours Mon Closed Tue 2:00pm - 8:00pm Sun 12:00pm - 6:00pm');
    expect(hoursOnly('Hours: Sun-Thur 12-9 | Fri-Sat 12-10pm (928) 753-2337')).toBe('Hours: Sun-Thur 12-9 | Fri-Sat 12-10pm');
    expect(hoursOnly('Sunday: 2pm – 6pm ©2026 - Kinslahger LLC')).toBe('Sunday: 2pm – 6pm');
    expect(hoursOnly('Saturday 12 – 10 PM Sunday 12 – 8 PM questions')).toBe('Saturday 12 – 10 PM Sunday 12 – 8 PM');
    expect(hoursOnly('Wed 3pm - 9pm Thursday: 3pm - 9pm Sunday, Monday: CLOSED')).toBe('Wed 3pm - 9pm Thursday: 3pm - 9pm Sunday, Monday: CLOSED');
    expect(hoursOnly('Monday-Thursday: 3-10pm (8pm kitchen close) Sunday: Noon-8pm (7:30pm kitchen close) Menu')).toBe('Monday-Thursday: 3-10pm (8pm kitchen close) Sunday: Noon-8pm (7:30pm kitchen close)');
    expect(hoursOnly('Open Daily, 2 p.m. - close')).toBe('Open Daily, 2 p.m. - close'); expect(hoursOnly('No times here at all')).toBe('No times here at all');
    for (const s of road.stops.filter((x) => x.evidenceKind !== 'notice' && !/\.\.\.|…/.test(x.evidence))) { expect(hoursOnly(s.evidence), s.name).toBe(s.evidence); expect(s.evidence, s.name).not.toMatch(/\(\d{3}\) \d{3}-\d{4}$|(©|Copyright)[^\d]*\d{4}[^\d]*$/); }
    expect(road.stops.find((x) => x.key.startsWith('2nd-shift'))!.evidence).toMatch(/6:00pm$/);
  });
  it('the built file is exactly what the build step makes from the checkers\' files', () => {
    const got = ingest();
    const fresh = buildRoad(ROUTE_66, read('osm-ways.json'), got.candidates, got.verified, ROUTE_66_BUILT.built).road;
    const { unplaced, ...rest } = ROUTE_66_BUILT;
    expect(fresh).toEqual(rest); expect(unplaced).toBe(road.unplaced);
  }, 60000);
});

describe('road-aware stop validation', () => {
  const dir = built().road.stops[1];                                   // a US 422-style stop: directory id 1
  const alone = viewRoad({ ...CONFIG, stopsHavePages: false }, buildRoad({ ...CONFIG, stopsHavePages: false }, WAYS, [{ ...cand(1, -79.9, 0, 'Alpha'), id: 'alpha-ales-alpha' } as CandidateRow], [{ ...ok(1), id: 'alpha-ales-alpha' } as VerifiedRow], TODAY, TODAY).road, TODAY).stops[0];
  it('a directory road requires a positive directory id on every stop', () => {
    expect(stopProblems(dir, CONFIG, TODAY)).toEqual([]); expect(stopProblems(dir, {}, TODAY)).toEqual([]);
    const { breweryId: _id, ...missing } = dir;
    expect(stopProblems(missing, CONFIG, TODAY).join(' ')).toMatch(/must carry a positive directory id/);
    expect(stopProblems({ ...dir, breweryId: 0 }, CONFIG, TODAY)).not.toEqual([]);   // refused by the gate itself
    expect(stopProblems({ ...dir, key: 'some-slug' }, CONFIG, TODAY).join(' ')).toMatch(/key must be its directory id/);
    expect(stopProblems(alone, CONFIG, TODAY).join(' ')).toMatch(/positive directory id/);   // a stand-alone stop cannot pass on a directory road
    // the page applies it: a stop with no id never shows on a directory road
    const b = built().road, v = viewRoad(CONFIG, { ...b, stops: [...b.stops, { ...missing, key: 'no-id-brewing', name: 'No Id Brewing' } as RoadStop] }, TODAY);
    expect(v.stops.map((s) => s.name)).not.toContain('No Id Brewing');
    for (const s of allRoads().find((r) => r.config.slug === 'us-422')!.stops) { expect(stopProblems(s, US_422), s.name).toEqual([]); expect(s.breweryId).toBeGreaterThan(0); }
    const { breweryId: _x, ...real } = US_422_BUILT.stops[0];
    expect(stopProblems(real, US_422).join(' ')).toMatch(/positive directory id/);
  });
  it('the builder fails, and does not quietly drop the id, when a directory road is given a non-numeric id', () => {
    expect(() => buildRoad(CONFIG, WAYS, [{ ...cand(1, -79.9), id: 'alpha-ales' } as CandidateRow], [{ ...ok(1), id: 'alpha-ales' } as VerifiedRow], TODAY, TODAY)).toThrow(/directory road needs a positive whole-number directory id/);
    expect(() => buildRoad(CONFIG, WAYS, CANDIDATES, [...VERIFIED, { ...ok(2), id: 2.5 } as VerifiedRow], TODAY, TODAY)).toThrow(/directory id/);
    // a MISSING id is caught too, on its own and when a non-numeric id follows it, in candidates and in verified rows
    const noId = (r: object) => { const { id: _id, ...rest } = r as { id?: unknown }; return rest; };
    const good = VERIFIED.filter((r) => Number.isInteger(r.id));
    expect(() => buildRoad(CONFIG, WAYS, CANDIDATES, [noId(ok(1)) as VerifiedRow, ...good], TODAY, TODAY)).toThrow(/verified row 1 has no id/);
    expect(() => buildRoad(CONFIG, WAYS, CANDIDATES, [noId(ok(1)) as VerifiedRow, { ...ok(2), id: 'two' } as VerifiedRow], TODAY, TODAY)).toThrow(/2 do not: verified row 1 has no id, verified row 2 has "two"/);
    expect(() => buildRoad(CONFIG, WAYS, [noId(cand(1, -79.9)) as CandidateRow, ...CANDIDATES], good, TODAY, TODAY)).toThrow(/candidate row 1 has no id/);
    expect(() => buildRoad(CONFIG, WAYS, [noId(cand(1, -79.9)) as CandidateRow, { ...cand(2, -79.8), id: 'x' } as CandidateRow], [ok(3)], TODAY, TODAY)).toThrow(/2 do not: candidate row 1 has no id, candidate row 2 has "x"/);
    expect(() => buildRoad(CONFIG, WAYS, [{ ...cand(1, -79.9), id: null } as unknown as CandidateRow], [], TODAY, TODAY)).toThrow(/directory id/);
    expect(() => buildRoad(CONFIG, WAYS, [{ ...cand(1, -79.9), id: 0 }, { ...cand(2, -79.8), id: -3 }], [], TODAY, TODAY)).toThrow(/2 do not/);
    expect(() => buildRoad(CONFIG, WAYS, CANDIDATES, VERIFIED.filter((r) => Number.isInteger(r.id)), TODAY, TODAY)).not.toThrow();
  });
  it('a stand-alone road accepts a stop with no id, but only with a sourced address and its own site', () => {
    const cfg = { stopsHavePages: false as const };
    expect(alone.breweryId).toBeUndefined(); expect(stopProblems(alone, cfg, TODAY)).toEqual([]);
    expect(stopProblems({ ...alone, address: '' }, cfg, TODAY).join(' ')).toMatch(/sourced street address/);
    expect(stopProblems({ ...alone, addressSourceUrl: '' }, cfg, TODAY).join(' ')).toMatch(/sourced street address/);
    expect(stopProblems({ ...alone, website: '' }, cfg, TODAY).join(' ')).toMatch(/own site/);
    expect(stopProblems({ ...alone, website: 'javascript:alert(1)' }, cfg, TODAY).join(' ')).toMatch(/own site/);
    expect(stopProblems({ ...alone, breweryId: 5 }, cfg, TODAY).join(' ')).toMatch(/must not carry a directory id/);
    expect(stopProblems({ ...alone, evidenceKind: 'notice' }, cfg, TODAY).join(' ')).toMatch(/context/);
    expect(stopProblems({ ...alone, status: 'CLOSED' }, cfg, TODAY).join(' ')).toMatch(/fails the gate/);
    const valid66 = ROUTE_66_BUILT.stops[0];
    expect(valid66.breweryId).toBeUndefined(); expect(stopProblems(valid66, ROUTE_66)).toEqual([]);
    expect(viewRoad({ ...CONFIG, stopsHavePages: false }, { ...built().road, stops: [{ ...alone, legId: 'only', address: '', addressSourceUrl: '' }] }, TODAY).stops).toEqual([]);
  });
});

describe('distance to mapped ways, and excerpts that must really be found', () => {
  it('keeps a long segment that passes near the point though both its ends are far away', () => {
    const long: LatLon[][] = [[[40, -81], [40, -79]]];                 // 105 miles, one segment; its ends are each 53 miles from the point
    expect(distanceToWays([40.01, -80], long)).toBeCloseTo(0.01 * DEG_LAT, 2);
    expect(distanceToWays([40.01, -80], [[[42, -80.5], [38, -79.5]]])).toBeLessThan(1.5);   // a long diagonal too
    expect(distanceToWays([45, -80], long)).toBe(Infinity);            // genuinely far: nothing in reach
  });
  it('a join across a gap is not a mapped way: being near only the join does not make a brewery near the road', () => {
    const gappy: LatLon[][] = [run(-80, -79.6), run(-79.4, -79)];      // a 10.6-mile hole in the middle
    const cfg: RoadConfig = { ...CONFIG, stopsHavePages: false, distanceTo: 'any-way', legs: [{ ...CONFIG.legs[0], lonRange: undefined, joinMiles: 12, maxJoinedMiles: 12, segments: [{ id: 'all', toMile: null }] }] };
    const rows = [{ ...ok(1), id: 'in-the-gap' }, { ...ok(2), id: 'by-the-road' }] as VerifiedRow[];
    const cands = [{ ...cand(1, -79.5, 0.001, 'Gap'), id: 'in-the-gap' }, { ...cand(2, -79.8, 0.001, 'Road'), id: 'by-the-road' }] as CandidateRow[];
    const b = buildRoad(cfg, gappy, cands, rows, TODAY, TODAY);
    expect(b.report.legs[0].bridges).toBe(1);                          // the measuring line does cross the hole
    expect(b.road.stops.map((s) => s.key)).toEqual(['by-the-road']);   // 0.07 miles from the join, 5.3 from any mapped way
    expect(b.report.left.find((x) => x.id === 'in-the-gap')!.reason).toMatch(/over the limit/);
    expect(distanceToWays([LAT + 0.001, -79.5], gappy)).toBeCloseTo(0.1 * DEG_LON, 0);
    // measured to the line instead, the same brewery would have counted: that is the difference the page now states
    expect(buildRoad({ ...cfg, distanceTo: 'line' }, gappy, cands, rows, TODAY, TODAY).road.stops.map((s) => s.key)).toContain('in-the-gap');
  });
  it('an excerpt with nothing in it is never found', () => {
    const page = pageText('<p>Hours Monday 12pm - 9pm</p><p>Closed Tuesday</p>');
    expect(excerptFound(page, 'Monday 12pm - 9pm')).toBe(true); expect(excerptFound(page, 'Hours Monday ... Closed Tuesday')).toBe(true); expect(excerptFound(page, 'Hours … Tuesday')).toBe(true);
    expect(excerptFound(page, 'Closed Tuesday ... Hours Monday')).toBe(false);                  // out of order
    for (const empty of ['', '   ', '...', '…', ' ... … ... ', '\n\t']) expect(excerptFound(page, empty), JSON.stringify(empty)).toBe(false);
    expect(excerptFound('', 'Monday')).toBe(false); expect(excerptFound(page, 'Wednesday')).toBe(false);
    expect(excerptFound(page, undefined as unknown as string)).toBe(false);
  });
});

describe('location identity on a directory road', () => {
  const strict: RoadConfig = { ...CONFIG, addressMustMatch: true };
  const dirRow = (id: number, lon: number, street: string, city: string, latOff = 0): CandidateRow => ({ id, name: `Directory name ${id}`, city, state: 'PA', street, latitude: LAT + latOff, longitude: lon });
  const at = (id: number, address: string | null) => ok(id, { address_as_printed: address, address_source_url: address ? `https://example.com/${id}/visit` : null });
  const g = (id: number, address: string, lat: number | null, lon: number | null, matched: string | null): AddressGeocode => ({ id, address, lat, lon, matched, source: 'US Census geocoder', checked: TODAY });
  const cands = [
    dirRow(1, -79.9, '10 Main St', 'Alpha'),                 // address matches the directory in full
    dirRow(2, -79.5, '', 'Bravo'),                           // the directory has no street: needs a geocode
    dirRow(3, -79.1, '30 Old Rd', 'Charlie'),                // moved: prints another address
    dirRow(4, -79.3, '40 Elm St', 'Delta'),                  // directory point is a placeholder far away, address is right
    dirRow(5, -79.7, '', 'Echo'),                            // no printed address at all
    dirRow(6, -79.6, '', 'Foxtrot'),                         // geocoder matched a different street, far from the directory point
    dirRow(7, -79.8, '', 'Golf'),                            // geocoder matched loosely, but right beside the directory point
    dirRow(8, -79.2, '80 Oak Ave', 'Newbury'),               // directory town is not the one the address prints
  ];
  const rows = [at(1, '10 Main Street, Alpha, PA 15000'), at(2, '22 Bravo Blvd, Bravo, PA'), at(3, '99 New Rd, Charlie, PA'), at(4, '40 Elm St, Delta, PA'),
    at(5, null), at(6, '60 E Federal St, Foxtrot, PA'), at(7, '70 Father Frascati, Golf, PA'), at(8, '80 Oak Ave, Chagrin Falls, PA')];
  const geocodes = [
    g(2, '22 Bravo Blvd, Bravo, PA', LAT + 0.01, -79.51, '22 BRAVO BLVD, BRAVO, PA, 15001'),
    g(4, '40 Elm St, Delta, PA', LAT + 0.5, -79.3, '40 ELM ST, DELTA, PA, 15003'),                       // 34.5 miles north of the directory's point
    g(6, '60 E Federal St, Foxtrot, PA', LAT + 0.02, -79.6, '60 FEDERAL PLZ E, FOXTROT, PA, 15005'),
    g(7, '70 Father Frascati, Golf, PA', LAT + 0.001, -79.8, '70 FATHER FRASCATI DR, GOLF, PA, 15006'),
    g(8, '80 Oak Ave, Chagrin Falls, PA', LAT + 0.002, -79.2, '80 OAK AVE, CHAGRIN FALLS, PA, 15007'),
    g(3, 'an address it no longer prints', LAT, -79.1, '30 OLD RD, CHARLIE, PA, 15002'),
  ];
  const b = buildRoad(strict, WAYS, cands, rows, TODAY, TODAY, geocodes), stop = (id: number) => b.road.stops.find((s) => s.breweryId === id), why = (id: number) => b.report.left.find((x) => x.id === id)?.reason ?? '';
  it('uses the directory point only on a full address match, and Census coordinates first when they are exact', () => {
    expect(b.road.stops.map((s) => s.breweryId).sort()).toEqual([1, 2, 7, 8]);
    expect([stop(1)!.lat, stop(1)!.lon]).toEqual([LAT, -79.9]);                       // full match, no geocode: the directory's point
    expect([stop(2)!.lat, stop(2)!.lon]).toEqual([LAT + 0.01, -79.51]);               // exact Census match for the printed address
    expect(stop(2)!.detourMiles).toBeCloseTo(0.01 * DEG_LAT, 1);
    expect(b.report.geocoded.sort()).toEqual([2, 7, 8]);
  });
  it('a brewery that prints another address than the directory\'s, with no geocode for it, stays off', () => {
    expect(stop(3)).toBeUndefined(); expect(why(3)).toMatch(/not a full match for the directory's/);   // the geocode on file is for an old address
    expect(stop(5)).toBeUndefined(); expect(why(5)).toMatch(/no printed address/);
  });
  it('a wrong directory point does not survive a right address: the exact Census point decides', () => {
    expect(stop(4)).toBeUndefined(); expect(why(4)).toMatch(/over the limit/);        // really 34 miles from the road
    expect(buildRoad(strict, WAYS, cands, rows, TODAY, TODAY, []).road.stops.map((s) => s.breweryId)).toContain(4);   // without the geocode the placeholder would have passed
  });
  it('a loose geocoder match is used only beside the directory\'s own point', () => {
    expect(stop(6)).toBeUndefined(); expect(why(6)).toMatch(/matched a different address \(60 FEDERAL PLZ E, FOXTROT, PA, 15005\) 1\.38 miles/);
    expect([stop(7)!.lat, stop(7)!.lon]).toEqual([LAT + 0.001, -79.8]);               // 0.07 miles from the directory's point
  });
  it('the town shown is the one the printed address names', () => {
    expect(stop(8)!.town).toBe('Chagrin Falls'); expect(stop(1)!.town).toBe('Alpha');
  });
  it('without the flag a directory road is built as before, and rows that are not listed still count for coverage', () => {
    expect(buildRoad(CONFIG, WAYS, cands, rows, TODAY, TODAY, geocodes).road.stops).toHaveLength(8);
    expect(b.road.legs[0].candidates).toBe(7);                         // seven within reach; the eighth is really 34 miles away
  });
  it('US 422 and I-71 are built by this rule, from the geocodes on file', () => {
    expect(US_422.addressMustMatch).toBe(true); expect(I_71.addressMustMatch).toBe(true);
    for (const id of [261, 26, 259]) expect(US_422_BUILT.stops.some((s) => s.breweryId === id), String(id)).toBe(false);   // no address, no Census match, wrong Census match
    expect(US_422_BUILT.stops).toHaveLength(31);
    expect(US_422_BUILT.stops.find((s) => s.breweryId === 82)!.town).toBe('Chagrin Falls');
  });
});

describe('Interstate 71 (src/data/roads/i-71)', () => {
  const road = allRoads().find((r) => r.config.slug === 'i-71')!;
  const dir = join(__dirname, '../../data/roads/i-71');
  const read = (f: string) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const verified: VerifiedRow[] = readdirSync(dir).filter((f) => /^verified.*\.json$/.test(f)).sort().flatMap(read);
  const html = roadTripPage(road), main = html.slice(html.indexOf('<h1'));
  it('is a directory road in three legs, Cleveland to Columbus to Cincinnati to Louisville', () => {
    expect(roadConfigProblems(road.config)).toEqual([]); expect(road.config.stopsHavePages).not.toBe(false);
    expect(road.legs.map((l) => [l.from, l.to, Math.round(l.lengthMiles)])).toEqual([['Cleveland, Ohio', 'Columbus, Ohio', 141], ['Columbus, Ohio', 'Cincinnati, Ohio', 107], ['Cincinnati, Ohio', 'Louisville, Kentucky', 96]]);
    expect(availableRoads().map((r) => r.config.slug)).toEqual(road.config.publish ? ['route-66', 'i-71', 'us-422'] : ['route-66', 'us-422']);
  });
  it('every stop is a directory listing with a page, operating evidence, and coordinates tied to its printed address', () => {
    const geo = new Map((read('geocodes.json') as AddressGeocode[]).map((x) => [x.id, x]));
    const cands = new Map((read('candidates.json') as CandidateRow[]).map((c) => [c.id, c]));
    expect(road.stops.length).toBeGreaterThan(60);
    for (const s of road.stops) {
      expect(stopProblems(s, road.config), s.name).toEqual([]); expect(s.breweryId).toBeGreaterThan(0);
      expect(main).toContain(`href="/brewery/${s.breweryId}"`);
      const c = cands.get(s.breweryId!)!, x = geo.get(s.breweryId!);
      const fromCensus = !!x && x.lat === s.lat && x.lon === s.lon, fromDirectory = c.latitude === s.lat && c.longitude === s.lon;
      expect(fromCensus || fromDirectory, s.name).toBe(true);
      if (!fromCensus) expect(sameLocation(s.address, { address_1: c.street, city: c.city, state: c.state }), `${s.name}: ${s.address} / ${c.street}`).toBe(true);
    }
  });
  it('leaves off the retired, held, script-rendered and misplaced rows', () => {
    const ids = new Set(road.stops.map((s) => s.breweryId));
    for (const id of [2313, 2345, 2339, 238, 103, 892, 2326, 39, 278, 235, 44, 2464, 75, 338, 327, 234, 66, 939, 2455, 2390]) expect(ids.has(id), String(id)).toBe(false);
    for (const r of verified.filter((x) => x.status !== 'OPEN')) expect(ids.has(r.id as number), String(r.name)).toBe(false);
    expect(JSON.stringify(read('candidates.json'))).not.toMatch(/second_signal|OPERATIONAL|CLOSED_PERMANENTLY/);   // the internal signal is not in the repo
    expect(main + roadsIndexPage([road])).not.toMatch(/second same-day|second_signal/i);
  });
  it('tightens the four city cores to 2 miles and keeps the 2-to-5-mile stops apart', () => {
    const dense = road.legs.flatMap((l) => l.segments.filter((g) => g.furtherOffMiles !== null));
    expect(dense.map((g) => g.id)).toEqual(['cleveland', 'columbus-north', 'columbus-south', 'cincinnati', 'northern-kentucky', 'louisville']);
    for (const g of dense) { expect([g.limitMiles, g.furtherOffMiles]).toEqual([2, 5]); expect(g.stops.every((s) => s.detourMiles <= 2)).toBe(true); expect(g.outer.every((s) => s.detourMiles > 2 && s.detourMiles <= 5)).toBe(true); }
    expect(dense.reduce((n, g) => n + g.outer.length, 0)).toBeGreaterThan(10);
  });
  it('folds its legs, uses no shield or logo, gives no exit numbers and says why', () => {
    expect(main.match(/<details class="rt-fold">/g)).toHaveLength(3);
    expect(main.slice(0, main.indexOf('id="how"'))).not.toMatch(/<img|shield/i);
    expect(main).toContain('Exit numbers.'); expect(main.replace(/<blockquote>.*?<\/blockquote>/gs, '')).not.toMatch(/\bexit \d/i);   // a brewery's own words may name one
    expect(main).toContain('If you drink, do not drive.'); expect(main).toContain(OSM_ATTRIBUTION); expect(main).toContain('It is an independent list, not an official guide');
    expect(main).toContain('Operating evidence: hours read on'); expect(main).not.toMatch(/driving order|detour|confirmed open|open on \d{4}/i);
    expect(roadSummary(road)).toMatch(/^\d+ breweries from our directory within 5 straight-line miles of our mapped line of I-71, ordered by their nearest point along it; these are not driving distances\. Each listing is supported by published visiting hours read on the date shown\.$/);
  });
  it('the built file is exactly what the build step makes from data/roads/i-71', () => {
    expect(read('decisions.json')).toEqual([]);                        // no open row conflicted with the second check
    const edits = applyRowEdits(verified, read('decisions.json'), read('corrections.json'));
    expect(edits.unmatched).toEqual([]);
    expect(buildRoad(I_71, read('osm-ways.json'), read('candidates.json'), edits.rows, I_71_BUILT.built, undefined, read('geocodes.json')).road).toEqual(I_71_BUILT);
  });
  it('rulings and corrections are applied to a directory road\'s rows without touching the checkers\' files', () => {
    const rows = [ok(1), ok(2), ok(3)];
    const e = applyRowEdits(rows, [{ match: '2', status: 'UNCONFIRMED', reason: 'second same-day check conflicted' }, { match: '9', status: 'CLOSED', reason: 'no such row' }],
      [{ key: '1', field: 'address', value: '1 Fixture Street', reason: 're-read' }, { key: '3', field: 'evidence', value: null, reason: 'not found' }, { key: '8', field: 'quote', value: null, reason: 'no such row' }]);
    expect(e.rows.map((r) => [r.id, r.status, r.address_as_printed, !!r.operating_evidence])).toEqual([[1, 'OPEN', '1 Fixture Street', true], [2, 'UNCONFIRMED', '2 Fixture St', true], [3, 'OPEN', '3 Fixture St', false]]);
    expect(e.rows[1].notes).toContain('second same-day check conflicted'); expect(e.unmatched).toEqual(['9', 'correction:8']);
    expect(rows[0].address_as_printed).toBe('1 Fixture St');           // the input rows are not changed
    expect(built(e.rows).road.stops.map((s) => s.breweryId)).toEqual([1]);
  });
});

describe('routes and links', () => {
  const env = { TAPLIST_API_URL: 'http://not-used.invalid' }; // not https, so the tap-list lookup fails closed without a request
  it('serves /roads and each published road, and 404s an unknown one', async () => {
    resetTapListCache();
    const roads = availableRoads();
    const index = await pageRoutes.request('/roads', {}, env);
    expect(index.status).toBe(roads.length ? 200 : 404);
    const indexBody = await index.text();
    for (const r of roads) {
      const res = await pageRoutes.request(`/roads/${r.config.slug}`, {}, env);
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain(OSM_ATTRIBUTION); expect(body).not.toContain('Tap list, updated');
      expect(indexBody).toContain(`href="/roads/${r.config.slug}"`);
    }
    expect((await pageRoutes.request('/roads/us-66-business', {}, env)).status).toBe(404);
    expect((await pageRoutes.request('/roads/__proto__', {}, env)).status).toBe(404);
  });
  it('the trails page links to /roads only while a road is published, in the same words the pages use', () => {
    const html = trailsPage([]), roads = availableRoads();
    expect(html.includes('href="/roads"')).toBe(roads.length > 0);
    expect(html).not.toMatch(/checked against its own site|in driving order/);
    if (roads.length) expect(html).toContain(roadsBlurb(roads).replace(/&/g, '&amp;'));
  });
});
