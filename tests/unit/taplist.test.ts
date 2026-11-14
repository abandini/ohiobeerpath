import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTapList, parseTapList, resetTapListCache, TAPLIST_CACHE_MS, TAPLIST_FAILURE_CACHE_MS, TAPLIST_TIMEOUT_MS, DEFAULT_TAPLIST_API_URL } from '../../src/services/taplist';
import { tapListSection, tapListDate } from '../../src/templates/taplist';
import { breweryPage } from '../../src/templates/brewery';
import type { Brewery, Env } from '../../src/types';

const NOW = Date.parse('2026-11-14T20:00:00Z');
const API = 'https://beerthirty-intake.bill-burkey.workers.dev';
const SOURCE = "From a photo of the brewery's board, texted by the brewery";
const answer = (over: Record<string, unknown> = {}) => ({
  brewery_key: '2312',
  updated_at: '2026-11-14T18:05:00.000Z',
  stale: false,
  stale_after_days: 21,
  source: SOURCE,
  beers: [
    { name: 'Medina Lite', style: 'Pilsner', abv: 4.5, notes: null },
    { name: 'Watermelon Sugar High', style: 'Seltzer', abv: 4.2, notes: 'seltzer' },
    { name: 'Taiheke-Tekai', style: 'New England IPA', abv: 6, notes: null },
    { name: 'House Root Beer', style: null, abv: null, notes: 'non-alcoholic' },
  ],
  ...over,
});
const index = (keys = ['2312']) => ({ stale_after_days: 21, taplists: keys.map((k) => ({ brewery_key: k, updated_at: '2026-11-14T18:05:00.000Z', stale: false })) });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const env = (over: Partial<Env> = {}) => ({ ...over }) as unknown as Env;

const brewery: Brewery = {
  id: 2312, name: 'Test Brewing Co.', brewery_type: 'micro', city: 'Medina', state: 'OH', region: 'Northeast',
  amenities: [], hours: {},
};

/** Stub global fetch with a routing table; returns the list of requested URLs. */
function stubFetch(routes: Record<string, () => Response | Promise<Response>>) {
  const urls: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);
    const handler = routes[url];
    if (!handler) throw new Error(`unexpected request to ${url}`);
    return handler();
  }));
  return urls;
}

beforeEach(() => resetTapListCache());
afterEach(() => vi.unstubAllGlobals());

describe('tap list: fetching from the intake API', () => {
  it('uses the default intake URL, asks only that host, and returns the checked list', async () => {
    expect(DEFAULT_TAPLIST_API_URL).toBe(API);
    const urls = stubFetch({ [`${API}/api/taplists`]: () => json(index()), [`${API}/api/taplist/2312`]: () => json(answer()) });
    const list = await getTapList(env(), 2312, NOW);
    expect(list).toEqual({
      beers: answer().beers,
      updatedAt: '2026-11-14T18:05:00.000Z',
      stale: false,
      source: SOURCE,
    });
    expect(urls).toEqual([`${API}/api/taplists`, `${API}/api/taplist/2312`]);
  });

  it('takes the base URL from TAPLIST_API_URL and refuses a non-https one', async () => {
    const urls = stubFetch({ 'https://intake.example/api/taplists': () => json(index()), 'https://intake.example/api/taplist/2312': () => json(answer()) });
    expect(await getTapList(env({ TAPLIST_API_URL: 'https://intake.example/' }), 2312, NOW)).not.toBeNull();
    expect(urls[0]).toBe('https://intake.example/api/taplists');
    resetTapListCache();
    const none = stubFetch({});
    expect(await getTapList(env({ TAPLIST_API_URL: 'http://intake.example' }), 2312, NOW)).toBeNull();
    expect(await getTapList(env({ TAPLIST_API_URL: 'not a url' }), 2312, NOW + TAPLIST_FAILURE_CACHE_MS + 1)).toBeNull();
    expect(none).toEqual([]);
  });

  it('makes no per-brewery request for a brewery that is not in the index, and reuses the index', async () => {
    const urls = stubFetch({ [`${API}/api/taplists`]: () => json(index()) });
    for (const id of [1, 2, 3, 99]) expect(await getTapList(env(), id, NOW)).toBeNull();
    expect(urls).toEqual([`${API}/api/taplists`]);
  });

  it('caches a list for five minutes, then asks again', async () => {
    const urls = stubFetch({ [`${API}/api/taplists`]: () => json(index()), [`${API}/api/taplist/2312`]: () => json(answer()) });
    await getTapList(env(), 2312, NOW);
    await getTapList(env(), 2312, NOW + TAPLIST_CACHE_MS - 1);
    expect(urls.length).toBe(2);
    await getTapList(env(), 2312, NOW + TAPLIST_CACHE_MS + 1);
    expect(urls.length).toBe(4);
  });

  it('a list that was taken down (404, or gone from the index) stops showing', async () => {
    let listed = true;
    stubFetch({
      [`${API}/api/taplists`]: () => json(index(listed ? ['2312'] : [])),
      [`${API}/api/taplist/2312`]: () => (listed ? json(answer()) : json({ error: 'no current tap list' }, 404)),
    });
    expect(await getTapList(env(), 2312, NOW)).not.toBeNull();
    listed = false;
    expect(await getTapList(env(), 2312, NOW + TAPLIST_CACHE_MS + 1)).toBeNull();
  });

  it('fails silently to "no list" on an error, a timeout, a redirect, bad JSON or a wrong shape, and backs off for a minute', async () => {
    const failures: Array<() => Response | Promise<Response>> = [
      () => { throw new TypeError('fetch failed'); },
      () => { throw new DOMException('The operation timed out', 'TimeoutError'); },
      () => json({ error: 'boom' }, 500),
      () => new Response(null, { status: 302, headers: { location: 'https://evil.example/' } }),
      () => new Response('<html>not json</html>', { status: 200 }),
      () => json({ taplists: 'nope' }),
      () => json(null),
    ];
    for (const fail of failures) {
      resetTapListCache();
      const urls = stubFetch({ [`${API}/api/taplists`]: fail });
      expect(await getTapList(env(), 2312, NOW)).toBeNull();
      expect(await getTapList(env(), 2313, NOW + 1000)).toBeNull();
      expect(urls.length).toBe(1); // the second page view did not wait on the intake again
      await getTapList(env(), 2312, NOW + TAPLIST_FAILURE_CACHE_MS + 1);
      expect(urls.length).toBe(2);
    }
    // Index fine, the list itself failing.
    for (const fail of failures) {
      resetTapListCache();
      const urls = stubFetch({ [`${API}/api/taplists`]: () => json(index()), [`${API}/api/taplist/2312`]: fail });
      expect(await getTapList(env(), 2312, NOW)).toBeNull();
      expect(await getTapList(env(), 2312, NOW + 1000)).toBeNull();
      expect(urls.length).toBe(2);
    }
  });

  it('sets a short timeout and does not follow redirects', async () => {
    const spy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => json(index([])));
    vi.stubGlobal('fetch', spy);
    await getTapList(env(), 2312, NOW);
    const init = spy.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.redirect).toBe('manual');
    expect(init.method).toBe('GET');
    expect(TAPLIST_TIMEOUT_MS).toBeLessThanOrEqual(1500);
  });

  it('a hung intake API costs the page at most the timeout', async () => {
    vi.stubGlobal('fetch', (_input: RequestInfo | URL, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('timed out', 'TimeoutError')));
    }));
    const started = Date.now();
    expect(await getTapList(env(), 2312)).toBeNull();
    expect(Date.now() - started).toBeLessThan(TAPLIST_TIMEOUT_MS + 400);
  });

  it('uses the service binding when one is configured', async () => {
    const urls = stubFetch({});
    const binding = { fetch: vi.fn(async (url: string) => (url.endsWith('/api/taplists') ? json(index()) : json(answer()))) };
    expect(await getTapList(env({ TAPLIST_API: binding as unknown as Fetcher }), 2312, NOW)).not.toBeNull();
    expect(binding.fetch).toHaveBeenCalledTimes(2);
    expect(urls).toEqual([]);
  });

  it('never throws, whatever the id', async () => {
    stubFetch({});
    for (const id of [0, -1, 1.5, NaN, Infinity]) expect(await getTapList(env(), id as number, NOW)).toBeNull();
  });
});

describe('tap list: the answer is untrusted', () => {
  it('keeps only the tap list fields, caps counts and lengths, and drops bad items', () => {
    const list = parseTapList(answer({
      phone: '+12165550123',
      beers: [
        { name: '  Good\u0000 Beer‮ ', style: 'x'.repeat(300), abv: 5.256, notes: 'n'.repeat(300), photo: '/photo/1.jpg' },
        { name: 42, style: 'no name' },
        { name: 'Strong', style: 7, abv: 400, notes: {} },
        { name: 'Texty', abv: '5.0' },
        'junk', null,
        ...Array.from({ length: 100 }, (_, i) => ({ name: `Beer ${i}` })),
      ],
    }), NOW)!;
    expect(list.beers.length).toBe(57); // 60 items considered, 3 of them unusable
    expect(Object.keys(list.beers[0])).toEqual(['name', 'style', 'abv', 'notes']);
    expect(list.beers[0]).toEqual({ name: 'Good Beer', style: 'x'.repeat(80), abv: 5.26, notes: 'n'.repeat(120) });
    expect(list.beers[1]).toEqual({ name: 'Strong', style: null, abv: null, notes: null });
    expect(list.beers[2].abv).toBeNull();
    expect(JSON.stringify(list)).not.toContain('5550123');
  });

  it('returns null for anything that is not a usable list', () => {
    for (const bad of [null, 'x', 7, [], {}, answer({ beers: [] }), answer({ beers: 'x' }), answer({ beers: [{ name: '' }] }),
      answer({ updated_at: 'yesterday' }), answer({ updated_at: 5 }), answer({ updated_at: '2031-01-01T00:00:00Z' })]) {
      expect(parseTapList(bad, NOW)).toBeNull();
    }
  });

  it('marks a list stale when the intake says so or when our own clock says so', () => {
    expect(parseTapList(answer(), NOW)!.stale).toBe(false);
    expect(parseTapList(answer({ stale: true }), NOW)!.stale).toBe(true);
    expect(parseTapList(answer({ updated_at: '2026-10-20T12:00:00Z' }), NOW)!.stale).toBe(true); // 25 days old
    expect(parseTapList(answer({ updated_at: '2026-10-20T12:00:00Z', stale_after_days: 30 }), NOW)!.stale).toBe(false);
    expect(parseTapList(answer({ updated_at: '2026-10-20T12:00:00Z', stale_after_days: 'x' }), NOW)!.stale).toBe(true);
  });
});

describe('tap list: the "On tap" section', () => {
  const list = parseTapList(answer(), NOW)!;

  it('shows each beer with style and strength, the date in words and the source line', () => {
    const html = tapListSection(list);
    expect(html).toContain('<section class="content-card brewery-taplist" aria-labelledby="on-tap-heading">');
    expect(html).toMatch(/<h2 id="on-tap-heading">.*On tap<\/h2>/);
    expect(html).toContain('<p class="taplist-date">Updated <time datetime="2026-11-14T18:05:00.000Z">November 14, 2026</time>.</p>');
    expect(html).toContain('<span class="taplist-name">Medina Lite</span><span class="taplist-style">Pilsner</span></span><span class="taplist-abv">4.5% ABV</span>');
    expect(html).toContain('<span class="taplist-abv">6% ABV</span>');
    // A note that only repeats the style is not shown twice; a beer with no strength shows none.
    expect(html.match(/seltzer/gi)!.length).toBe(1);
    expect(html).toContain('<span class="taplist-name">House Root Beer</span><span class="taplist-style">non-alcoholic</span></span></li>');
    expect(html.match(/<li>/g)!.length).toBe(4);
    expect(html).toContain('From a photo of the brewery&#39;s board, texted by the brewery. Beers change, so check with the brewery before you go.');
    expect(html).not.toContain('This list may have changed');
    // No freshness claim beyond the date.
    expect(html).not.toMatch(/live|real-time|right now|today|current/i);
  });

  it('a stale list leads with the date and says it may have changed', () => {
    const html = tapListSection({ ...list, stale: true, updatedAt: '2026-10-01T16:00:00.000Z' });
    expect(html).toContain('<p class="taplist-date taplist-stale"><strong>Last updated <time datetime="2026-10-01T16:00:00.000Z">October 1, 2026</time>.</strong> This list may have changed since then.</p>');
    expect(html.indexOf('Last updated')).toBeLessThan(html.indexOf('<ul class="taplist">'));
  });

  it('renders nothing at all when there is no list', () => {
    for (const none of [null, undefined, { ...list, beers: [] }, { ...list, updatedAt: 'nonsense' }]) expect(tapListSection(none as never)).toBe('');
  });

  it('uses the Eastern date, not the UTC one', () => {
    expect(tapListDate('2026-11-15T02:30:00.000Z')).toBe('November 14, 2026');
  });

  it('escapes everything', () => {
    const evil = '<script>alert(1)</script>"><img src=x onerror=alert(2)>';
    const html = tapListSection({ beers: [{ name: evil, style: evil, abv: 5, notes: `${evil}!` }], updatedAt: '2026-11-14T18:05:00.000Z', stale: false, source: evil });
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('<img src=x');
    expect(html.match(/&lt;script&gt;alert\(1\)&lt;\/script&gt;/g)!.length).toBe(4);
  });
});

describe('tap list: on the brewery page', () => {
  const list = parseTapList(answer(), NOW)!;

  it('adds the section after the About card when a list exists', () => {
    const html = breweryPage(brewery, undefined, [], [], list);
    expect(html).toContain('On tap</h2>');
    expect(html.indexOf('About Test Brewing Co.')).toBeLessThan(html.indexOf('id="on-tap-heading"'));
    expect(html.indexOf('id="on-tap-heading"')).toBeLessThan(html.indexOf('Hours of Operation'));
  });

  it('leaves the page exactly as it was when there is none', () => {
    const before = breweryPage(brewery, undefined, [], []);
    expect(breweryPage(brewery, undefined, [], [], null)).toBe(before);
    expect(before).not.toContain('On tap');
    expect(before).not.toContain('taplist');
  });

  it('does not show a tap list on a closed brewery', () => {
    expect(breweryPage({ ...brewery, closed_at: '2026-01-01' } as Brewery, undefined, [], [], list)).not.toContain('On tap');
  });

  it('adds nothing to the structured data', () => {
    const ld = (html: string) => html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g)!.join('');
    expect(ld(breweryPage(brewery, undefined, [], [], list))).toBe(ld(breweryPage(brewery, undefined, [], [])));
  });
});
