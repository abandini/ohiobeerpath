/**
 * Beer rating database operations
 */
import type { BeerRating, RatingPhoto, CreateRatingInput, UserStats } from '../types';
import { getOrCreateVisit } from './visits';

export async function getRatingById(
  db: D1Database,
  id: string,
  includePhotos = true
): Promise<BeerRating | null> {
  const rating = await db.prepare(`
    SELECT r.*, b.name as brewery_name, b.city, b.state,
           u.display_name as user_display_name, u.avatar_url as user_avatar
    FROM beer_ratings r
    JOIN breweries b ON r.brewery_id = b.id
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).bind(id).first<any>();

  if (!rating) return null;

  const result: BeerRating = {
    ...rating,
    is_public: !!rating.is_public,
    shared_to: rating.shared_to ? JSON.parse(rating.shared_to) : undefined,
    brewery: {
      id: rating.brewery_id,
      name: rating.brewery_name,
      city: rating.city,
      state: rating.state
    },
    user: {
      id: rating.user_id,
      display_name: rating.user_display_name,
      avatar_url: rating.user_avatar
    }
  };

  if (includePhotos) {
    result.photos = await getPhotosByRatingId(db, id);
  }

  return result;
}

export async function createRating(
  db: D1Database,
  userId: string,
  input: CreateRatingInput
): Promise<BeerRating> {
  // Get or create a visit for this brewery
  const visit = await getOrCreateVisit(db, userId, input.brewery_id, input.itinerary_id);

  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO beer_ratings (
      id, user_id, visit_id, brewery_id, beer_name, beer_style,
      stars, notes, abv, is_public
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    userId,
    visit.id,
    input.brewery_id,
    input.beer_name,
    input.beer_style || null,
    input.stars,
    input.notes || null,
    input.abv || null,
    input.is_public ? 1 : 0
  ).run();

  return (await getRatingById(db, id))!;
}

export async function updateRating(
  db: D1Database,
  id: string,
  userId: string,
  updates: Partial<Pick<BeerRating, 'beer_name' | 'beer_style' | 'stars' | 'notes' | 'abv' | 'is_public'>>
): Promise<BeerRating | null> {
  // Verify ownership
  const existing = await db.prepare(
    'SELECT id FROM beer_ratings WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();

  if (!existing) return null;

  const fields: string[] = ["updated_at = datetime('now')"];
  const values: any[] = [];

  if (updates.beer_name !== undefined) {
    fields.push('beer_name = ?');
    values.push(updates.beer_name);
  }
  if (updates.beer_style !== undefined) {
    fields.push('beer_style = ?');
    values.push(updates.beer_style);
  }
  if (updates.stars !== undefined) {
    fields.push('stars = ?');
    values.push(updates.stars);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }
  if (updates.abv !== undefined) {
    fields.push('abv = ?');
    values.push(updates.abv);
  }
  if (updates.is_public !== undefined) {
    fields.push('is_public = ?');
    values.push(updates.is_public ? 1 : 0);
  }

  values.push(id);
  await db.prepare(`
    UPDATE beer_ratings SET ${fields.join(', ')} WHERE id = ?
  `).bind(...values).run();

  return getRatingById(db, id);
}

export async function deleteRating(db: D1Database, id: string, userId: string): Promise<boolean> {
  const result = await db.prepare(
    'DELETE FROM beer_ratings WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();
  return result.meta.changes > 0;
}

export async function markAsShared(
  db: D1Database,
  id: string,
  platform: 'untappd' | 'ratebeer' | 'twitter' | 'facebook'
): Promise<void> {
  const rating = await db.prepare(
    'SELECT shared_to FROM beer_ratings WHERE id = ?'
  ).bind(id).first<{ shared_to: string | null }>();

  const platforms = rating?.shared_to ? JSON.parse(rating.shared_to) : [];
  if (!platforms.includes(platform)) {
    platforms.push(platform);
  }

  await db.prepare(
    'UPDATE beer_ratings SET shared_to = ? WHERE id = ?'
  ).bind(JSON.stringify(platforms), id).run();
}

export async function getUserRatings(
  db: D1Database,
  userId: string,
  limit = 20,
  offset = 0,
  publicOnly = false
): Promise<BeerRating[]> {
  const whereClause = publicOnly ? 'AND r.is_public = 1' : '';
  const results = await db.prepare(`
    SELECT r.*, b.name as brewery_name, b.city, b.state
    FROM beer_ratings r
    JOIN breweries b ON r.brewery_id = b.id
    WHERE r.user_id = ? ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, limit, offset).all();

  const ratings: BeerRating[] = [];
  for (const row of results.results || []) {
    const r = row as any;
    ratings.push({
      ...r,
      is_public: !!r.is_public,
      shared_to: r.shared_to ? JSON.parse(r.shared_to) : undefined,
      brewery: {
        id: r.brewery_id,
        name: r.brewery_name,
        city: r.city,
        state: r.state
      },
      photos: await getPhotosByRatingId(db, r.id)
    });
  }

  return ratings;
}

export async function getBreweryRatings(
  db: D1Database,
  breweryId: number,
  publicOnly = true,
  limit = 20,
  offset = 0
): Promise<BeerRating[]> {
  const whereClause = publicOnly ? 'AND r.is_public = 1' : '';
  const results = await db.prepare(`
    SELECT r.*, u.display_name as user_display_name, u.avatar_url as user_avatar
    FROM beer_ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.brewery_id = ? ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(breweryId, limit, offset).all();

  const ratings: BeerRating[] = [];
  for (const row of results.results || []) {
    const r = row as any;
    ratings.push({
      ...r,
      is_public: !!r.is_public,
      shared_to: r.shared_to ? JSON.parse(r.shared_to) : undefined,
      user: {
        id: r.user_id,
        display_name: r.user_display_name,
        avatar_url: r.user_avatar
      },
      photos: await getPhotosByRatingId(db, r.id)
    });
  }

  return ratings;
}

export async function getPopularBeers(
  db: D1Database,
  breweryId: number,
  limit = 10
): Promise<{ beer_name: string; count: number; avg_rating: number }[]> {
  const results = await db.prepare(`
    SELECT beer_name, COUNT(*) as count, AVG(stars) as avg_rating
    FROM beer_ratings
    WHERE brewery_id = ? AND is_public = 1
    GROUP BY beer_name
    ORDER BY count DESC, avg_rating DESC
    LIMIT ?
  `).bind(breweryId, limit).all();

  return (results.results || []).map((r: any) => ({
    beer_name: r.beer_name,
    count: r.count,
    avg_rating: Math.round(r.avg_rating * 10) / 10
  }));
}

export async function getUserStats(db: D1Database, userId: string): Promise<UserStats> {
  const [counts, avgRating, favoriteStyle, thisMonth, recentRatings] = await Promise.all([
    db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM beer_ratings WHERE user_id = ?) as total_ratings,
        (SELECT COUNT(DISTINCT brewery_id) FROM brewery_visits WHERE user_id = ?) as total_breweries,
        (SELECT COUNT(*) FROM rating_photos rp
         JOIN beer_ratings r ON rp.rating_id = r.id
         WHERE r.user_id = ?) as total_photos
    `).bind(userId, userId, userId).first<any>(),

    db.prepare(
      'SELECT AVG(stars) as avg FROM beer_ratings WHERE user_id = ?'
    ).bind(userId).first<{ avg: number }>(),

    db.prepare(`
      SELECT beer_style, COUNT(*) as count FROM beer_ratings
      WHERE user_id = ? AND beer_style IS NOT NULL
      GROUP BY beer_style ORDER BY count DESC LIMIT 1
    `).bind(userId).first<{ beer_style: string; count: number }>(),

    db.prepare(`
      SELECT COUNT(*) as count FROM beer_ratings
      WHERE user_id = ? AND created_at >= date('now', '-30 days')
    `).bind(userId).first<{ count: number }>(),

    getUserRatings(db, userId, 5, 0)
  ]);

  return {
    total_ratings: counts?.total_ratings || 0,
    total_breweries: counts?.total_breweries || 0,
    total_photos: counts?.total_photos || 0,
    average_rating: Math.round((avgRating?.avg || 0) * 10) / 10,
    favorite_style: favoriteStyle?.beer_style,
    ratings_this_month: thisMonth?.count || 0,
    recent_ratings: recentRatings
  };
}

// Photo operations

export async function getPhotosByRatingId(db: D1Database, ratingId: string): Promise<RatingPhoto[]> {
  const results = await db.prepare(
    'SELECT * FROM rating_photos WHERE rating_id = ? ORDER BY sort_order'
  ).bind(ratingId).all<RatingPhoto>();
  return results.results || [];
}

export async function addPhoto(
  db: D1Database,
  ratingId: string,
  photoUrl: string,
  photoUrlOriginal?: string,
  photoUrlThumb?: string
): Promise<RatingPhoto> {
  const id = crypto.randomUUID();
  const maxOrder = await db.prepare(
    'SELECT MAX(sort_order) as max FROM rating_photos WHERE rating_id = ?'
  ).bind(ratingId).first<{ max: number | null }>();

  const sortOrder = (maxOrder?.max || 0) + 1;

  await db.prepare(`
    INSERT INTO rating_photos (id, rating_id, photo_url, photo_url_original, photo_url_thumb, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, ratingId, photoUrl, photoUrlOriginal || null, photoUrlThumb || null, sortOrder).run();

  return {
    id,
    rating_id: ratingId,
    photo_url: photoUrl,
    photo_url_original: photoUrlOriginal,
    photo_url_thumb: photoUrlThumb,
    sort_order: sortOrder,
    created_at: new Date().toISOString()
  };
}

export async function deletePhoto(db: D1Database, photoId: string, userId: string): Promise<boolean> {
  // Verify ownership through rating
  const result = await db.prepare(`
    DELETE FROM rating_photos
    WHERE id = ? AND rating_id IN (
      SELECT id FROM beer_ratings WHERE user_id = ?
    )
  `).bind(photoId, userId).run();
  return result.meta.changes > 0;
}
