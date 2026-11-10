import { MiddlewareHandler } from 'hono';
import type { Env } from '../types';

const CACHE_TTL = 3600; // 1 hour

const PRIVATE_PREFIXES = ['/api/admin', '/api/auth', '/api/users', '/api/ratings'];
export const isPrivate = (path: string) => PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));

export const cacheMiddleware = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    // Only cache GET requests to the public API. Never cache anything that depends on who is asking:
    // admin, auth, user and rating routes, or any request that carries a login (the bt_session cookie or Authorization).
    // Until 2026-11-10 those were cached by URL alone, so one signed-in user's /api/auth/me could be
    // served to everyone for an hour, and a cached admin response bypassed the admin login.
    if (c.req.method !== 'GET' || !c.req.path.startsWith('/api/') || isPrivate(c.req.path)
        || c.req.header('Authorization') || /(?:^|;\s*)bt_session=/.test(c.req.header('Cookie') || '')) {
      return next();
    }

    // Key on the path plus only the query parameters the public API reads, sorted, so arbitrary
    // query strings cannot fill the cache with junk keys.
    const url = new URL(c.req.url);
    const params = [...url.searchParams.entries()].filter(([k, v]) => /^[a-z_]{1,24}$/i.test(k) && v.length <= 120).sort();
    if (params.length > 12) return next();
    const cacheKey = `cache:${url.origin}${url.pathname}?${new URLSearchParams(params).toString()}`;

    // Try to get from KV cache
    const cached = await c.env.CACHE.get(cacheKey);
    if (cached) {
      return c.json(JSON.parse(cached), 200, {
        'X-Cache': 'HIT'
      });
    }

    // Execute request
    await next();

    // Cache successful JSON responses (never one that sets a cookie)
    if (c.res.status === 200 && !c.res.headers.has('Set-Cookie') && c.res.headers.get('Content-Type')?.includes('application/json')) {
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
