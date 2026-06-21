export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

/**
 * Token-bucket rate limiter backed by KV.
 */
export async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${endpoint}:${ip}`;
  const now = Math.floor(Date.now() / 1000);

  const raw = await kv.get(key);
  let bucket = raw ? JSON.parse(raw) : null;

  if (!bucket || now - bucket.timestamp >= windowSeconds) {
    bucket = { count: 1, timestamp: now };
    await kv.put(key, JSON.stringify(bucket), { expirationTtl: windowSeconds });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (bucket.count >= maxRequests) {
    const retryAfter = windowSeconds - (now - bucket.timestamp);
    return { allowed: false, remaining: 0, retryAfter };
  }

  bucket.count++;
  await kv.put(key, JSON.stringify(bucket), { expirationTtl: windowSeconds });
  return { allowed: true, remaining: maxRequests - bucket.count };
}
