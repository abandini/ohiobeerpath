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
  it('links Anthology without a broken directory link (it has no brewery id)', () => {
    expect(html).not.toContain('/brewery/undefined');
  });
  it('the trails index links to the walk', () => {
    expect(trailsPage([])).toContain('href="/trails/downtown-cleveland"');
  });
});
