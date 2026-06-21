import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../../src/services/rate-limit';

function createMockKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) || null,
    put: async (key: string, value: string) => { store.set(key, value); },
    delete: async () => {},
    list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
    getWithMetadata: async () => ({ value: null, metadata: null, cacheStatus: null }),
  } as any;
}

describe('checkRateLimit', () => {
  it('allows requests under the limit', async () => {
    const kv = createMockKV();
    const result = await checkRateLimit(kv, '1.2.3.4', 'plan', 10, 900);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('blocks requests over the limit', async () => {
    const kv = createMockKV();
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(kv, '1.2.3.4', 'plan', 10, 900);
    }
    const result = await checkRateLimit(kv, '1.2.3.4', 'plan', 10, 900);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('tracks IPs independently', async () => {
    const kv = createMockKV();
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(kv, '1.2.3.4', 'plan', 10, 900);
    }
    const result = await checkRateLimit(kv, '5.6.7.8', 'plan', 10, 900);
    expect(result.allowed).toBe(true);
  });

  it('tracks endpoints independently', async () => {
    const kv = createMockKV();
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(kv, '1.2.3.4', 'plan', 10, 900);
    }
    const result = await checkRateLimit(kv, '1.2.3.4', 'refine', 20, 900);
    expect(result.allowed).toBe(true);
  });
});
