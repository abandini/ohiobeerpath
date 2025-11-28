import { MiddlewareHandler } from 'hono';
import type { Env } from '../types';

// Map of static asset paths to content types
// Note: robots.txt and sitemap.xml are now generated dynamically
const ASSETS: Record<string, string> = {
  '/assets/css/styles.css': 'text/css',
  '/assets/css/mobile.css': 'text/css',
  '/service-worker.js': 'application/javascript',
  '/site.webmanifest': 'application/manifest+json',
  '/offline.html': 'text/html'
};

export const serveAssets = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    const path = c.req.path;

    // Check if this is a static asset path
    if (path.startsWith('/assets/') || ASSETS[path]) {
      const contentType = ASSETS[path] || getContentType(path);

      // Try to get from R2
      const object = await c.env.IMAGES.get(path.substring(1)); // Remove leading /

      if (object) {
        return new Response(object.body, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000', // 1 year
            'ETag': object.etag
          }
        });
      }

      // Fallback: Try to serve from bundled assets
      // In production, assets should be in R2
      return c.notFound();
    }

    await next();
  };
};

function getContentType(path: string): string {
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.js')) return 'application/javascript';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.woff2')) return 'font/woff2';
  return 'application/octet-stream';
}
