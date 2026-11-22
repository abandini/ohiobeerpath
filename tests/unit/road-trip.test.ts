import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildRoad, cumulativeMiles, isShowableStop, unreadVerdict, verifierExit, BROWSER_CHECK_MAX_DAYS, milesBetween, projectOntoLine, simplifyLine, stitchLeg, townsName, viewRoad,
  roadConfigProblems, safeSitePath,
  type BuiltRoad, type CandidateRow, type LatLon, type RoadConfig, type RoadStop, type VerifiedRow,
} from '../../src/lib/road-trip';
import {
  roadTripPage, roadsIndexPage, roadSummary, roadsBlurb, coverageText, distanceLabel, directionsUrl, mapsPlace, stretchLinks, quoteAdds,
  MAPS_MAX_WAYPOINTS, MAPS_URL_LIMIT, OSM_ATTRIBUTION, DRIVING_NOTICE,
} from '../../src/templates/road-trip';
import { allRoads, availableRoads, roadBySlug, roadStopFor } from '../../src/data/roads';
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
    expect(roadsBlurb([w])).toBe('Breweries near one road, ordered by their nearest point along our mapped line of it, with straight-line distances. Each listing is supported by published visiting hours read on the date shown; some sources are third-party.');
    expect(roadsBlurb([v])).toBe('Breweries near one road, ordered by their nearest point along our mapped line of it, with straight-line distances. Each listing is supported by published visiting hours read on the date shown.');
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
    expect(out).toContain('id="leg-x&quot; onmouseover=&quot;alert(1)"'); expect(out).toContain('aria-labelledby="leg-x&quot; onmouseover=&quot;alert(1)"');
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
    expect(buildRoad(US_422, read('osm-ways.json'), read('candidates.json'), verified, US_422_BUILT.built).road).toEqual(US_422_BUILT);
    const evidenced = new Set(verified.filter((r) => r.status === 'OPEN' && r.operating_evidence?.excerpt && r.operating_evidence?.url).map((r) => r.id));
    for (const s of US_422_BUILT.stops) expect(evidenced.has(s.breweryId), s.name).toBe(true);
    for (const r of verified.filter((x) => x.status !== 'OPEN' || !x.operating_evidence)) expect(US_422_BUILT.stops.some((s) => s.breweryId === r.id), String(r.name)).toBe(false);
  });
  it('only pages a person read in a browser carry a browser check', () => {
    // 82 Crooked Pecker, 261 Pompatus and 1082 Hidden River are script-rendered sites read in a real browser on 2026-11-22.
    expect(US_422_BUILT.stops.filter((s) => s.browserChecked).map((s) => s.breweryId).sort((a, b) => a - b)).toEqual([82, 261, 1082]);
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
    expect((await pageRoutes.request('/roads/route-66', {}, env)).status).toBe(404);
    expect((await pageRoutes.request('/roads/__proto__', {}, env)).status).toBe(404);
  });
  it('the trails page links to /roads only while a road is published, in the same words the pages use', () => {
    const html = trailsPage([]), roads = availableRoads();
    expect(html.includes('href="/roads"')).toBe(roads.length > 0);
    expect(html).not.toMatch(/checked against its own site|in driving order/);
    if (roads.length) expect(html).toContain(roadsBlurb(roads).replace(/&/g, '&amp;'));
  });
});
