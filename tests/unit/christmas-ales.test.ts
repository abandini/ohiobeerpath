import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CHRISTMAS_ALES, sourcesOf, confirmed2026 } from '../../src/data/christmas-ales';
import { christmasAlesPage } from '../../src/templates/christmas-ales';
import { escapeAttr } from '../../src/templates/utils';
import { sampleBlogPosts } from '../../src/templates/blog';
import pages from '../../src/routes/pages';

const G = CHRISTMAS_ALES;
const all = G.picks.flatMap(sourcesOf);
const host = (u: string) => new URL(u).hostname.replace(/^www\./, '');

// Structure only. Live verbatim checks are scripts/verify-christmas-ales.mjs.
describe('Christmas ales data (structure)', () => {
  it('every source has a quote, an https URL and the 2026-10-31 check date, and no social or roundup sources', () => {
    expect(all.length).toBeGreaterThan(0);
    for (const s of all) {
      expect(s.quote.length).toBeGreaterThan(6);
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.checked).toBe('2026-10-31');
      expect(s.url).not.toMatch(/facebook|reddit|nextdoor|instagram|untappd|beeradvocate|twitter|x\.com|cleveland19|wkyc|dispatch|news5|patch\.com|visittoledo/i);
    }
  });
  it('has 8 to 12 beers, the title count matches, and no brewery-and-beer pair repeats', () => {
    expect(G.picks.length).toBeGreaterThanOrEqual(8);
    expect(G.picks.length).toBeLessThanOrEqual(12);
    expect(G.title).toContain(`${G.picks.length} Holiday Beers`);
    expect(new Set(G.picks.map((p) => `${p.brewery}|${p.beer}`)).size).toBe(G.picks.length);
  });
  it("every beer's sources are on the brewery's own domain, one names the beer, and one calls it a holiday or Christmas beer", () => {
    for (const p of G.picks) {
      for (const s of sourcesOf(p)) expect(host(s.url), p.beer).toBe(p.site);
      expect(sourcesOf(p).some((s) => s.quote.toLowerCase().includes(p.beer.toLowerCase())), p.beer).toBe(true);
      expect([p.identity, p.about, p.specs].some((s) => s && /christmas|holiday/i.test(s.quote)), p.beer).toBe(true);
    }
  });
  it("each town appears in the brewery's own location quote", () => {
    for (const p of G.picks) expect(p.location.quote.toLowerCase(), p.beer).toContain(p.town.toLowerCase());
  });
  it('ABV values appear in the specs quote', () => {
    for (const p of G.picks) if (p.abv !== undefined) expect(p.specs?.quote, p.beer).toContain(`${p.abv % 1 ? p.abv : p.abv.toFixed(1)}%`);
  });
  it('2026 appears only in a release quote that prints 2026 and names the beer; no other quote is used as 2026 evidence', () => {
    for (const p of G.picks) {
      if (p.release2026) {
        expect(p.release2026.quote, p.beer).toMatch(/\b2026\b/);
        expect(p.release2026.quote.toLowerCase(), p.beer).toContain(p.beer.toLowerCase());
        expect(confirmed2026(p), p.beer).toBe(true);
      }
      for (const s of [p.identity, p.about, p.specs, p.availability, p.where, p.location]) if (s) expect(s.quote, p.beer).not.toMatch(/2026/);
    }
  });
  it('covers the state: Cleveland area, Akron, Toledo, Columbus, Dayton, Cincinnati and Athens', () => {
    for (const r of G.regions) expect(G.picks.some((p) => p.region === r), r).toBe(true);
    for (const p of G.picks) expect(G.regions).toContain(p.region);
  });
});

describe('Christmas ales page', () => {
  const html = christmasAlesPage();
  const cards = html.split('<div class="trail-stop" id="ale-').slice(1);
  const ordered = G.regions.flatMap((r) => G.picks.filter((p) => p.region === r));
  // Our own words: the page minus quotes, citations, scripts and the shared layout chrome outside the guide.
  const ours = html.slice(html.indexOf('<div class="trail-hero">'), html.indexOf('<script type="application/ld+json">'))
    .replace(/<blockquote[\s\S]*?<\/blockquote>/g, ' ').replace(/<[^>]+>/g, ' ');
  it('renders one card per beer, grouped by region, each with its quotes, citations, check date and brewery links', () => {
    expect(cards.length).toBe(G.picks.length);
    ordered.forEach((p, i) => {
      const c = cards[i];
      expect(c).toContain(escapeAttr(p.beer));
      for (const s of sourcesOf(p)) { expect(c).toContain(escapeAttr(s.quote)); expect(c).toContain(escapeAttr(s.url)); }
      expect(c).toContain('checked October 31, 2026');
      expect(c).toContain(`https://${p.site}/`);
      if (p.breweryId) expect(c).toContain(`href="/brewery/${p.breweryId}"`);
      expect(c.includes('2026 date, per the brewery'), p.beer).toBe(confirmed2026(p));
    });
  });
  it('is a guide, not a ranking, with the house recency wording and no unsourced superlatives', () => {
    expect(html).toContain('not a ranking');
    expect(html).toContain('as listed when we checked on October 31, 2026');
    expect(ours).not.toMatch(/\b(best|right now|latest|new|top)\b/i);
    expect(html).not.toMatch(/available in 2026|2026 release confirmed/i);
  });
  it('labels derived values as our calculation', () => {
    expect(html).toContain('ABV range (our calculation)');
    const abvs = G.picks.map((p) => p.abv).filter((a): a is number => a !== undefined);
    expect(html).toContain(`${Math.min(...abvs)}–${Math.max(...abvs)}%`);
    expect(html).toContain('the counts and ABV range are our calculation');
  });
  it('has one h1, a canonical URL, dateModified and Article, ItemList and BreadcrumbList JSON-LD', () => {
    expect((html.match(/<h1[\s>]/g) || []).length).toBe(1);
    expect(html).toContain('https://brewerytrip.com/blog/ohio-christmas-ales');
    expect(html).toContain(`"dateModified":"${G.dateModified}"`);
    for (const t of ['Article', 'ItemList', 'BreadcrumbList']) expect(html).toContain(`"@type":"${t}"`);
  });
});

describe('Christmas ales routes and listing', () => {
  const env = (rows: unknown[]) => ({
    DB: { prepare: () => ({ bind() { return this; }, all: async () => ({ results: rows }), first: async () => null }) },
  });
  const row = { id: 99, slug: G.slug, title: G.title, excerpt: G.excerpt, content: G.excerpt, category: 'Guides', published: 1, created_at: '2026-10-31T12:00:00.000Z' };
  it('serves the guide at /blog/ohio-christmas-ales, not the D1 row content', async () => {
    const r = await pages.request(`/blog/${G.slug}`, {}, env([row]));
    expect(r.status).toBe(200);
    expect(await r.text()).toContain('<div class="trail-stop" id="ale-1">');
  });
  it('lists the guide on /blog from its D1 row (and in the Guides category)', async () => {
    for (const path of ['/blog', '/blog?category=guides']) {
      const body = await (await pages.request(path, {}, env([row]))).text();
      expect(body, path).toContain(`/blog/${G.slug}`);
    }
  });
  it('the sample-post fallback lists the guide with the same title', () => {
    expect(sampleBlogPosts.find((p) => p.slug === G.slug)?.title).toBe(G.title);
  });
  it('the D1 migration inserts the same slug, title and excerpt', () => {
    const sql = readFileSync(new URL('../../migrations/0022_blog_ohio_christmas_ales.sql', import.meta.url), 'utf8');
    for (const v of [G.slug, G.title, G.excerpt]) expect(sql).toContain(`'${v}'`);
  });
});
