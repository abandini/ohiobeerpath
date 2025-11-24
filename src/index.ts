import { Hono } from 'hono';
import { cors } from './middleware/cors';
import type { Env } from './types';
import apiRoutes from './routes/api';
import pageRoutes from './routes/pages';

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

// Mount API routes
app.route('/api', apiRoutes);

// Mount page routes (after API routes to avoid conflicts)
app.route('/', pageRoutes);

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
