/**
 * Image serving routes
 *
 * Proxies R2 images with optional resizing via Cloudflare Image Resizing
 */
import { Hono } from 'hono';
import type { Env, AppVariables } from '../types';

const images = new Hono<{ Bindings: Env; Variables: AppVariables }>();

/**
 * GET /images/*
 * Serve images from R2 bucket
 */
images.get('/*', async (c) => {
  const path = c.req.path.replace('/images/', '');

  if (!path) {
    return c.json({ error: 'Image path required' }, 400);
  }

  try {
    // Get the object from R2
    const object = await c.env.IMAGES.get(path);

    if (!object) {
      return c.json({ error: 'Image not found' }, 404);
    }

    // Get the content type
    const contentType = object.httpMetadata?.contentType || 'image/jpeg';

    // Return the image with caching headers
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.etag,
        'Accept-Ranges': 'bytes'
      }
    });
  } catch (error) {
    console.error('Image serve error:', error);
    return c.json({ error: 'Failed to serve image' }, 500);
  }
});

/**
 * GET /images/resize/:width/*
 * Serve resized image (width in pixels)
 * Uses Cloudflare Image Resizing if available, otherwise returns original
 */
images.get('/resize/:width/*', async (c) => {
  const width = parseInt(c.req.param('width'));
  const path = c.req.path.replace(`/images/resize/${width}/`, '');

  if (!path || isNaN(width) || width < 1 || width > 4000) {
    return c.json({ error: 'Invalid parameters' }, 400);
  }

  try {
    // Get the object from R2
    const object = await c.env.IMAGES.get(path);

    if (!object) {
      return c.json({ error: 'Image not found' }, 404);
    }

    // Get the content type
    const contentType = object.httpMetadata?.contentType || 'image/jpeg';

    // For now, return original image
    // In production with Image Resizing enabled, we'd transform here
    // Cloudflare's Image Resizing can be enabled on the zone

    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.etag,
        'Vary': 'Accept'
      }
    });
  } catch (error) {
    console.error('Image resize error:', error);
    return c.json({ error: 'Failed to serve image' }, 500);
  }
});

/**
 * GET /images/thumb/:id
 * Get thumbnail for a rating photo by photo ID
 */
images.get('/thumb/:id', async (c) => {
  const photoId = c.req.param('id');

  try {
    // Get photo URL from database
    const photo = await c.env.DB.prepare(
      'SELECT photo_url_thumb, photo_url FROM rating_photos WHERE id = ?'
    ).bind(photoId).first<{ photo_url_thumb: string | null; photo_url: string }>();

    if (!photo) {
      return c.json({ error: 'Photo not found' }, 404);
    }

    // Redirect to the thumbnail URL
    const thumbUrl = photo.photo_url_thumb || photo.photo_url;
    return c.redirect(thumbUrl, 302);
  } catch (error) {
    console.error('Thumbnail error:', error);
    return c.json({ error: 'Failed to get thumbnail' }, 500);
  }
});

export default images;
