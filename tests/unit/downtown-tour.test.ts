import { describe, it, expect } from 'vitest';
import { DOWNTOWN_TOUR, milesBetween } from '../../src/data/tours/downtown-cleveland';
import { downtownTourPage } from '../../src/templates/downtown-tour';
import { trailsPage } from '../../src/templates/trails';

describe('downtown Cleveland tour data', () => {
  it('every stop carries a verbatim address source and a note source with URL and check date', () => {
    for (const s of DOWNTOWN_TOUR.stops) {
      for (const src of [s.addressSource, s.noteSource]) {
        expect(src.quote.length, s.name).toBeGreaterThan(8);
        expect(src.url).toMatch(/^https:\/\//);
        expect(src.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(src.url).not.toMatch(/facebook|reddit|nextdoor/i);
        expect(src.quote.toLowerCase()).not.toBe('');
      }
      // the address we print must be supported by its quote (street number at least)
      expect(s.addressSource.quote).toContain(s.address.match(/^\d+/)![0]);
      if (s.website) expect(s.website).toMatch(/^https:\/\//);
      if (s.neighborhood) expect([s.addressSource.quote, s.noteSource.quote].join(' ').toLowerCase()).toContain(s.neighborhood.toLowerCase().replace(/^the /, ''));
    }
  });
  it('the stops Bill named are on the tour, in walking order from downtown to Ohio City', () => {
    const names = DOWNTOWN_TOUR.stops.map((s) => s.name);
    for (const n of ['Noble Beast', 'Masthead', 'Saucy', 'Market Garden', 'Nano Brew', 'Anthology Cask House', 'Forest City'])
      expect(names.some((x) => x.includes(n)), n).toBe(true);
    expect(names[0]).toMatch(/Noble Beast/); expect(names.at(-1)).toMatch(/Saucy/);
  });
  it('no straight-line leg exceeds 1.1 miles and the distance math is right', () => {
    const st = DOWNTOWN_TOUR.stops;
    const legs = st.slice(1).map((s, i) => milesBetween(st[i], s));
    expect(Math.max(...legs)).toBeLessThan(1.1);
    expect(milesBetween({ lat: 41.5, lon: -81.7 }, { lat: 41.51, lon: -81.7 })).toBeCloseTo(0.691, 2);
  });
});

describe('downtown Cleveland tour page', () => {
  const html = downtownTourPage();
  it('renders every stop, its sources, and labels distances as straight-line', () => {
    for (const s of DOWNTOWN_TOUR.stops) { expect(html).toContain(s.name.replace(/&/g, '&amp;')); expect(html).toContain(s.addressSource.url); }
    expect(html).toContain('straight-line');
    expect(html).toContain('<link rel="canonical" href="https://brewerytrip.com/trails/downtown-cleveland"');
  });
  it('emits an ItemList JSON-LD with ten breweries', () => {
    const m = html.match(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema.org","@type":"ItemList".*?)<\/script>/s);
    expect(m).toBeTruthy();
    expect(JSON.parse(m![1]).itemListElement).toHaveLength(DOWNTOWN_TOUR.stops.length);
  });
  it('opens walking directions in segments of at most three waypoints (mobile Google Maps limit)', () => {
    const links = [...html.matchAll(/href="(https:\/\/www\.google\.com\/maps\/dir\/[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
    expect(links.length).toBe(3);
    for (const l of links) expect((new URL(l).searchParams.get('waypoints') || '').split('|').filter(Boolean).length).toBeLessThanOrEqual(3);
  });
  it('every stop has Uber and Lyft links with its coordinates as the drop-off', () => {
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
    const ubers = hrefs.filter((h) => h.startsWith('https://m.uber.com/ul/')).map((h) => new URL(h).searchParams);
    const lyfts = hrefs.filter((h) => h.startsWith('https://lyft.com/ride')).map((h) => new URL(h).searchParams);
    expect(ubers).toHaveLength(DOWNTOWN_TOUR.stops.length); expect(lyfts).toHaveLength(DOWNTOWN_TOUR.stops.length);
    DOWNTOWN_TOUR.stops.forEach((s, i) => {
      expect(ubers[i].get('action')).toBe('setPickup'); expect(ubers[i].get('pickup')).toBe('my_location');
      expect(Number(ubers[i].get('dropoff[latitude]'))).toBe(s.lat); expect(Number(ubers[i].get('dropoff[longitude]'))).toBe(s.lon);
      expect(ubers[i].get('dropoff[nickname]')).toBe(s.name);
      expect(lyfts[i].get('id')).toBe('lyft');
      expect(Number(lyfts[i].get('destination[latitude]'))).toBe(s.lat); expect(Number(lyfts[i].get('destination[longitude]'))).toBe(s.lon);
    });
    const st = DOWNTOWN_TOUR.stops, legs = st.slice(1).map((s, i) => milesBetween(st[i], s)), k = legs.indexOf(Math.max(...legs));
    expect(html).toContain(`The longest straight-line leg is ${st[k].name} to ${st[k + 1].name}`);
  });
  it('links Anthology without a broken directory link (it has no brewery id)', () => {
    expect(html).not.toContain('/brewery/undefined');
  });
  it('the trails index links to the walk', () => {
    expect(trailsPage([])).toContain('href="/trails/downtown-cleveland"');
  });
});

describe('internal links to the walk', () => {
  it('a tour stop brewery page links to the walk; others do not', async () => {
    const { breweryPage } = await import('../../src/templates/brewery');
    const b = (id: number, name: string) => ({ id, name, city: 'Cleveland', state: 'OH', state_province: 'Ohio', region: 'northeast' } as any);
    const on = breweryPage(b(235, 'Noble Beast Brewing Co.'));
    expect(on).toContain('href="/trails/downtown-cleveland"'); expect(on).toContain('Stop 1 of 10');
    expect(breweryPage(b(999999, 'Elsewhere Brewing'))).not.toContain('/trails/downtown-cleveland');
    DOWNTOWN_TOUR.stops.forEach((s, i) => { if (s.breweryId) expect(breweryPage(b(s.breweryId, s.name))).toContain(`Stop ${i + 1} of ${DOWNTOWN_TOUR.stops.length}`); });
  });
  it('Cleveland trails link to the walk', async () => {
    const { trailDetailPage } = await import('../../src/templates/trails');
    expect(trailDetailPage({ id: 4, slug: 'ohio-city-hop', name: 'Ohio City Hop', region: 'northeast', brewery_ids: '[]' }, [])).toContain('/trails/downtown-cleveland');
    expect(trailDetailPage({ id: 2, slug: 'cincinnati-craft-crawl', name: 'Cincinnati Craft Crawl', region: 'southwest', brewery_ids: '[]' }, [])).not.toContain('/trails/downtown-cleveland');
  });
});

describe('robots.txt', () => {
  it('blocks /admin/ and /api/ for every welcomed crawler, Googlebot included', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../../src/index.ts', import.meta.url), 'utf8');
    const body = src.slice(src.indexOf('const robotsTxt = `'), src.indexOf('`;', src.indexOf('const robotsTxt = `')));
    const groups = body.split(/\n\s*\n/).filter((g) => /User-agent:/.test(g));
    const star = groups.find((g) => /User-agent: \*/.test(g))!;
    expect(star).toMatch(/Disallow: \/api\//); expect(star).toMatch(/Disallow: \/admin\//);
    expect(groups.find((g) => /Bytespider/.test(g))).toMatch(/Disallow: \/\n?$/m);
  });
});

describe('GABF medals', () => {
  it('every medal quotes the official list line and names its beer, medal and entrant; years are inside the window', async () => {
    const { GABF_WINDOW } = await import('../../src/data/tours/downtown-cleveland');
    let n = 0;
    for (const s of DOWNTOWN_TOUR.stops) for (const m of s.gabf || []) {
      n++;
      expect(m.quote).toBe(`${m.medal}: ${m.beer}, ${m.entrant}, Cleveland, OH`);
      expect(m.url).toMatch(/^https:\/\/(www|cdn)\.greatamericanbeerfestival\.com\/.+\.pdf$/);
      expect(m.year).toBeGreaterThanOrEqual(GABF_WINDOW.from); expect(m.year).toBeLessThanOrEqual(GABF_WINDOW.to);
      expect(m.url).toContain(String(m.year).slice(2));
      expect(m.category.length).toBeGreaterThan(3);
    }
    expect(n).toBe(14);
    const count = (name: string) => DOWNTOWN_TOUR.stops.find((s) => s.name.startsWith(name))!.gabf?.length || 0;
    expect([count('Masthead'), count('Noble Beast'), count('Market Garden'), count('Great Lakes')]).toEqual([7, 3, 3, 1]);
  });
  it('badges show one icon per medal, gold first, with a spoken summary', async () => {
    const { medalBadges } = await import('../../src/templates/downtown-tour');
    const nb = DOWNTOWN_TOUR.stops.find((s) => s.name.startsWith('Noble Beast'))!;
    expect(medalBadges(nb.gabf)).toContain('aria-label="3 GABF medals: 1 gold, 1 silver, 1 bronze"');
    expect(medalBadges(nb.gabf)).toContain('>🥇🥈🥉<');
    expect(medalBadges([])).toBe('');
  });
  it('the page shows the medal total, per-stop lists and JSON-LD awards; medal brewery pages show the list', async () => {
    const html = downtownTourPage();
    expect(html).toContain('14 Great American Beer Festival medals at 4 stops');
    expect(html).toContain('Shower Beer'); expect(html).toContain('entered as Market Garden Brewery - Production Brewery');
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema.org","@type":"ItemList".*?)<\/script>/s)![1]);
    expect(ld.itemListElement.find((x: any) => x.item.name.startsWith('Masthead')).item.award).toHaveLength(7);
    const { breweryPage } = await import('../../src/templates/brewery');
    const page = breweryPage({ id: 208, name: 'Masthead Brewing Company', city: 'Cleveland', state: 'OH', region: 'northeast' } as any);
    expect(page).toContain('Great American Beer Festival medals'); expect(page).toContain('Midwest Red IPA');
  });
});

describe('where are you starting from', () => {
  it('routeFrom visits every stop once, starting with the nearest', async () => {
    const { ROUTE_FROM_JS, LANDMARKS } = await import('../../src/data/tours/downtown-cleveland');
    const routeFrom = new Function(`${ROUTE_FROM_JS}; return routeFrom;`)();
    const st = DOWNTOWN_TOUR.stops;
    const wsm = LANDMARKS.find((l) => l.name === 'West Side Market')!;
    const order = routeFrom(wsm, st);
    expect([...order].sort((a, b) => a - b)).toEqual(st.map((_, i) => i));
    const nearest = st.map((s, i) => [milesBetween(wsm, s), i]).sort((a, b) => a[0] - b[0])[0][1];
    expect(order[0]).toBe(nearest);
    const len = (o: number[], from = wsm) => o.reduce((sum, i, k) => sum + milesBetween(k ? st[o[k - 1]] : from, st[i]), 0);
    // no longer than the plain nearest-next walk would be
    const greedy: number[] = []; { const left = st.map((_, i) => i); let at: any = wsm; while (left.length) { left.sort((a, b) => milesBetween(at, st[a]) - milesBetween(at, st[b])); const i = left.shift()!; greedy.push(i); at = st[i]; } }
    expect(len(order)).toBeLessThanOrEqual(len(greedy) + 1e-9);
    const ps = LANDMARKS.find((l) => l.name === 'Public Square')!;
    const o2 = routeFrom(ps, st), names = o2.map((i) => st[i].name);
    expect(names.indexOf('Forest City Brewery') === names.length - 1 || Math.abs(names.indexOf('Forest City Brewery') - names.indexOf('Brick and Barrel')) === 1).toBe(true);
    expect(st[order[0]].name).toMatch(/Market Garden|Great Lakes/);
  });
  it('the finder script compiles and offers every landmark and stop', async () => {
    const { LANDMARKS } = await import('../../src/data/tours/downtown-cleveland');
    const html = downtownTourPage();
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    const finder = scripts.find((s) => s.includes('finder-out'))!;
    expect(() => new Function(finder)).not.toThrow();
    for (const l of LANDMARKS) expect(html).toContain(`>${l.name}</option>`);
    expect(html).toContain("don't send your location to our server");
    const { ROUTE_FROM_JS } = await import('../../src/data/tours/downtown-cleveland');
    expect(finder).toContain(ROUTE_FROM_JS);
    expect(finder).not.toMatch(/innerHTML/);
  });
});
