import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Brewery, Env } from '../../src/types';

// The discovery file's official JSON Schema, copied unchanged from the protocol's implementation kit
// (https://personalagentprotocol.org/kit/implement-personal-agent-protocol.zip, schemas/poppy.schema.json, version 1.0).
const POPPY_SCHEMA = JSON.parse(readFileSync(resolve(__dirname, '../fixtures/poppy.schema.json'), 'utf8'));

const open = (over: Partial<Brewery> & { id: number; name: string; city: string }): Brewery => ({
  brewery_type: 'micro', street: '1 Main St', state: 'OH', postal_code: '44256', region: 'Northeast', latitude: 41.1, longitude: -81.8,
  phone: '3305550100', website_url: 'https://example-brewery.test', amenities: ['patio'], hours: { friday: '3-10' },
  description: 'LEGACY GENERATED COPY', visit_notes: [{ date: '2026-10-17', text: 'INTERNAL NOTE' }], photos: [{ url: '/images/x.jpg', alt: 'x' }],
  created_at: '2025-01-01', updated_at: '2026-11-01', about_quote: 'We brew beer.', about_source_url: 'https://example-brewery.test/about', about_checked_at: '2026-10-01',
  ...over,
});
const ROWS: Brewery[] = [
  ...Array.from({ length: 70 }, (_, i) => open({ id: 100 + i, name: `Akron Brewing ${i}`, city: 'Akron' })),
  open({ id: 2312, name: 'Test Brewing Co.', city: 'Medina' }),
  open({ id: 9, name: 'Closed Brewing', city: 'Medina', closed_at: '2026-05-01' }),
];
const calls: string[] = [];

vi.mock('../../src/db/breweries', () => {
  const live = () => ROWS.filter((b) => !b.closed_at);
  const byState = (rows: Brewery[], f?: { stateAbbreviation?: string | null; isMultiState?: boolean }) =>
    f && f.stateAbbreviation && !f.isMultiState ? rows.filter((b) => b.state === f.stateAbbreviation) : rows;
  return {
    parseVisitNotes: () => [],
    getAllBreweries: async (_e: Env, f?: any) => { calls.push('all'); return byState(live(), f); },
    getBreweriesByRegion: async () => [],
    getBreweriesByCity: async (_e: Env, city: string, f?: any) => { calls.push(`city:${city}`); return byState(live().filter((b) => b.city.includes(city)), f); },
    searchBreweries: async (_e: Env, q: string, f?: any) => { calls.push(`search:${q}`); return byState(live().filter((b) => b.name.includes(q) || b.city.includes(q)), f).slice(0, 100); },
    getNearbyBreweries: async (_e: Env, lat: number, lng: number, radius: number, f?: any) => { calls.push(`near:${lat},${lng},${radius}`); return byState(live(), f).slice(0, 50).map((b, i) => ({ ...b, distance: 1.26 + i })); },
    getBreweryById: async (_e: Env, id: number) => ROWS.find((b) => b.id === id) ?? null,
    getBreweryCountByState: async () => ({}),
  };
});

import worker from '../../src/index';
import { resetTapListCache } from '../../src/services/taplist';
import { AGENT_LIMITS } from '../../src/routes/agent';

const SITE = 'https://brewerytrip.com';
const INTAKE = 'https://beerthirty-intake.bill-burkey.workers.dev';
const SOURCE = "From a photo of the brewery's board, texted by the brewery";
const NOW_ISO = new Date(Date.now() - 3600_000).toISOString();
const OLD_ISO = new Date(Date.now() - 40 * 86_400_000).toISOString();

type Intake = Record<string, () => Response>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const indexOf = (keys: string[], updated = NOW_ISO) => ({ stale_after_days: 21, taplists: keys.map((k) => ({ brewery_key: k, updated_at: updated, stale: false })) });
const listOf = (updated = NOW_ISO) => ({
  brewery_key: '2312', updated_at: updated, stale: false, stale_after_days: 21, source: SOURCE,
  beers: [{ name: 'Medina Lite', style: 'Pilsner', abv: 4.5, notes: null }, { name: 'House Root Beer', style: null, abv: null, notes: 'non-alcoholic' }],
});

function makeEnv(intake: Intake) {
  const asked: string[] = [];
  const CACHE = { get: vi.fn(async () => null), put: vi.fn(async () => undefined) };
  const env = {
    CACHE,
    SESSIONS: { get: vi.fn(async () => null) },
    IMAGES: { get: vi.fn(async () => null) },
    ENVIRONMENT: 'test',
    TAPLIST_API: { fetch: vi.fn(async (url: string) => { asked.push(String(url)); const h = intake[String(url)]; if (!h) throw new Error('intake down'); return h(); }) },
  } as unknown as Env;
  return { env, asked, CACHE };
}
const ZERO: Intake = { [`${INTAKE}/api/taplists`]: () => json(indexOf([])) };
const ONE: Intake = { [`${INTAKE}/api/taplists`]: () => json(indexOf(['2312'])), [`${INTAKE}/api/taplist/2312`]: () => json(listOf()) };

const get = (path: string, env: Env, init: { host?: string; headers?: Record<string, string>; method?: string } = {}) =>
  worker.fetch(new Request(`https://${init.host ?? 'brewerytrip.com'}${path}`, { method: init.method ?? 'GET', headers: { host: init.host ?? 'brewerytrip.com', ...(init.headers ?? {}) } }), env, {} as any);

beforeEach(() => { resetTapListCache(); calls.length = 0; vi.unstubAllGlobals(); vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('no outside request is expected'); })); });

// A JSON Schema checker for the keywords the official schema uses. Returns the list of problems.
function check(schema: any, value: any, root: any = schema, at = ''): string[] {
  if (schema.$ref) return check(schema.$ref.slice(2).split('/').reduce((n: any, k: string) => n[k], root), value, root, at);
  const out: string[] = [];
  const typeOf = (v: any) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
  if (schema.type) {
    const types = ([] as string[]).concat(schema.type);
    if (!types.includes(typeOf(value)) && !(types.includes('number') && typeOf(value) === 'integer')) out.push(`${at}: type ${typeOf(value)}, want ${types}`);
  }
  if (schema.enum && !schema.enum.includes(value)) out.push(`${at}: not in enum`);
  if ('const' in schema && schema.const !== value) out.push(`${at}: not const`);
  if (typeof value === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) out.push(`${at}: pattern ${schema.pattern}`);
    if (schema.minLength && value.length < schema.minLength) out.push(`${at}: too short`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems && value.length < schema.minItems) out.push(`${at}: too few items`);
    if (schema.items) value.forEach((v, i) => out.push(...check(schema.items, v, root, `${at}/${i}`)));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const k of schema.required ?? []) if (!(k in value)) out.push(`${at}: missing ${k}`);
    for (const [k, v] of Object.entries(value)) {
      if (schema.propertyNames?.pattern && !new RegExp(schema.propertyNames.pattern).test(k)) out.push(`${at}: property name ${k}`);
      if (schema.properties?.[k]) out.push(...check(schema.properties[k], v, root, `${at}/${k}`));
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') out.push(...check(schema.additionalProperties, v, root, `${at}/${k}`));
    }
  }
  for (const s of schema.allOf ?? []) out.push(...check(s, value, root, at));
  if (schema.anyOf && !schema.anyOf.some((s: any) => check(s, value, root, at).length === 0)) out.push(`${at}: matches none of anyOf`);
  if (schema.not && check(schema.not, value, root, at).length === 0) out.push(`${at}: matches "not"`);
  if (schema.if && check(schema.if, value, root, at).length === 0 && schema.then) out.push(...check(schema.then, value, root, at));
  return out;
}

describe('schema checker used below', () => {
  it('accepts the specification\'s own example and rejects broken documents', () => {
    const example = { protocol_version: '1.0', organization: { name: 'Example Company', domain: 'example.com' }, apis: [{ type: 'openapi', url: 'https://api.example.com/openapi.json', description: 'Orders' }] };
    expect(check(POPPY_SCHEMA, example)).toEqual([]);
    expect(check(POPPY_SCHEMA, { ...example, protocol_version: 1 })).not.toEqual([]);
    expect(check(POPPY_SCHEMA, { ...example, organization: { name: 'x' } })).not.toEqual([]);
    expect(check(POPPY_SCHEMA, { ...example, apis: [{ type: 'openapi', url: 'http://api.example.com/x', description: 'x' }] })).not.toEqual([]);
    expect(check(POPPY_SCHEMA, { protocol_version: '1.0', organization: example.organization })).not.toEqual([]); // none of agent, apis, web
  });
});

describe('discovery file /.well-known/poppy.json', () => {
  it('is served as JSON on brewerytrip.com and matches the official schema', async () => {
    const { env } = makeEnv(ZERO);
    const res = await get('/.well-known/poppy.json', env);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/^application\/json/);
    expect(res.headers.get('cache-control')).toBe('public, max-age=3600');
    const doc = await res.json() as any;
    expect(check(POPPY_SCHEMA, doc)).toEqual([]);
    expect(doc.protocol_version).toBe('1.0');
    expect(doc.organization).toEqual({ name: 'Brewery Trip', domain: 'brewerytrip.com' });
    expect(doc.apis).toHaveLength(1);
    expect(doc.apis[0]).toMatchObject({ type: 'openapi', url: `${SITE}/agent/openapi.json` });
  });
  it('offers no sign-in, no agent endpoint, no browser session, no tasks endpoint and no extensions', async () => {
    const { env } = makeEnv(ZERO);
    const doc = await (await get('/.well-known/poppy.json', env)).json() as any;
    expect(Object.keys(doc).sort()).toEqual(['apis', 'organization', 'protocol_version', 'web']);
    expect(doc.web).toEqual({});
    expect(JSON.stringify(doc)).not.toMatch(/workers\.dev|\/api\/|oauth|issuer/i);
  });
  it('is not served on a host it cannot speak for (spec 3.1: organization.domain must be the serving host)', async () => {
    const { env } = makeEnv(ZERO);
    for (const host of ['ohio.brewerytrip.com', 'ohio-beer-path.bill-burkey.workers.dev', 'ohiobrewpath.com', 'evil.example']) {
      expect((await get('/.well-known/poppy.json', env, { host })).status, host).toBe(404);
    }
  });
  it('names the serving host when run locally, so the official validator can be pointed at a local copy', async () => {
    const { env } = makeEnv(ZERO);
    const doc = await (await get('/.well-known/poppy.json', env, { host: '127.0.0.1:8445' })).json() as any;
    expect(doc.organization.domain).toBe('127.0.0.1:8445');
    expect(check(POPPY_SCHEMA, doc)).toEqual([]);
  });
});

describe('OpenAPI description /agent/openapi.json', () => {
  it('describes exactly the four read-only routes and nothing that needs a login', async () => {
    const { env } = makeEnv(ZERO);
    const res = await get('/agent/openapi.json', env);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/^application\/json/);
    const doc = await res.json() as any;
    expect(doc.openapi).toMatch(/^3\.1\./);
    expect(typeof doc.info.title).toBe('string');
    expect(typeof doc.info.version).toBe('string');
    expect(doc.servers).toEqual([{ url: SITE }]);
    expect(Object.keys(doc.paths).sort()).toEqual(['/agent/v1/breweries', '/agent/v1/breweries/{id}', '/agent/v1/breweries/{id}/taplist', '/agent/v1/taplists']);
    for (const [path, ops] of Object.entries<any>(doc.paths)) {
      expect(Object.keys(ops), path).toEqual(['get']);
      expect(path).not.toMatch(/\/api\/|auth|login|rating|review|user|admin|tour|plan|check-?in|subscribe|claim/i);
      expect(ops.get.security).toBeUndefined();
    }
    expect(doc.security).toBeUndefined();
    expect(doc.components.securitySchemes).toBeUndefined();
    expect(JSON.stringify(doc)).not.toMatch(/workers\.dev/);
  });
  it('every described route answers 200 with JSON, with zero tap lists published', async () => {
    const { env } = makeEnv(ZERO);
    const doc = await (await get('/agent/openapi.json', env)).json() as any;
    for (const path of Object.keys(doc.paths)) {
      const url = path.replace('{id}', '2312') + (path === '/agent/v1/breweries' ? '?city=Medina' : '');
      const res = await get(url, env);
      expect(res.status, url).toBe(200);
      expect(res.headers.get('content-type'), url).toMatch(/^application\/json/);
      expect(res.headers.get('cache-control'), url).toBe('public, max-age=300');
      await res.json();
    }
  });
});

describe('finding and reading breweries', () => {
  const PUBLIC_KEYS = ['city', 'closed', 'id', 'latitude', 'longitude', 'name', 'phone', 'postal_code', 'region', 'state', 'street', 'taplist_url', 'type', 'url', 'website_url'];
  it('needs at least one of q, city, state, or a point', async () => {
    const { env } = makeEnv(ZERO);
    const res = await get('/agent/v1/breweries', env);
    expect(res.status).toBe(400);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(calls).toEqual([]);
  });
  it('finds by name or place text, by city and by state, and gives only the public fields', async () => {
    const { env } = makeEnv(ZERO);
    const byName = await (await get('/agent/v1/breweries?q=Test%20Brewing', env)).json() as any;
    expect(byName).toMatchObject({ count: 1, returned: 1, limit: 20, offset: 0 });
    expect(Object.keys(byName.breweries[0]).sort()).toEqual(PUBLIC_KEYS);
    expect(byName.breweries[0]).toMatchObject({ id: 2312, url: `${SITE}/brewery/2312`, taplist_url: `${SITE}/agent/v1/breweries/2312/taplist`, closed: false });
    expect(JSON.stringify(byName)).not.toMatch(/LEGACY|INTERNAL|created_at|photos|visit_notes/);
    expect((await (await get('/agent/v1/breweries?city=Medina', env)).json() as any).count).toBe(1); // the closed one is not listed
    expect((await (await get('/agent/v1/breweries?state=oh', env)).json() as any).count).toBe(71);
    expect((await (await get('/agent/v1/breweries?state=MI', env)).json() as any).count).toBe(0);
    expect(calls).toEqual(['search:Test Brewing', 'city:Medina', 'all', 'all']);
  });
  it('finds near a point, nearest first, with a distance', async () => {
    const { env } = makeEnv(ZERO);
    const near = await (await get('/agent/v1/breweries?lat=41.14&lng=-81.86&radius_miles=10&limit=3', env)).json() as any;
    expect(calls).toEqual(['near:41.14,-81.86,10']);
    expect(near.returned).toBe(3);
    expect(near.breweries[0].distance_miles).toBe(1.3);
    await get('/agent/v1/breweries?lat=41.14&lng=-81.86', env);
    expect(calls[1]).toBe(`near:41.14,-81.86,${AGENT_LIMITS.defaultRadiusMiles}`);
  });
  it('holds the limits: 20 by default, 50 at most, bounded offset, radius and text length', async () => {
    const { env } = makeEnv(ZERO);
    expect((await (await get('/agent/v1/breweries?q=Akron', env)).json() as any).returned).toBe(20);
    const max = await (await get('/agent/v1/breweries?q=Akron&limit=50&offset=40', env)).json() as any;
    expect(max).toMatchObject({ count: 70, returned: 30, limit: 50, offset: 40 });
    for (const bad of ['q=Akron&limit=51', 'q=Akron&limit=0', 'q=Akron&limit=abc', 'q=Akron&offset=-1', 'q=Akron&offset=5001', 'q=A', `q=${'a'.repeat(81)}`, 'state=Ohio',
      'lat=41.1', 'lat=abc&lng=-81', 'lat=91&lng=-81', 'lat=41&lng=-81&radius_miles=101', 'lat=41&lng=-81&radius_miles=0']) {
      expect((await get(`/agent/v1/breweries?${bad}`, env)).status, bad).toBe(400);
    }
  });
  it('reads one brewery, marks a closed one, and answers 404 and 400', async () => {
    const { env } = makeEnv(ZERO);
    const one = await (await get('/agent/v1/breweries/2312', env)).json() as any;
    expect(one).toMatchObject({ id: 2312, name: 'Test Brewing Co.', closed: false, hours: { friday: '3-10' }, amenities: ['patio'], about: { quote: 'We brew beer.', source_url: 'https://example-brewery.test/about' } });
    expect(JSON.stringify(one)).not.toMatch(/LEGACY|INTERNAL|photos|visit_notes/);
    expect(await (await get('/agent/v1/breweries/9', env)).json()).toMatchObject({ closed: true, closed_at: '2026-05-01' });
    expect((await get('/agent/v1/breweries/424242', env)).status).toBe(404);
    for (const bad of ['abc', '0', '-1', '1.5', '12345678901']) expect((await get(`/agent/v1/breweries/${bad}`, env)).status, bad).toBe(400);
  });
});

describe('tap lists', () => {
  it('with zero lists published: an empty index and has_taplist false, from one intake request', async () => {
    const { env, asked } = makeEnv(ZERO);
    const index = await get('/agent/v1/taplists', env);
    expect(index.status).toBe(200);
    expect(await index.json()).toEqual({ count: 0, taplists: [] });
    const one = await get('/agent/v1/breweries/2312/taplist', env);
    expect(one.status).toBe(200);
    expect(await one.json()).toEqual({ brewery_id: 2312, brewery_url: `${SITE}/brewery/2312`, has_taplist: false, taplist: null });
    expect(asked).toEqual([`${INTAKE}/api/taplists`]);
  });
  it('gives a published list with name, style, strength, update time, source line and stale flag', async () => {
    const { env } = makeEnv(ONE);
    expect(await (await get('/agent/v1/taplists', env)).json()).toEqual({
      count: 1,
      taplists: [{ brewery_id: 2312, updated_at: NOW_ISO, brewery_url: `${SITE}/brewery/2312`, taplist_url: `${SITE}/agent/v1/breweries/2312/taplist` }],
    });
    const res = await get('/agent/v1/breweries/2312/taplist', env);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).not.toMatch(/workers\.dev|brewery_key/);
    expect(JSON.parse(body)).toEqual({
      brewery_id: 2312, brewery_url: `${SITE}/brewery/2312`, has_taplist: true,
      taplist: {
        updated_at: NOW_ISO, stale: false, source: SOURCE,
        beers: [{ name: 'Medina Lite', style: 'Pilsner', abv: 4.5, notes: null }, { name: 'House Root Beer', style: null, abv: null, notes: 'non-alcoholic' }],
      },
    });
  });
  it('flags an old list as stale', async () => {
    const { env } = makeEnv({ [`${INTAKE}/api/taplists`]: () => json(indexOf(['2312'], OLD_ISO)), [`${INTAKE}/api/taplist/2312`]: () => json(listOf(OLD_ISO)) });
    const body = await (await get('/agent/v1/breweries/2312/taplist', env)).json() as any;
    expect(body.taplist.stale).toBe(true);
  });
  it('answers 503 with Retry-After, never "no list", when the intake cannot be reached or sends a broken list', async () => {
    for (const intake of [{}, { [`${INTAKE}/api/taplists`]: () => json({}, 500) }, { [`${INTAKE}/api/taplists`]: () => json(indexOf(['2312'])), [`${INTAKE}/api/taplist/2312`]: () => json({ beers: 'x' }) }] as Intake[]) {
      resetTapListCache();
      const { env } = makeEnv(intake);
      const res = await get('/agent/v1/breweries/2312/taplist', env);
      expect(res.status).toBe(503);
      expect(res.headers.get('retry-after')).toBe('60');
      expect(res.headers.get('cache-control')).toBe('no-store');
    }
    resetTapListCache();
    const { env } = makeEnv({});
    expect((await get('/agent/v1/taplists', env)).status).toBe(503);
  });
  it('a closed brewery has no list and costs no intake request; an unknown brewery is a 404', async () => {
    const { env, asked } = makeEnv(ONE);
    expect(await (await get('/agent/v1/breweries/9/taplist', env)).json()).toMatchObject({ has_taplist: false, taplist: null });
    expect((await get('/agent/v1/breweries/424242/taplist', env)).status).toBe(404);
    expect(asked).toEqual([]);
  });
  it('reads tap lists only through the service binding, never by a request to the outside', async () => {
    const { env } = makeEnv(ONE);
    await get('/agent/v1/breweries/2312/taplist', env);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('nothing user-specific, nothing written', () => {
  const PATHS = ['/.well-known/poppy.json', '/agent/openapi.json', '/agent/v1/breweries?city=Medina', '/agent/v1/breweries/2312', '/agent/v1/breweries/2312/taplist', '/agent/v1/taplists'];
  it('answers the same with or without a login or an assistant\'s headers, sets no cookie, and never touches the API cache', async () => {
    const { env, CACHE } = makeEnv(ONE);
    for (const path of PATHS) {
      const plain = await get(path, env);
      const signedIn = await get(path, env, { headers: { Cookie: 'bt_session=abc', Authorization: 'Bearer abc', 'Poppy-Session': 'eyJ0eXAi.x.y', 'Poppy-Version': '1.0' } });
      expect(signedIn.status, path).toBe(200);
      expect(await signedIn.text(), path).toBe(await plain.text());
      expect(signedIn.headers.get('set-cookie'), path).toBeNull();
      expect(signedIn.headers.get('x-cache'), path).toBeNull();
      expect(signedIn.headers.get('x-robots-tag'), path).toBe('noindex');
    }
    expect(CACHE.get).not.toHaveBeenCalled();
    expect(CACHE.put).not.toHaveBeenCalled();
  });
  it('accepts only reads', async () => {
    const { env } = makeEnv(ONE);
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      for (const path of ['/agent/v1/breweries/2312', '/agent/v1/taplists', '/agent/v1/breweries/2312/taplist']) {
        expect((await get(path, env, { method })).status, `${method} ${path}`).toBe(404);
      }
    }
  });
});
