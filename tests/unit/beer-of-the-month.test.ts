import { describe, it, expect } from 'vitest';
import { BEER_OF_THE_MONTH } from '../../src/data/beer-of-the-month';
import { beerOfTheMonthPage } from '../../src/templates/beer-of-the-month';
import { escapeAttr } from '../../src/templates/utils';

const B = BEER_OF_THE_MONTH;
const sourcesOf = (p: (typeof B.pours)[number]) => [p.identity, p.about, p.when].filter(Boolean) as { quote: string; url: string; checked: string }[];
const all = [...B.tradition, ...B.pours.flatMap(sourcesOf), ...B.events.flatMap((e) => [e.source, e.dateSource])];
const host = (u: string) => new URL(u).hostname.replace(/^www\./, '');

// Structure only. Live verbatim checks are scripts/verify-beer-of-the-month.mjs.
describe('beer of the month data (structure)', () => {
  it('every source has a quote, an https URL and a check date, and no social sources', () => {
    for (const s of all) {
      expect(s.quote.length).toBeGreaterThan(8);
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.url).not.toMatch(/facebook|reddit|nextdoor|instagram|untappd|beeradvocate|twitter|x\.com/i);
    }
  });
  it("every beer's sources are on the brewery's own domain, and one of them names the beer", () => {
    for (const p of B.pours) {
      for (const s of sourcesOf(p)) expect(host(s.url), p.beer).toBe(p.site);
      expect(sourcesOf(p).some((s) => s.quote.toLowerCase().includes(p.beer.toLowerCase())), p.beer).toBe(true);
    }
  });
  it('2026 is claimed only with a quote that prints 2026 and names the beer', () => {
    for (const p of B.pours) {
      const w = p.when;
      const evidence = !!w && w.quote.includes('2026') && w.quote.toLowerCase().includes(p.beer.toLowerCase());
      expect(p.confirmed2026, p.beer).toBe(evidence);
    }
  });
  it("each event's heading quote prints its name, date and venue", () => {
    const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    for (const ev of B.events) {
      const [y, m, d] = ev.date.split('-').map(Number);
      for (const x of [ev.name, `${M[m - 1]} ${d}, ${y}`, ev.where]) expect(ev.dateSource.quote).toContain(x);
    }
  });
});

describe('beer of the month page', () => {
  const html = beerOfTheMonthPage();
  const cards = html.split('<div class="trail-stop" id="beer-').slice(1);
  it('renders one card per beer, confirmed first, each with its name, quotes, citations, check dates and status', () => {
    expect(cards.length).toBe(B.pours.length);
    const ordered = [...B.pours.filter((p) => p.confirmed2026), ...B.pours.filter((p) => !p.confirmed2026)];
    ordered.forEach((p, i) => {
      const c = cards[i];
      expect(c).toContain(escapeAttr(p.beer));
      expect(c).toContain(p.confirmed2026 ? '2026 release confirmed' : '2026 release not confirmed');
      for (const s of sourcesOf(p)) { expect(c).toContain(escapeAttr(s.quote)); expect(c).toContain(escapeAttr(s.url)); }
      expect(c).toContain('checked October 26, 2026');
    });
  });
  it('renders event evidence and the tradition quotes', () => {
    for (const ev of B.events) { expect(html).toContain(escapeAttr(ev.dateSource.quote)); expect(html).toContain(escapeAttr(ev.source.quote)); }
    for (const t of B.tradition) expect(html).toContain(escapeAttr(t.quote));
  });
  it('has one h1, a canonical URL and ItemList JSON-LD', () => {
    expect((html.match(/<h1[\s>]/g) || []).length).toBe(1);
    expect(html).toContain('https://brewerytrip.com/cleveland-beer-of-the-month');
    expect(html).toContain('"@type":"ItemList"');
  });
});
