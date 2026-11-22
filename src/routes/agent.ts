// Read-only routes for a visitor's AI assistant (Personal Agent Protocol, "Poppy", version 1.0).
// Specification: https://personalagentprotocol.org/docs/1.0/spec (section 3 discovery, section 7 APIs).
//
//   GET /.well-known/poppy.json               the discovery file (the location is fixed by the spec)
//   GET /agent/openapi.json                   OpenAPI 3.1 description of the four reads below
//   GET /agent/v1/breweries                   find breweries by name, city, state or near a point
//   GET /agent/v1/breweries/:id               one brewery
//   GET /agent/v1/breweries/:id/taplist       that brewery's current tap list, when it has published one
//   GET /agent/v1/taplists                    which breweries have a current tap list
//
// Rules: GET only, no sign-in, nothing that depends on who is asking, an explicit list of public fields,
// and small limits. The Poppy-Session header an assistant sends is accepted and not used (spec 5.3: an
// endpoint that uses no Session claims may do that). These routes sit outside /api/ on purpose: robots.txt
// closes /api/ to crawlers, and the hour-long KV cache there would hold a tap list long after it changed.
// Tap lists come through src/services/taplist.ts (service binding, timeout, five-minute cache, validation);
// the intake Worker's own address is never given out.

import { Hono } from 'hono';
import type { Env, Brewery } from '../types';
import * as breweriesDB from '../db/breweries';
import type { StateFilter } from '../db/breweries';
import type { SubdomainContext } from '../middleware/subdomain';
import { getTapList, listTapLists } from '../services/taplist';

const agent = new Hono<{ Bindings: Env; Variables: { subdomain: SubdomainContext } }>();

export const AGENT_SITE = 'https://brewerytrip.com';
export const AGENT_LIMITS = { defaultLimit: 20, maxLimit: 50, maxOffset: 5000, defaultRadiusMiles: 25, maxRadiusMiles: 100, maxQueryChars: 80, maxTapLists: 500 };
const CACHE_READ = 'public, max-age=300';
const CACHE_DOC = 'public, max-age=3600';
const NOINDEX = { 'X-Robots-Tag': 'noindex' };

/**
 * The origin the discovery file may speak for. A poppy.json is valid only on the host that serves it
 * (spec 3.1), so it is served on brewerytrip.com itself and, for local testing, on localhost. On a state
 * subdomain, the workers.dev address or any other host this returns null and the file is a 404.
 */
function discoveryOrigin(host: string): string | null {
  const h = host.toLowerCase();
  if (h === 'brewerytrip.com') return AGENT_SITE;
  if (/^(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(h)) return `https://${h}`;
  return null;
}

const fail = (c: any, status: 400 | 404 | 503, error: string, extra: Record<string, string> = {}) =>
  c.json({ error }, status, { 'Cache-Control': 'no-store', ...NOINDEX, ...extra });

const parseId = (raw: string): number | null => (/^[1-9][0-9]{0,8}$/.test(raw) ? Number(raw) : null);

/** The public fields of a brewery. Anything not named here is not given out. */
function publicBrewery(b: Brewery & { distance?: number }, site: string) {
  return {
    id: b.id,
    name: b.name,
    type: b.brewery_type ?? null,
    street: b.street ?? null,
    city: b.city ?? null,
    state: b.state ?? null,
    postal_code: b.postal_code ?? null,
    region: b.region ?? null,
    latitude: typeof b.latitude === 'number' ? b.latitude : null,
    longitude: typeof b.longitude === 'number' ? b.longitude : null,
    phone: b.phone ?? null,
    website_url: b.website_url ?? null,
    closed: Boolean(b.closed_at),
    url: `${site}/brewery/${b.id}`,
    taplist_url: `${site}/agent/v1/breweries/${b.id}/taplist`,
    ...(typeof b.distance === 'number' && Number.isFinite(b.distance) ? { distance_miles: Math.round(b.distance * 10) / 10 } : {}),
  };
}

function publicBreweryDetail(b: Brewery, site: string) {
  return {
    ...publicBrewery(b, site),
    closed_at: b.closed_at ?? null,
    hours: b.hours && typeof b.hours === 'object' ? b.hours : {},
    amenities: Array.isArray(b.amenities) ? b.amenities : [],
    // A sentence copied from the brewery's own website, with the page it came from.
    about: b.about_quote ? { quote: b.about_quote, source_url: b.about_source_url ?? null, checked_at: b.about_checked_at ?? null } : null,
    updated_at: b.updated_at ?? null,
  };
}

// ── Discovery ──────────────────────────────────────────────────────────────────────────────────────

export function poppyDocument(origin: string) {
  return {
    protocol_version: '1.0',
    organization: { name: 'Brewery Trip', domain: new URL(origin).host },
    apis: [
      {
        type: 'openapi',
        url: `${origin}/agent/openapi.json`,
        description: "Read-only craft brewery directory: find breweries by name, city, state or near a point, read one brewery's details, and read a brewery's current tap list where the brewery has published one. No sign-in.",
      },
    ],
    // The website is open to assistants as to any signed-out visitor. There is no browser-session endpoint and no sign-in.
    web: {},
  };
}

agent.get('/.well-known/poppy.json', (c) => {
  const sub = c.get('subdomain');
  const origin = sub && sub.brandDomain === 'brewerytrip' && !sub.stateSubdomain ? discoveryOrigin(c.req.header('host') || '') : null;
  if (!origin) return fail(c, 404, 'Not found');
  return c.json(poppyDocument(origin), 200, { 'Cache-Control': CACHE_DOC, ...NOINDEX });
});

// ── OpenAPI ────────────────────────────────────────────────────────────────────────────────────────

export function openApiDocument(origin: string) {
  const L = AGENT_LIMITS;
  const nullable = (type: string, description?: string) => ({ type: [type, 'null'], ...(description ? { description } : {}) });
  const json = (description: string, ref: string) => ({ description, content: { 'application/json': { schema: { $ref: `#/components/schemas/${ref}` } } } });
  const error = (description: string) => json(description, 'Error');
  const idParam = { name: 'id', in: 'path', required: true, description: 'The brewery id: the number in its page address /brewery/{id}.', schema: { type: 'integer', minimum: 1 } };
  const breweryProps = {
    id: { type: 'integer' },
    name: { type: 'string' },
    type: nullable('string', 'For example micro, brewpub, regional.'),
    street: nullable('string'),
    city: nullable('string'),
    state: nullable('string', 'Two-letter US state.'),
    postal_code: nullable('string'),
    region: nullable('string'),
    latitude: nullable('number'),
    longitude: nullable('number'),
    phone: nullable('string', "The brewery's public phone number."),
    website_url: nullable('string', "The brewery's own website."),
    closed: { type: 'boolean', description: 'True when the brewery has closed. Closed breweries are not returned by a search.' },
    url: { type: 'string', format: 'uri', description: "The brewery's page on Brewery Trip." },
    taplist_url: { type: 'string', format: 'uri', description: "Where to read this brewery's tap list." },
    distance_miles: { type: 'number', description: 'Straight-line distance from the point given. Present only in a search near a point.' },
  };
  return {
    openapi: '3.1.0',
    info: {
      title: 'Brewery Trip directory',
      version: '1.0.0',
      description: 'Read-only access to the Brewery Trip directory of craft breweries and to the tap lists breweries have published. Free, no sign-in and no key. Nothing here changes anything. A tap list is read from a photo of the brewery\'s own board, texted by the brewery or taken on a Brewery Trip visit (each list\'s source field says which); most breweries have no list.',
    },
    servers: [{ url: origin }],
    paths: {
      '/agent/v1/breweries': {
        get: {
          operationId: 'findBreweries',
          summary: 'Find open breweries by name, city, state or near a point.',
          description: 'Give at least one of q, city, state, or lat with lng. With lat and lng the result is ordered by distance and q and city are not used. Otherwise q is used if given, then city, then state alone.',
          parameters: [
            { name: 'q', in: 'query', description: 'Text found in the brewery name, city or region.', schema: { type: 'string', minLength: 2, maxLength: L.maxQueryChars } },
            { name: 'city', in: 'query', description: 'City name, or part of it.', schema: { type: 'string', minLength: 2, maxLength: L.maxQueryChars } },
            { name: 'state', in: 'query', description: 'Two-letter US state, for example OH. Narrows any search.', schema: { type: 'string', pattern: '^[A-Za-z]{2}$' } },
            { name: 'lat', in: 'query', description: 'Latitude of the point. Needs lng.', schema: { type: 'number', minimum: -90, maximum: 90 } },
            { name: 'lng', in: 'query', description: 'Longitude of the point. Needs lat.', schema: { type: 'number', minimum: -180, maximum: 180 } },
            { name: 'radius_miles', in: 'query', description: 'Search radius around the point.', schema: { type: 'number', exclusiveMinimum: 0, maximum: L.maxRadiusMiles, default: L.defaultRadiusMiles } },
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: L.maxLimit, default: L.defaultLimit } },
            { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, maximum: L.maxOffset, default: 0 } },
          ],
          responses: { 200: json('The matching breweries.', 'BrewerySearch'), 400: error('A parameter is missing or out of range.') },
        },
      },
      '/agent/v1/breweries/{id}': {
        get: {
          operationId: 'getBrewery',
          summary: "Read one brewery's details.",
          parameters: [idParam],
          responses: { 200: json('The brewery.', 'BreweryDetail'), 400: error('The id is not a number.'), 404: error('No brewery has this id.') },
        },
      },
      '/agent/v1/breweries/{id}/taplist': {
        get: {
          operationId: 'getBreweryTapList',
          summary: "Read a brewery's current tap list, when the brewery has published one.",
          description: 'has_taplist is false and taplist is null when the brewery has not published a list. A list marked stale is old and should not be presented as what is on tap today.',
          parameters: [idParam],
          responses: {
            200: json('The tap list, or has_taplist false.', 'BreweryTapList'),
            400: error('The id is not a number.'),
            404: error('No brewery has this id.'),
            503: error('Tap lists cannot be read right now. Try again after the Retry-After time.'),
          },
        },
      },
      '/agent/v1/taplists': {
        get: {
          operationId: 'listTapLists',
          summary: 'List the breweries that have a current tap list.',
          description: `Newest first, at most ${L.maxTapLists}. The list is empty when no brewery has published one.`,
          responses: { 200: json('The breweries with a tap list.', 'TapListIndex'), 503: error('Tap lists cannot be read right now. Try again after the Retry-After time.') },
        },
      },
    },
    components: {
      schemas: {
        Error: { type: 'object', required: ['error'], properties: { error: { type: 'string' } } },
        Brewery: { type: 'object', required: ['id', 'name', 'closed', 'url', 'taplist_url'], properties: breweryProps },
        BreweryDetail: {
          type: 'object',
          required: ['id', 'name', 'closed', 'url', 'taplist_url', 'hours', 'amenities'],
          properties: {
            ...breweryProps,
            closed_at: nullable('string', 'The date the brewery closed.'),
            hours: { type: 'object', additionalProperties: { type: 'string' }, description: 'Opening hours by day, where known.' },
            amenities: { type: 'array', items: { type: 'string' } },
            about: {
              type: ['object', 'null'],
              description: "A sentence copied from the brewery's own website.",
              properties: { quote: { type: 'string' }, source_url: nullable('string'), checked_at: nullable('string') },
            },
            updated_at: nullable('string'),
          },
        },
        BrewerySearch: {
          type: 'object',
          required: ['count', 'returned', 'limit', 'offset', 'breweries'],
          properties: {
            count: { type: 'integer', description: 'How many breweries matched. A text search matches at most 100 and a search near a point at most 50.' },
            returned: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
            breweries: { type: 'array', items: { $ref: '#/components/schemas/Brewery' } },
          },
        },
        TapList: {
          type: 'object',
          required: ['updated_at', 'stale', 'source', 'beers'],
          properties: {
            updated_at: { type: 'string', format: 'date-time', description: "When the photo of the brewery's board arrived." },
            stale: { type: 'boolean', description: 'True when the list is old. Do not present a stale list as current.' },
            source: { type: 'string', description: 'Where the list comes from, in words to show with it.' },
            beers: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string' }, style: nullable('string'), abv: nullable('number', 'Alcohol by volume, in percent.'), notes: nullable('string') },
              },
            },
          },
        },
        BreweryTapList: {
          type: 'object',
          required: ['brewery_id', 'brewery_url', 'has_taplist', 'taplist'],
          properties: {
            brewery_id: { type: 'integer' },
            brewery_url: { type: 'string', format: 'uri' },
            has_taplist: { type: 'boolean' },
            taplist: { oneOf: [{ $ref: '#/components/schemas/TapList' }, { type: 'null' }] },
          },
        },
        TapListIndex: {
          type: 'object',
          required: ['count', 'taplists'],
          properties: {
            count: { type: 'integer' },
            taplists: {
              type: 'array',
              items: {
                type: 'object',
                required: ['brewery_id', 'brewery_url', 'taplist_url'],
                properties: { brewery_id: { type: 'integer' }, updated_at: nullable('string'), brewery_url: { type: 'string', format: 'uri' }, taplist_url: { type: 'string', format: 'uri' } },
              },
            },
          },
        },
      },
    },
  };
}

agent.get('/agent/openapi.json', (c) => {
  const origin = discoveryOrigin(c.req.header('host') || '') ?? AGENT_SITE;
  return c.json(openApiDocument(origin), 200, { 'Cache-Control': CACHE_DOC, ...NOINDEX });
});

// ── Breweries ──────────────────────────────────────────────────────────────────────────────────────

const siteFor = (c: any): string => discoveryOrigin(c.req.header('host') || '') ?? AGENT_SITE;

/** A whole number in [min, max], the default when absent, or null when present and not acceptable. */
function intParam(raw: string | undefined, def: number, min: number, max: number): number | null {
  if (raw === undefined || raw === '') return def;
  if (!/^\d{1,6}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= min && n <= max ? n : null;
}

function numParam(raw: string | undefined): number | null {
  if (raw === undefined || !/^-?\d{1,3}(\.\d{1,10})?$/.test(raw)) return null;
  return Number(raw);
}

agent.get('/agent/v1/breweries', async (c) => {
  const L = AGENT_LIMITS;
  const limit = intParam(c.req.query('limit'), L.defaultLimit, 1, L.maxLimit);
  const offset = intParam(c.req.query('offset'), 0, 0, L.maxOffset);
  if (limit === null) return fail(c, 400, `limit must be a whole number from 1 to ${L.maxLimit}`);
  if (offset === null) return fail(c, 400, `offset must be a whole number from 0 to ${L.maxOffset}`);

  const q = (c.req.query('q') || '').trim();
  const city = (c.req.query('city') || '').trim();
  const state = (c.req.query('state') || '').trim().toUpperCase();
  for (const [name, value] of [['q', q], ['city', city]] as const) {
    if (value && (value.length < 2 || value.length > L.maxQueryChars)) return fail(c, 400, `${name} must be 2 to ${L.maxQueryChars} characters`);
  }
  if (state && !/^[A-Z]{2}$/.test(state)) return fail(c, 400, 'state must be a two-letter US state, for example OH');

  const sub = c.get('subdomain');
  const stateFilter: StateFilter = state
    ? { stateAbbreviation: state, isMultiState: false }
    : { stateAbbreviation: sub?.stateAbbreviation ?? null, isMultiState: sub?.isMultiState ?? true };

  const hasLat = c.req.query('lat') !== undefined;
  const hasLng = c.req.query('lng') !== undefined;
  let found: (Brewery & { distance?: number })[];
  if (hasLat || hasLng) {
    const lat = numParam(c.req.query('lat'));
    const lng = numParam(c.req.query('lng'));
    if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) return fail(c, 400, 'lat and lng must both be given, as decimal degrees');
    const rawRadius = c.req.query('radius_miles');
    const radius = rawRadius === undefined || rawRadius === '' ? L.defaultRadiusMiles : numParam(rawRadius);
    if (radius === null || radius <= 0 || radius > L.maxRadiusMiles) return fail(c, 400, `radius_miles must be more than 0 and at most ${L.maxRadiusMiles}`);
    found = await breweriesDB.getNearbyBreweries(c.env, lat, lng, radius, stateFilter);
  } else if (q) {
    found = await breweriesDB.searchBreweries(c.env, q, stateFilter);
  } else if (city) {
    found = await breweriesDB.getBreweriesByCity(c.env, city, stateFilter);
  } else if (state) {
    found = await breweriesDB.getAllBreweries(c.env, stateFilter);
  } else {
    return fail(c, 400, 'give at least one of q, city, state, or lat with lng');
  }

  const site = siteFor(c);
  const page = found.slice(offset, offset + limit).map((b) => publicBrewery(b, site));
  return c.json({ count: found.length, returned: page.length, limit, offset, breweries: page }, 200, { 'Cache-Control': CACHE_READ, ...NOINDEX });
});

agent.get('/agent/v1/breweries/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return fail(c, 400, 'Invalid brewery id');
  const brewery = await breweriesDB.getBreweryById(c.env, id);
  if (!brewery) return fail(c, 404, 'Brewery not found');
  return c.json(publicBreweryDetail(brewery, siteFor(c)), 200, { 'Cache-Control': CACHE_READ, ...NOINDEX });
});

// ── Tap lists ──────────────────────────────────────────────────────────────────────────────────────

const TAPLISTS_DOWN = 'Tap lists cannot be read right now';
const RETRY = { 'Retry-After': '60' };

agent.get('/agent/v1/breweries/:id/taplist', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) return fail(c, 400, 'Invalid brewery id');
  const brewery = await breweriesDB.getBreweryById(c.env, id);
  if (!brewery) return fail(c, 404, 'Brewery not found');

  const site = siteFor(c);
  const none = { brewery_id: id, brewery_url: `${site}/brewery/${id}`, has_taplist: false, taplist: null };
  if (brewery.closed_at) return c.json(none, 200, { 'Cache-Control': CACHE_READ, ...NOINDEX });

  // The index says whether there is a list at all; "could not ask" must not be answered as "no list".
  const index = await listTapLists(c.env);
  if (!index) return fail(c, 503, TAPLISTS_DOWN, RETRY);
  if (!index.some((row) => row.breweryId === id)) return c.json(none, 200, { 'Cache-Control': CACHE_READ, ...NOINDEX });

  const list = await getTapList(c.env, id);
  if (!list) return fail(c, 503, TAPLISTS_DOWN, RETRY);
  return c.json({
    ...none,
    has_taplist: true,
    taplist: {
      updated_at: list.updatedAt,
      stale: list.stale,
      source: list.source,
      beers: list.beers.map((b) => ({ name: b.name, style: b.style, abv: b.abv, notes: b.notes })),
    },
  }, 200, { 'Cache-Control': CACHE_READ, ...NOINDEX });
});

agent.get('/agent/v1/taplists', async (c) => {
  const index = await listTapLists(c.env);
  if (!index) return fail(c, 503, TAPLISTS_DOWN, RETRY);
  const site = siteFor(c);
  const rows = index.slice(0, AGENT_LIMITS.maxTapLists).map((row) => ({
    brewery_id: row.breweryId,
    updated_at: row.updatedAt,
    brewery_url: `${site}/brewery/${row.breweryId}`,
    taplist_url: `${site}/agent/v1/breweries/${row.breweryId}/taplist`,
  }));
  return c.json({ count: rows.length, taplists: rows }, 200, { 'Cache-Control': CACHE_READ, ...NOINDEX });
});

export default agent;
