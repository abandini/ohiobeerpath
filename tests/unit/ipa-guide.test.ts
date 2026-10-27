import { describe, it, expect } from 'vitest';
import { IPA_GUIDE, sourcesOf } from '../../src/data/ipa-guide';
import { ipaGuidePage, isYearRound } from '../../src/templates/ipa-guide';
import { escapeAttr } from '../../src/templates/utils';
import { sampleBlogPosts } from '../../src/templates/blog';
import pages from '../../src/routes/pages';

const G = IPA_GUIDE;
const all = G.picks.flatMap(sourcesOf);
const host = (u: string) => new URL(u).hostname.replace(/^www\./, '');

// Structure only. Live verbatim checks are scripts/verify-ipa-guide.mjs.
describe('IPA guide data (structure)', () => {
  it('every source has a quote, an https URL and a check date, and no social sources', () => {
    expect(all.length).toBeGreaterThan(0);
    for (const s of all) {
      expect(s.quote.length).toBeGreaterThan(6);
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.url).not.toMatch(/facebook|reddit|nextdoor|instagram|untappd|beeradvocate|twitter|x\.com/i);
    }
  });
  it('the title count matches the number of picks, with no repeated beer', () => {
    expect(G.title).toContain(`${G.picks.length} IPAs`);
    expect(new Set(G.picks.map((p) => p.beer)).size).toBe(G.picks.length);
  });
  it("every beer's sources are on the brewery's own domain, one names the beer, and one says it is an IPA", () => {
    for (const p of G.picks) {
      for (const s of sourcesOf(p)) expect(host(s.url), p.beer).toBe(p.site);
      expect(sourcesOf(p).some((s) => s.quote.toLowerCase().includes(p.beer.toLowerCase())), p.beer).toBe(true);
      expect(sourcesOf(p).some((s) => /\bI\.?P\.?A\b|India Pale Ale/i.test(s.quote)), p.beer).toBe(true);
    }
  });
  it("each town appears in the brewery's own location quote", () => {
    for (const p of G.picks) expect(p.location.quote.toLowerCase(), p.beer).toContain(p.town.toLowerCase());
  });
  it('ABV values appear in a quote; tags only claim what a quote says', () => {
    for (const p of G.picks) {
      if (p.abv !== undefined) expect([p.specs, p.about].some((s) => s?.quote.includes(String(p.abv))), p.beer).toBe(true);
      if (p.flagship) expect(p.flagship.quote, p.beer).toMatch(/flagship/i);
      if (p.award) expect(p.award.quote, p.beer).toMatch(/medal|award|winner/i);
    }
  });
  it('no quote is used as 2026 evidence: the only 2026 text is in a source URL, never a claim', () => {
    // The page makes no 2026-availability claim; if a future quote prints 2026, add a confirmed flag and test it.
    for (const s of all) expect(s.quote).not.toMatch(/2026/);
    expect(ipaGuidePage()).not.toMatch(/2026 release confirmed|available in 2026/i);
  });
  it('covers the state: Cleveland, Columbus, Cincinnati, Akron, Dayton and Toledo areas', () => {
    for (const r of G.regions) expect(G.picks.some((p) => p.region === r), r).toBe(true);
    for (const p of G.picks) expect(G.regions).toContain(p.region);
  });
});

describe('IPA guide page', () => {
  const html = ipaGuidePage();
  const cards = html.split('<div class="trail-stop" id="ipa-').slice(1);
  const ordered = G.regions.flatMap((r) => G.picks.filter((p) => p.region === r));
  it('renders one card per beer, grouped by region, each with its quotes, citations, check date and brewery links', () => {
    expect(cards.length).toBe(G.picks.length);
    ordered.forEach((p, i) => {
      const c = cards[i];
      expect(c).toContain(escapeAttr(p.beer));
      for (const s of sourcesOf(p)) { expect(c).toContain(escapeAttr(s.quote)); expect(c).toContain(escapeAttr(s.url)); }
      expect(c).toContain('checked October 27, 2026');
      expect(c).toContain(`https://${p.site}/`);
      if (p.breweryId) expect(c).toContain(`href="/brewery/${p.breweryId}"`);
      expect(c.includes('Year-round, per the brewery'), p.beer).toBe(isYearRound(p));
      expect(c.includes('Flagship, in the brewery’s words'), p.beer).toBe(!!p.flagship);
      expect(c.includes('Award listed by the brewery'), p.beer).toBe(!!p.award);
    });
  });
  it('drops the old unsourced claims and makes no ranking or 2026-release claim', () => {
    for (const bad of ['Local brewer', 'Great Lakes water', 'won numerous awards', 'Pacific Northwest', '2024', 'Best Ohio Breweries']) expect(html).not.toContain(bad);
    expect(html).toContain('not a ranking');
    expect(html).not.toMatch(/2026 release confirmed|available in 2026/i);
  });
  it('labels derived values as our calculation', () => {
    expect(html).toContain('ABV range (our calculation)');
    const abvs = G.picks.map((p) => p.abv).filter((a): a is number => a !== undefined);
    expect(html).toContain(`${Math.min(...abvs)}–${Math.max(...abvs)}%`);
  });
  it('has one h1, a canonical URL, dateModified and Article, ItemList and BreadcrumbList JSON-LD', () => {
    expect((html.match(/<h1[\s>]/g) || []).length).toBe(1);
    expect(html).toContain('https://brewerytrip.com/blog/ohio-ipa-breweries');
    expect(html).toContain(`"dateModified":"${G.dateModified}"`);
    for (const t of ['Article', 'ItemList', 'BreadcrumbList']) expect(html).toContain(`"@type":"${t}"`);
  });
});

describe('IPA guide routes', () => {
  const env = (rows: unknown[]) => ({
    DB: { prepare: () => ({ bind() { return this; }, all: async () => ({ results: rows }), first: async () => null }) },
  });
  const oldRow = { id: 17, slug: G.oldSlug, title: 'The 10 Best Ohio Breweries for IPA Lovers in 2024', excerpt: 'old', content: 'old', category: 'Guides', published: 1, created_at: '2026-06-05T12:00:00.000Z' };
  it('301s the old 2024 URL to the new slug', async () => {
    const r = await pages.request(`/blog/${G.oldSlug}`, {}, env([]));
    expect(r.status).toBe(301);
    expect(r.headers.get('location')).toBe(`/blog/${G.slug}`);
  });
  it('serves the guide at the new slug', async () => {
    const r = await pages.request(`/blog/${G.slug}`, {}, env([]));
    expect(r.status).toBe(200);
    expect(await r.text()).toContain(escapeAttr(G.title));
  });
  it('lists the old D1 row under the new slug and title on /blog (and in its category)', async () => {
    for (const path of ['/blog', '/blog?category=guides']) {
      const body = await (await pages.request(path, {}, env([oldRow]))).text();
      expect(body, path).toContain(`/blog/${G.slug}`);
      expect(body, path).not.toContain(G.oldSlug);
      expect(body, path).not.toContain('IPA Lovers in 2024');
    }
  });
  it('the sample-post fallback lists the guide, not the old post', () => {
    expect(sampleBlogPosts.some((p) => p.slug === G.oldSlug)).toBe(false);
    expect(sampleBlogPosts.find((p) => p.slug === G.slug)?.title).toBe(G.title);
  });
});
