import type { Env, Brewery } from '../types';

// State filter options for queries
export interface StateFilter {
  stateAbbreviation?: string | null;  // e.g., "OH", "MI"
  isMultiState?: boolean;              // true = return all states
}

export async function getAllBreweries(env: Env, stateFilter?: StateFilter): Promise<Brewery[]> {
  // If multi-state or no filter, return all breweries
  if (!stateFilter || stateFilter.isMultiState || !stateFilter.stateAbbreviation) {
    const { results } = await env.DB.prepare(
      'SELECT * FROM breweries ORDER BY name ASC'
    ).all<Brewery>();
    return results?.map(parseBrewery) || [];
  }

  // Filter by state abbreviation
  const { results } = await env.DB.prepare(
    'SELECT * FROM breweries WHERE state = ? ORDER BY name ASC'
  ).bind(stateFilter.stateAbbreviation).all<Brewery>();

  return results?.map(parseBrewery) || [];
}

export async function getBreweriesByRegion(env: Env, region: string, stateFilter?: StateFilter): Promise<Brewery[]> {
  // If multi-state or no filter, return all from region
  if (!stateFilter || stateFilter.isMultiState || !stateFilter.stateAbbreviation) {
    const { results } = await env.DB.prepare(
      'SELECT * FROM breweries WHERE region = ? ORDER BY name ASC'
    ).bind(region).all<Brewery>();
    return results?.map(parseBrewery) || [];
  }

  // Filter by region AND state
  const { results } = await env.DB.prepare(
    'SELECT * FROM breweries WHERE region = ? AND state = ? ORDER BY name ASC'
  ).bind(region, stateFilter.stateAbbreviation).all<Brewery>();

  return results?.map(parseBrewery) || [];
}

export async function getBreweriesByCity(env: Env, city: string, stateFilter?: StateFilter): Promise<Brewery[]> {
  // If multi-state or no filter, return all from city
  if (!stateFilter || stateFilter.isMultiState || !stateFilter.stateAbbreviation) {
    const { results } = await env.DB.prepare(
      'SELECT * FROM breweries WHERE city LIKE ? ORDER BY name ASC'
    ).bind(`%${city}%`).all<Brewery>();
    return results?.map(parseBrewery) || [];
  }

  // Filter by city AND state
  const { results } = await env.DB.prepare(
    'SELECT * FROM breweries WHERE city LIKE ? AND state = ? ORDER BY name ASC'
  ).bind(`%${city}%`, stateFilter.stateAbbreviation).all<Brewery>();

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
  radius: number = 50,
  stateFilter?: StateFilter
): Promise<Brewery[]> {
  // Haversine formula in SQLite
  // Approximate: 1 degree ≈ 69 miles
  const latDelta = radius / 69;
  const lngDelta = radius / (69 * Math.cos(lat * Math.PI / 180));

  // Build query with optional state filter
  const stateClause = stateFilter?.stateAbbreviation && !stateFilter.isMultiState
    ? 'AND state = ?'
    : '';

  // Get all breweries in the bounding box
  const query = `
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
      ${stateClause}
    ORDER BY distance ASC
    LIMIT 100
  `;

  const params = [
    lat, lng, lat,
    lat - latDelta, lat + latDelta,
    lng - lngDelta, lng + lngDelta
  ];

  // Add state parameter if filtering
  if (stateFilter?.stateAbbreviation && !stateFilter.isMultiState) {
    params.push(stateFilter.stateAbbreviation as any);
  }

  const { results } = await env.DB.prepare(query)
    .bind(...params)
    .all<Brewery & { distance: number }>();

  // Filter by radius in application code
  const filtered = results?.filter((b: any) => b.distance < radius) || [];

  return filtered.slice(0, 50).map(parseBrewery);
}

export async function searchBreweries(env: Env, query: string, stateFilter?: StateFilter): Promise<Brewery[]> {
  const searchTerm = `%${query}%`;

  // If multi-state or no filter, search all
  if (!stateFilter || stateFilter.isMultiState || !stateFilter.stateAbbreviation) {
    const { results } = await env.DB.prepare(`
      SELECT * FROM breweries
      WHERE name LIKE ? OR city LIKE ? OR region LIKE ?
      ORDER BY name ASC
      LIMIT 100
    `).bind(searchTerm, searchTerm, searchTerm).all<Brewery>();
    return results?.map(parseBrewery) || [];
  }

  // Filter by state in search
  const { results } = await env.DB.prepare(`
    SELECT * FROM breweries
    WHERE (name LIKE ? OR city LIKE ? OR region LIKE ?)
      AND state = ?
    ORDER BY name ASC
    LIMIT 100
  `).bind(searchTerm, searchTerm, searchTerm, stateFilter.stateAbbreviation).all<Brewery>();

  return results?.map(parseBrewery) || [];
}

// Get count of breweries by state (for stats)
export async function getBreweryCountByState(env: Env): Promise<Record<string, number>> {
  const { results } = await env.DB.prepare(`
    SELECT state, COUNT(*) as count
    FROM breweries
    WHERE state IS NOT NULL
    GROUP BY state
  `).all<{ state: string; count: number }>();

  const counts: Record<string, number> = {};
  results?.forEach(row => {
    counts[row.state] = row.count;
  });
  return counts;
}

// Helper to parse JSON fields
function parseBrewery(brewery: any): Brewery {
  return {
    ...brewery,
    amenities: brewery.amenities ? JSON.parse(brewery.amenities) : [],
    hours: brewery.hours ? JSON.parse(brewery.hours) : {}
  };
}
