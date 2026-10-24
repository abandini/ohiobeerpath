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
