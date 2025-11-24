import { MiddlewareHandler } from 'hono';

export const cors = (): MiddlewareHandler => {
  return async (c, next) => {
    await next();

    // Add CORS headers
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (c.req.method === 'OPTIONS') {
      return c.text('', 204);
    }
  };
};
