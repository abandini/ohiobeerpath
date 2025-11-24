import { Hono } from 'hono';
import { cors } from './middleware/cors';
import type { Env } from './types';

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Apply CORS middleware
app.use('*', cors());

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString()
  });
});

// Root route - serve homepage
app.get('/', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ohio Beer Path</title>
    </head>
    <body>
      <h1>Ohio Beer Path</h1>
      <p>Cloudflare Workers + D1 + R2 + KV</p>
      <p>Status: Running on Cloudflare Edge Network</p>
    </body>
    </html>
  `);
});

// API Routes (will be added in next tasks)
app.get('/api/breweries', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM breweries'
  ).first<{ count: number }>();

  return c.json({
    message: 'Breweries API endpoint',
    count: result?.count || 0
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message
  }, 500);
});

export default app;
