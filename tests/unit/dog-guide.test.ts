import { describe, it, expect } from 'vitest';
import { DOG_GUIDE, sourcesOf } from '../../src/data/dog-guide';
import { dogGuidePage, AREA_EVIDENCE, AREA_LABEL, mentionsOutdoor, hasLeashRule } from '../../src/templates/dog-guide';
import { escapeAttr } from '../../src/templates/utils';
import { sampleBlogPosts } from '../../src/templates/blog';
import pages from '../../src/routes/pages';

const G = DOG_GUIDE;
const all = G.picks.flatMap(sourcesOf);
const host = (u: string) => new URL(u).hostname.replace(/^www\./, '');

// Structure only. Live verbatim checks are scripts/verify-dog-guide.mjs.
describe('dog guide data (structure)', () => {
  it('every source has a quote, an https URL and the 2026-10-31 check date, and no banned sources', () => {
    expect(all.length).toBeGreaterThan(0);
    for (const s of all) {
      expect(s.quote.length).toBeGreaterThan(6);
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.checked).toBe('2026-10-31');
      expect(s.url).not.toMatch(/facebook|reddit|nextdoor|instagram|untappd|bringfido|yelp|beeradvocate|twitter|x\.com/i);
    }
  });
  it('the title count matches the number of picks, with no repeated brewery or directory id', () => {
    expect(G.title).toContain(`${G.picks.length} Dog-Friendly`);
    expect(new Set(G.picks.map((p) => p.brewery)).size).toBe(G.picks.length);
    expect(new Set(G.picks.map((p) => p.breweryId)).size).toBe(G.picks.length);
  });
  it("every brewery's sources are on its own domain and its policy quote names dogs or pets", () => {
    for (const p of G.picks) {
      for (const s of sourcesOf(p)) expect(host(s.url), p.brewery).toBe(p.site);
      expect(p.policy.quote, p.brewery).toMatch(/\bdogs?\b|\bpets?\b|pet[- ]friendly|dog[- ]friendly/i);
    }
  });
  it("each town appears in the brewery's own location quote", () => {
    for (const p of G.picks) expect(p.location.quote.toLowerCase(), p.brewery).toContain(p.town.toLowerCase());
  });
  it('the area tag is backed by the wording of the policy or a rule', () => {
    for (const p of G.picks) {
      expect([p.policy, ...(p.rules || [])].some((s) => AREA_EVIDENCE[p.area].test(s.quote)), p.brewery).toBe(true);
    }
  });
  it('covers the state: every region has a pick and every pick has a listed region', () => {
    for (const r of G.regions) expect(G.picks.some((p) => p.region === r), r).toBe(true);
    for (const p of G.picks) expect(G.regions).toContain(p.region);
  });
});

describe('dog guide page', () => {
  const html = dogGuidePage();
  const cards = html.split('<div class="trail-stop" id="dog-').slice(1);
  const ordered = G.regions.flatMap((r) => G.picks.filter((p) => p.region === r));
  it('renders one card per brewery, grouped by region, with quotes, citations, check date, area tag and directory link', () => {
    expect(cards.length).toBe(G.picks.length);
    ordered.forEach((p, i) => {
      const c = cards[i];
      expect(c).toContain(escapeAttr(p.brewery));
      for (const s of sourcesOf(p)) { expect(c).toContain(escapeAttr(s.quote)); expect(c).toContain(escapeAttr(s.url)); }
      expect(c).toContain('checked October 31, 2026');
      expect(c).toContain(`href="/brewery/${p.breweryId}"`);
      expect(c).toContain(escapeAttr(AREA_LABEL[p.area]));
    });
  });
  it('drops the old unsourced claims, makes no ranking, and tells readers to check before going', () => {
    for (const bad of ['Bookhouse', 'dog water bowls provided', 'often hosts dog-themed events', 'Here are our favorites', 'right now', 'latest']) expect(html).not.toContain(bad);
    expect(html).toContain('not a ranking');
    expect(html).toContain('as posted when we checked on October 31, 2026');
    expect(html).toContain('check with the brewery before you go');
  });
  it('labels counts as our calculation', () => {
    expect(html).toContain('Towns (our calculation)');
    expect(html).not.toContain('Outdoor areas only');
    expect(html).toContain(`${G.picks.filter(mentionsOutdoor).length}</div><div class="trail-stat-label">Mention outdoor access (our calculation)`);
    expect(html).toContain(`${G.picks.filter(hasLeashRule).length}</div><div class="trail-stat-label">Post a leash rule (our calculation)`);
  });
  it('in the rendered HTML, every quote cites its exact URL and every brewery name links to /brewery/:id (href counts)', () => {
    for (const p of G.picks) {
      // The brewery name is the card heading link, and the only href to its directory page.
      expect(html, p.brewery).toContain(`<h3 class="h4"><a href="/brewery/${p.breweryId}" class="text-dark">${escapeAttr(p.brewery)}</a></h3>`);
      expect(html.split(`href="/brewery/${p.breweryId}"`).length - 1, p.brewery).toBe(1);
      for (const s of sourcesOf(p)) {
        expect(html, s.quote).toContain(`“${escapeAttr(s.quote)}”</blockquote><div class="small text-muted mb-2"><a href="${escapeAttr(s.url)}" rel="noopener" target="_blank">`);
      }
    }
    // Each source URL is linked exactly as many times as it is cited (plus once more when it is also the card's
    // home-page link, https://<site>/).
    const cites = new Map<string, number>();
    for (const s of all) cites.set(s.url, (cites.get(s.url) || 0) + 1);
    const homes = new Set(G.picks.map((p) => `https://${p.site}/`));
    for (const [url, n] of cites) expect(html.split(`href="${escapeAttr(url)}"`).length - 1, url).toBe(n + (homes.has(url) ? 1 : 0));
    expect((html.match(/<blockquote /g) || []).length).toBe(all.length);
  });
  it('excludes Little Miami (service-animal wording) and includes MadTree Oakley', () => {
    expect(html).not.toContain('Little Miami');
    expect(G.picks.find((p) => p.site === 'madtree.com')?.breweryId).toBe(2382);
  });
  it('links HappyGotchaDays once, with rel="nofollow noopener"', () => {
    const links = html.match(/<a [^>]*href="https:\/\/happygotchadays\.com\/"[^>]*>/g) || [];
    expect(links.length).toBe(1);
    expect(links[0]).toContain('rel="nofollow noopener"');
    expect(html).toContain('Celebrating your dog’s adoption anniversary?');
  });
  it('has one h1, a canonical URL, dateModified and Article, ItemList and BreadcrumbList JSON-LD', () => {
    expect((html.match(/<h1[\s>]/g) || []).length).toBe(1);
    expect(html).toContain('https://brewerytrip.com/blog/dog-friendly-ohio-breweries');
    expect(html).toContain(`"dateModified":"2026-10-31"`);
    expect(html).toContain(`"datePublished":"2026-06-02T12:00:00.000Z"`);
    for (const t of ['Article', 'ItemList', 'BreadcrumbList']) expect(html).toContain(`"@type":"${t}"`);
  });
});

describe('dog guide routes', () => {
  const env = (rows: unknown[]) => ({
    DB: { prepare: () => ({ bind() { return this; }, all: async () => ({ results: rows }), first: async () => null }) },
  });
  const oldRow = { id: 20, slug: G.slug, title: G.title, excerpt: 'Bring your four-legged friend along for brewery hopping at these pet-friendly Ohio spots.', content: 'old', category: 'Guides', published: 1, created_at: '2026-06-02T12:00:00.000Z' };
  it('serves the guide at the same URL, not the D1 row content', async () => {
    const r = await pages.request(`/blog/${G.slug}`, {}, env([]));
    expect(r.status).toBe(200);
    const body = await r.text();
    expect(body).toContain(escapeAttr(G.title));
    expect(body).toContain('id="dog-1"');
  });
  it('lists the D1 row with the guide excerpt on /blog (and in its category)', async () => {
    for (const path of ['/blog', '/blog?category=guides']) {
      const body = await (await pages.request(path, {}, env([oldRow]))).text();
      expect(body, path).toContain(`/blog/${G.slug}`);
      expect(body, path).not.toContain('brewery hopping at these pet-friendly Ohio spots');
    }
  });
  it('the sample-post fallback lists the guide with its title and no old body', () => {
    const s = sampleBlogPosts.find((p) => p.slug === G.slug);
    expect(s?.title).toBe(G.title);
    expect(s?.content).not.toContain('Bookhouse');
  });
});
