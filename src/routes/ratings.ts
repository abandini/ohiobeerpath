/**
 * Beer ratings API routes
 */
import { Hono } from 'hono';
import type { Env, AppVariables, CreateRatingInput } from '../types';
import { requireAuth, getCurrentUser, optionalAuth } from '../middleware/auth';
import {
  createRating,
  getRatingById,
  updateRating,
  deleteRating,
  getUserRatings,
  getBreweryRatings,
  getPopularBeers,
  getUserStats,
  markAsShared,
  addPhoto,
  deletePhoto
} from '../db/ratings';
import { BEER_STYLES_SIMPLE } from '../types';
import { uploadPhoto as uploadPhotoToR2 } from '../services/image';

const ratings = new Hono<{ Bindings: Env; Variables: AppVariables }>();

/**
 * POST /api/ratings
 * Create a new beer rating
 */
ratings.post('/', requireAuth, async (c) => {
  const user = getCurrentUser(c)!;

  try {
    const body = await c.req.json<CreateRatingInput>();

    // Validate required fields
    if (!body.brewery_id || typeof body.brewery_id !== 'number') {
      return c.json({ success: false, error: 'brewery_id is required' }, 400);
    }
    if (!body.beer_name || typeof body.beer_name !== 'string' || body.beer_name.trim() === '') {
      return c.json({ success: false, error: 'beer_name is required' }, 400);
    }
    if (!body.stars || ![1, 2, 3, 4, 5].includes(body.stars)) {
      return c.json({ success: false, error: 'stars must be 1-5' }, 400);
    }

    // Validate optional fields
    if (body.abv !== undefined && (typeof body.abv !== 'number' || body.abv < 0 || body.abv > 100)) {
      return c.json({ success: false, error: 'abv must be 0-100' }, 400);
    }

    // Determine privacy based on user preference
    let isPublic = body.is_public;
    if (isPublic === undefined) {
      if (user.privacy_default === 'public') {
        isPublic = true;
      } else if (user.privacy_default === 'private') {
        isPublic = false;
      }
      // If 'ask', leave it undefined for frontend to handle
    }

    const rating = await createRating(c.env.DB, user.id, {
      ...body,
      beer_name: body.beer_name.trim(),
      is_public: isPublic
    });

    return c.json({ success: true, rating }, 201);
  } catch (error) {
    console.error('Create rating error:', error);
    return c.json({ success: false, error: 'Failed to create rating' }, 500);
  }
});

/**
 * GET /api/ratings
 * Get current user's ratings
 */
ratings.get('/', requireAuth, async (c) => {
  const user = getCurrentUser(c)!;
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    const userRatings = await getUserRatings(c.env.DB, user.id, limit, offset);
    return c.json({ success: true, ratings: userRatings, count: userRatings.length });
  } catch (error) {
    console.error('Get ratings error:', error);
    return c.json({ success: false, error: 'Failed to get ratings' }, 500);
  }
});

/**
 * GET /api/ratings/stats
 * Get current user's stats
 */
ratings.get('/stats', requireAuth, async (c) => {
  const user = getCurrentUser(c)!;

  try {
    const stats = await getUserStats(c.env.DB, user.id);
    return c.json({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ success: false, error: 'Failed to get stats' }, 500);
  }
});

/**
 * GET /api/ratings/styles
 * Get available beer styles
 */
ratings.get('/styles', (c) => {
  const preference = c.req.query('preference') || 'simple';
  // For now, just return simple styles. Comprehensive list can be added later.
  return c.json({
    success: true,
    styles: BEER_STYLES_SIMPLE,
    preference
  });
});

/**
 * GET /api/ratings/:id
 * Get a single rating
 */
ratings.get('/:id', optionalAuth, async (c) => {
  const id = c.req.param('id');
  const user = getCurrentUser(c);

  try {
    const rating = await getRatingById(c.env.DB, id);

    if (!rating) {
      return c.json({ success: false, error: 'Rating not found' }, 404);
    }

    // Check access for private ratings
    if (!rating.is_public && rating.user_id !== user?.id) {
      return c.json({ success: false, error: 'Rating not found' }, 404);
    }

    return c.json({ success: true, rating });
  } catch (error) {
    console.error('Get rating error:', error);
    return c.json({ success: false, error: 'Failed to get rating' }, 500);
  }
});

/**
 * PUT /api/ratings/:id
 * Update a rating
 */
ratings.put('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const user = getCurrentUser(c)!;

  try {
    const body = await c.req.json();
    const updates: any = {};

    if (body.beer_name !== undefined) {
      if (typeof body.beer_name !== 'string' || body.beer_name.trim() === '') {
        return c.json({ success: false, error: 'beer_name cannot be empty' }, 400);
      }
      updates.beer_name = body.beer_name.trim();
    }
    if (body.beer_style !== undefined) updates.beer_style = body.beer_style;
    if (body.stars !== undefined) {
      if (![1, 2, 3, 4, 5].includes(body.stars)) {
        return c.json({ success: false, error: 'stars must be 1-5' }, 400);
      }
      updates.stars = body.stars;
    }
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.abv !== undefined) {
      if (body.abv !== null && (typeof body.abv !== 'number' || body.abv < 0 || body.abv > 100)) {
        return c.json({ success: false, error: 'abv must be 0-100' }, 400);
      }
      updates.abv = body.abv;
    }
    if (body.is_public !== undefined) updates.is_public = !!body.is_public;

    const rating = await updateRating(c.env.DB, id, user.id, updates);

    if (!rating) {
      return c.json({ success: false, error: 'Rating not found or unauthorized' }, 404);
    }

    return c.json({ success: true, rating });
  } catch (error) {
    console.error('Update rating error:', error);
    return c.json({ success: false, error: 'Failed to update rating' }, 500);
  }
});

/**
 * DELETE /api/ratings/:id
 * Delete a rating
 */
ratings.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const user = getCurrentUser(c)!;

  try {
    const deleted = await deleteRating(c.env.DB, id, user.id);

    if (!deleted) {
      return c.json({ success: false, error: 'Rating not found or unauthorized' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete rating error:', error);
    return c.json({ success: false, error: 'Failed to delete rating' }, 500);
  }
});

/**
 * POST /api/ratings/:id/share
 * Mark rating as shared to a platform
 */
ratings.post('/:id/share', requireAuth, async (c) => {
  const id = c.req.param('id');
  const user = getCurrentUser(c)!;

  try {
    const body = await c.req.json<{ platform: string }>();
    const validPlatforms = ['untappd', 'ratebeer', 'twitter', 'facebook'];

    if (!body.platform || !validPlatforms.includes(body.platform)) {
      return c.json({ success: false, error: 'Invalid platform' }, 400);
    }

    // Verify ownership
    const rating = await getRatingById(c.env.DB, id);
    if (!rating || rating.user_id !== user.id) {
      return c.json({ success: false, error: 'Rating not found' }, 404);
    }

    await markAsShared(c.env.DB, id, body.platform as any);

    return c.json({ success: true });
  } catch (error) {
    console.error('Share rating error:', error);
    return c.json({ success: false, error: 'Failed to record share' }, 500);
  }
});

/**
 * POST /api/ratings/:id/photos
 * Upload photo(s) for a rating
 */
ratings.post('/:id/photos', requireAuth, async (c) => {
  const ratingId = c.req.param('id');
  const user = getCurrentUser(c)!;

  try {
    // Verify ownership
    const rating = await getRatingById(c.env.DB, ratingId, false);
    if (!rating || rating.user_id !== user.id) {
      return c.json({ success: false, error: 'Rating not found' }, 404);
    }

    // Handle multipart form data
    const formData = await c.req.formData();
    const photoEntries = formData.getAll('photos');

    // Filter for File objects (FormDataEntryValue can be string or File)
    const photos: File[] = [];
    for (const entry of photoEntries) {
      if (typeof entry !== 'string' && 'arrayBuffer' in entry) {
        photos.push(entry as File);
      }
    }

    if (photos.length === 0) {
      return c.json({ success: false, error: 'No photos provided' }, 400);
    }

    // Limit photos per rating
    const existingPhotos = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM rating_photos WHERE rating_id = ?'
    ).bind(ratingId).first<{ count: number }>();

    if ((existingPhotos?.count || 0) + photos.length > 5) {
      return c.json({ success: false, error: 'Maximum 5 photos per rating' }, 400);
    }

    const uploadedPhotos = [];

    for (const photo of photos) {
      // Validate file type
      const contentType = photo.type || 'image/jpeg';
      if (!contentType.startsWith('image/')) {
        continue;
      }

      // Upload to R2 with automatic resizing support
      const uploadResult = await uploadPhotoToR2(
        c.env,
        photo,
        user.id,
        ratingId,
        contentType
      );

      if (!uploadResult.success || !uploadResult.urls) {
        console.error('Photo upload failed:', uploadResult.error);
        continue;
      }

      // Add to database with all URL variants
      const photoRecord = await addPhoto(
        c.env.DB,
        ratingId,
        uploadResult.urls.display,      // Main display URL (1200px)
        uploadResult.urls.original,     // Original full-res
        uploadResult.urls.thumbnail     // Thumbnail (400px)
      );
      uploadedPhotos.push(photoRecord);
    }

    return c.json({ success: true, photos: uploadedPhotos });
  } catch (error) {
    console.error('Upload photo error:', error);
    return c.json({ success: false, error: 'Failed to upload photos' }, 500);
  }
});

/**
 * DELETE /api/photos/:id
 * Delete a photo
 */
ratings.delete('/photos/:id', requireAuth, async (c) => {
  const photoId = c.req.param('id');
  const user = getCurrentUser(c)!;

  try {
    const deleted = await deletePhoto(c.env.DB, photoId, user.id);

    if (!deleted) {
      return c.json({ success: false, error: 'Photo not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    return c.json({ success: false, error: 'Failed to delete photo' }, 500);
  }
});

// Brewery-specific rating endpoints (public)

/**
 * GET /api/breweries/:id/ratings
 * Get public ratings for a brewery
 */
ratings.get('/brewery/:breweryId', optionalAuth, async (c) => {
  const breweryId = parseInt(c.req.param('breweryId'));
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    const breweryRatings = await getBreweryRatings(c.env.DB, breweryId, true, limit, offset);
    return c.json({ success: true, ratings: breweryRatings, count: breweryRatings.length });
  } catch (error) {
    console.error('Get brewery ratings error:', error);
    return c.json({ success: false, error: 'Failed to get ratings' }, 500);
  }
});

/**
 * GET /api/breweries/:id/popular
 * Get popular beers at a brewery
 */
ratings.get('/brewery/:breweryId/popular', async (c) => {
  const breweryId = parseInt(c.req.param('breweryId'));
  const limit = Math.min(parseInt(c.req.query('limit') || '10'), 20);

  try {
    const beers = await getPopularBeers(c.env.DB, breweryId, limit);
    return c.json({ success: true, beers });
  } catch (error) {
    console.error('Get popular beers error:', error);
    return c.json({ success: false, error: 'Failed to get popular beers' }, 500);
  }
});

export default ratings;
