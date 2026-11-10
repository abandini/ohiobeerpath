import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { adminAuth } from '../../src/routes/admin';
import type { Env } from '../../src/types';

function make() {
  const app = new Hono<{ Bindings: Env }>();
  app.use('/api/admin/*', adminAuth);
  app.post('/api/admin/run', (c) => c.json({ ran: true }));
  return app;
}
const basic = (u: string, p: string) => ({ Authorization: 'Basic ' + btoa(`${u}:${p}`) });
const PASS = 'a-long-test-only-value';

describe('adminAuth', () => {
  it('is off (503) when no ADMIN_PASS secret is set: there is no default password', async () => {
    const res = await make().request('/api/admin/run', { method: 'POST', headers: basic('admin', 'ohiobeer2024') }, {} as Env);
    expect(res.status).toBe(503);
  });
  it('is off when the secret is too short to be a real password', async () => {
    const res = await make().request('/api/admin/run', { method: 'POST', headers: basic('admin', 'short') }, { ADMIN_PASS: 'short' } as Env);
    expect(res.status).toBe(503);
  });
  it('returns 401 without or with wrong credentials', async () => {
    const env = { ADMIN_PASS: PASS } as Env;
    expect((await make().request('/api/admin/run', { method: 'POST' }, env)).status).toBe(401);
    expect((await make().request('/api/admin/run', { method: 'POST', headers: basic('admin', 'wrong-wrong-wrong') }, env)).status).toBe(401);
    expect((await make().request('/api/admin/run', { method: 'POST', headers: { Authorization: 'Basic %%%' } }, env)).status).toBe(401);
  });
  it('lets the right credentials through and marks the response no-store', async () => {
    const res = await make().request('/api/admin/run', { method: 'POST', headers: basic('admin', PASS) }, { ADMIN_PASS: PASS } as Env);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});
