import type { Env, PlanRequest, TripPlan, TripRoute } from '../types';

interface BreweryCandidate {
  id: number;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  description?: string | null;
  distance_miles?: number;
}

/**
 * Generate a URL-safe slug from a title with a random suffix for uniqueness.
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

/**
 * Select brewery candidates using Vectorize semantic search + D1 geographic filter.
 */
export async function selectCandidates(
  env: Env,
  request: PlanRequest
): Promise<BreweryCandidate[]> {
  const { starting_lat, starting_lng, time_budget_minutes, preferences } = request;

  if (!starting_lat || !starting_lng) return [];

  const maxRadiusMiles = Math.min(Math.max((time_budget_minutes - 45) * 0.5, 15), 150);
  const candidates = new Map<number, BreweryCandidate>();

  // Path 1: Vectorize semantic search (if preferences exist)
  if (preferences.length > 0 && env.VECTORIZE) {
    try {
      const queryText = preferences.join(' ') + ' brewery ' + request.starting_city;
      const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: queryText,
      }) as any;

      const vector = Array.isArray(embedding?.data?.[0]) ? embedding.data[0] : embedding?.data;

      if (Array.isArray(vector) && vector.length === 768) {
        const vectorResults = await env.VECTORIZE.query(vector, {
          topK: 30,
          returnMetadata: 'all',
        });

        const matchedIds = (vectorResults.matches || [])
          .map(m => parseInt(m.id))
          .filter(id => !isNaN(id));

        if (matchedIds.length > 0) {
          const placeholders = matchedIds.map(() => '?').join(',');
          const { results: matchedBreweries } = await env.DB.prepare(
            `SELECT * FROM breweries WHERE id IN (${placeholders})`
          ).bind(...matchedIds).all<any>();

          for (const brewery of matchedBreweries || []) {
            if (brewery.latitude && brewery.longitude) {
              const dist = haversine(starting_lat, starting_lng, brewery.latitude, brewery.longitude);
              if (dist <= maxRadiusMiles) {
                candidates.set(brewery.id, {
                  id: brewery.id,
                  name: brewery.name,
                  city: brewery.city,
                  state: brewery.state || brewery.state_province || 'OH',
                  latitude: brewery.latitude,
                  longitude: brewery.longitude,
                  amenities: brewery.amenities ? JSON.parse(brewery.amenities) : [],
                  description: brewery.description,
                  distance_miles: dist,
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Vectorize search failed, falling back to D1:', err);
    }
  }

  // Path 2: D1 geographic query
  const latDelta = maxRadiusMiles / 69;
  const lngDelta = maxRadiusMiles / (69 * Math.cos(starting_lat * Math.PI / 180));

  const { results: nearbyBreweries } = await env.DB.prepare(`
    SELECT id, name, city, state, state_province, latitude, longitude, amenities, description,
    (3959 * acos(
      cos(radians(?)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(?)) +
      sin(radians(?)) * sin(radians(latitude))
    )) AS distance_miles
    FROM breweries
    WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    ORDER BY distance_miles ASC
    LIMIT 30
  `).bind(
    starting_lat, starting_lng, starting_lat,
    starting_lat - latDelta, starting_lat + latDelta,
    starting_lng - lngDelta, starting_lng + lngDelta
  ).all<any>();

  for (const b of nearbyBreweries || []) {
    if (!candidates.has(b.id) && b.distance_miles <= maxRadiusMiles) {
      candidates.set(b.id, {
        id: b.id,
        name: b.name,
        city: b.city,
        state: b.state || b.state_province || 'OH',
        latitude: b.latitude,
        longitude: b.longitude,
        amenities: b.amenities ? JSON.parse(b.amenities) : [],
        description: b.description,
        distance_miles: b.distance_miles,
      });
    }
  }

  return Array.from(candidates.values())
    .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0))
    .slice(0, 20);
}

/**
 * Save a completed trip plan to D1.
 */
export async function saveTripPlan(
  env: Env,
  title: string,
  request: PlanRequest,
  route: TripRoute
): Promise<TripPlan> {
  const slug = generateSlug(title);

  const result = await env.DB.prepare(`
    INSERT INTO trip_plans (slug, title, starting_city, starting_lat, starting_lng, time_budget_minutes, preferences, route_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    slug, title, request.starting_city,
    request.starting_lat || null, request.starting_lng || null,
    request.time_budget_minutes,
    JSON.stringify(request.preferences),
    JSON.stringify(route)
  ).run();

  const tripId = result.meta?.last_row_id;

  for (let i = 0; i < route.stops.length; i++) {
    const stop = route.stops[i];
    await env.DB.prepare(`
      INSERT INTO trip_stops (trip_id, stop_order, brewery_id, drive_minutes, drive_miles)
      VALUES (?, ?, ?, ?, ?)
    `).bind(tripId, i + 1, stop.brewery_id, stop.drive_minutes_from_prev, stop.drive_miles_from_prev).run();
  }

  return {
    id: tripId as number,
    slug, title,
    starting_city: request.starting_city,
    starting_lat: request.starting_lat || null,
    starting_lng: request.starting_lng || null,
    time_budget_minutes: request.time_budget_minutes,
    preferences: request.preferences,
    route_json: route,
    created_at: new Date().toISOString(),
    views: 0, shares: 0,
  };
}

/**
 * Fetch a trip plan by slug (internal -- no view increment).
 */
export async function getTripBySlugInternal(env: Env, slug: string): Promise<TripPlan | null> {
  const row = await env.DB.prepare(
    'SELECT * FROM trip_plans WHERE slug = ?'
  ).bind(slug).first<any>();

  if (!row) return null;

  return {
    ...row,
    preferences: row.preferences ? JSON.parse(row.preferences) : [],
    route_json: row.route_json ? JSON.parse(row.route_json) : { stops: [], total_drive_minutes: 0, total_drive_miles: 0, total_brewery_time_minutes: 0 },
  };
}

/**
 * Fetch a trip plan by slug. Increments view count.
 */
export async function getTripBySlug(env: Env, slug: string): Promise<TripPlan | null> {
  const trip = await getTripBySlugInternal(env, slug);
  if (!trip) return null;

  env.DB.prepare('UPDATE trip_plans SET views = views + 1 WHERE id = ?')
    .bind(trip.id).run().catch(() => {});

  return trip;
}

/**
 * Check KV cache for a similar route.
 */
export async function getCachedRoute(env: Env, request: PlanRequest): Promise<TripRoute | null> {
  const key = `trip_cache:${request.starting_city.toLowerCase().replace(/\s/g, '').slice(0, 50)}:${request.time_budget_minutes}:${request.preferences.sort().join(',')}`;
  const cached = await env.CACHE.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedRoute(env: Env, request: PlanRequest, route: TripRoute): Promise<void> {
  const key = `trip_cache:${request.starting_city.toLowerCase().replace(/\s/g, '').slice(0, 50)}:${request.time_budget_minutes}:${request.preferences.sort().join(',')}`;
  await env.CACHE.put(key, JSON.stringify(route), { expirationTtl: 86400 });
}

/** Haversine distance in miles */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
