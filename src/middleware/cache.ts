import { MiddlewareHandler } from 'hono';
import type { Env } from '../types';

const CACHE_TTL = 3600; // 1 hour

export const cacheMiddleware = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    // Only cache GET requests to API
    if (c.req.method !== 'GET' || !c.req.path.startsWith('/api/')) {
      return next();
    }

    const cacheKey = `cache:${c.req.url}`;

    // Try to get from KV cache
    const cached = await c.env.CACHE.get(cacheKey);
    if (cached) {
      return c.json(JSON.parse(cached), 200, {
        'X-Cache': 'HIT'
      });
    }

    // Execute request
    await next();

    // Cache successful JSON responses
    if (c.res.status === 200 && c.res.headers.get('Content-Type')?.includes('application/json')) {
      const clone = c.res.clone();
      const body = await clone.text();

      // Store in KV with TTL
      await c.env.CACHE.put(cacheKey, body, {
        expirationTtl: CACHE_TTL
      });

      c.header('X-Cache', 'MISS');
    }
  };
};
