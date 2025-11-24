import type { Env, Brewery } from '../types';

export async function getAllBreweries(env: Env): Promise<Brewery[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM breweries ORDER BY name ASC'
  ).all<Brewery>();

  return results?.map(parseBrewery) || [];
}

export async function getBreweriesByRegion(env: Env, region: string): Promise<Brewery[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM breweries WHERE region = ? ORDER BY name ASC'
  ).bind(region).all<Brewery>();

  return results?.map(parseBrewery) || [];
}

export async function getBreweriesByCity(env: Env, city: string): Promise<Brewery[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM breweries WHERE city LIKE ? ORDER BY name ASC'
  ).bind(`%${city}%`).all<Brewery>();

  return results?.map(parseBrewery) || [];
}

export async function getBreweryById(env: Env, id: number): Promise<Brewery | null> {
  const brewery = await env.DB.prepare(
    'SELECT * FROM breweries WHERE id = ?'
  ).bind(id).first<Brewery>();

  return brewery ? parseBrewery(brewery) : null;
}

export async function getNearbyBreweries(
  env: Env,
  lat: number,
  lng: number,
  radius: number = 50
): Promise<Brewery[]> {
  // Haversine formula in SQLite
  // Approximate: 1 degree ≈ 69 miles
  const latDelta = radius / 69;
  const lngDelta = radius / (69 * Math.cos(lat * Math.PI / 180));

  // Get all breweries in the bounding box
  const { results } = await env.DB.prepare(`
    SELECT *,
    (
      3959 * acos(
        cos(radians(?)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(latitude))
      )
    ) AS distance
    FROM breweries
    WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    ORDER BY distance ASC
    LIMIT 100
  `).bind(
    lat, lng, lat,
    lat - latDelta, lat + latDelta,
    lng - lngDelta, lng + lngDelta
  ).all<Brewery & { distance: number }>();

  // Filter by radius in application code
  const filtered = results?.filter((b: any) => b.distance < radius) || [];

  return filtered.slice(0, 50).map(parseBrewery);
}

export async function searchBreweries(env: Env, query: string): Promise<Brewery[]> {
  const searchTerm = `%${query}%`;

  const { results } = await env.DB.prepare(`
    SELECT * FROM breweries
    WHERE name LIKE ? OR city LIKE ? OR region LIKE ?
    ORDER BY name ASC
    LIMIT 100
  `).bind(searchTerm, searchTerm, searchTerm).all<Brewery>();

  return results?.map(parseBrewery) || [];
}

// Helper to parse JSON fields
function parseBrewery(brewery: any): Brewery {
  return {
    ...brewery,
    amenities: brewery.amenities ? JSON.parse(brewery.amenities) : [],
    hours: brewery.hours ? JSON.parse(brewery.hours) : {}
  };
}
