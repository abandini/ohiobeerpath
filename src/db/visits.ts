/**
 * Brewery visit database operations
 */
import type { BreweryVisit } from '../types';

export async function getVisitById(db: D1Database, id: string): Promise<BreweryVisit | null> {
  const result = await db.prepare(
    'SELECT * FROM brewery_visits WHERE id = ?'
  ).bind(id).first<BreweryVisit>();
  return result || null;
}

export async function getOrCreateVisit(
  db: D1Database,
  userId: string,
  breweryId: number,
  itineraryId?: string
): Promise<BreweryVisit> {
  // Check for existing visit today
  const today = new Date().toISOString().split('T')[0];
  const existing = await db.prepare(`
    SELECT * FROM brewery_visits
    WHERE user_id = ? AND brewery_id = ? AND date(visited_at) = ?
    ORDER BY visited_at DESC LIMIT 1
  `).bind(userId, breweryId, today).first<BreweryVisit>();

  if (existing) return existing;

  // Create new visit
  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO brewery_visits (id, user_id, brewery_id, itinerary_id)
    VALUES (?, ?, ?, ?)
  `).bind(id, userId, breweryId, itineraryId || null).run();

  return (await getVisitById(db, id))!;
}

export async function getUserVisits(
  db: D1Database,
  userId: string,
  limit = 50,
  offset = 0
): Promise<BreweryVisit[]> {
  const results = await db.prepare(`
    SELECT bv.*, b.name as brewery_name, b.city, b.state
    FROM brewery_visits bv
    JOIN breweries b ON bv.brewery_id = b.id
    WHERE bv.user_id = ?
    ORDER BY bv.visited_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, limit, offset).all<BreweryVisit>();

  return results.results || [];
}

export async function getBreweryVisitCount(db: D1Database, breweryId: number): Promise<number> {
  const result = await db.prepare(
    'SELECT COUNT(DISTINCT user_id) as count FROM brewery_visits WHERE brewery_id = ?'
  ).bind(breweryId).first<{ count: number }>();
  return result?.count || 0;
}

export async function getUserBreweryCount(db: D1Database, userId: string): Promise<number> {
  const result = await db.prepare(
    'SELECT COUNT(DISTINCT brewery_id) as count FROM brewery_visits WHERE user_id = ?'
  ).bind(userId).first<{ count: number }>();
  return result?.count || 0;
}

export async function hasUserVisited(
  db: D1Database,
  userId: string,
  breweryId: number
): Promise<boolean> {
  const result = await db.prepare(
    'SELECT 1 FROM brewery_visits WHERE user_id = ? AND brewery_id = ? LIMIT 1'
  ).bind(userId, breweryId).first();
  return !!result;
}
