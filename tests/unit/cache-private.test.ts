import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { cacheMiddleware } from '../../src/middleware/cache';
import type { Env } from '../../src/types';

function make() {
  const store = new Map<string, string>();
  const CACHE = { get: vi.fn(async (k: string) => store.get(k) ?? null), put: vi.fn(async (k: string, v: string) => { store.set(k, v); }) };
  const app = new Hono<{ Bindings: Env }>();
  app.use('*', cacheMiddleware());
  let n = 0;
  app.get('/api/breweries', (c) => c.json({ n: ++n }));
  app.get('/api/auth/me', (c) => c.json({ email: 'someone@example.com', n: ++n }));
  app.get('/api/admin/vibe-status', (c) => c.json({ n: ++n }));
  return { app, CACHE, env: { CACHE } as unknown as Env };
}

describe('cacheMiddleware', () => {
  it('caches public API reads', async () => {
    const { app, env } = make();
    const a = await (await app.request('/api/breweries', {}, env)).json();
    const res = await app.request('/api/breweries', {}, env);
    expect(res.headers.get('x-cache')).toBe('HIT');
    expect(await res.json()).toEqual(a);
  });
  it('never stores or serves auth, user, rating or admin responses', async () => {
    const { app, CACHE, env } = make();
    for (const p of ['/api/auth/me', '/api/admin/vibe-status']) {
      await app.request(p, {}, env);
      const res = await app.request(p, {}, env);
      expect(res.headers.get('x-cache')).toBeNull();
    }
    expect(CACHE.put).not.toHaveBeenCalled();
  });
  it('bypasses the cache for any request that carries a login', async () => {
    const { app, CACHE, env } = make();
    await app.request('/api/breweries', { headers: { Cookie: '_ga=1; bt_session=abc' } }, env);
    await app.request('/api/breweries', { headers: { Authorization: 'Bearer abc' } }, env);
    expect(CACHE.put).not.toHaveBeenCalled();
    expect(CACHE.get).not.toHaveBeenCalled();
    await app.request('/api/breweries', { headers: { Cookie: '_ga=GA1.1.1' } }, env); // analytics cookies alone still cache
    expect(CACHE.put).toHaveBeenCalledTimes(1);
  });
  it('ignores junk query parameters when building the key', async () => {
    const { app, CACHE, env } = make();
    await app.request('/api/breweries?city=Akron&%24junk%5B%5D=1', {}, env);
    expect(CACHE.put.mock.calls[0][0]).toBe('cache:http://localhost/api/breweries?city=Akron');
  });
});
