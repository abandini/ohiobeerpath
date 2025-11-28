import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import type { Env } from '../types';
import * as breweriesDB from '../db/breweries';
import {
  adminDashboard,
  adminBreweriesPage,
  adminSubscribersPage,
  adminAIToolsPage,
  adminReviewsPage,
  adminCheckInsPage,
  adminEventsPage,
  adminTrailsPage
} from '../templates/admin';

const admin = new Hono<{ Bindings: Env }>();

// Basic auth middleware for admin routes
admin.use('*', async (c, next) => {
  // Get admin credentials from environment
  const adminUser = c.env.ADMIN_USER || 'admin';
  const adminPass = c.env.ADMIN_PASS || 'ohiobeer2024';

  const auth = basicAuth({
    username: adminUser,
    password: adminPass,
  });

  return auth(c, next);
});

// Dashboard
admin.get('/', async (c) => {
  const db = c.env.DB;

  // Fetch stats
  const [
    breweriesResult,
    checkInsResult,
    reviewsResult,
    subscribersResult,
    sharedToursResult,
    recentCheckInsResult,
    recentReviewsResult,
    regionsResult
  ] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM breweries').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM check_ins').first<{ count: number }>().catch(() => ({ count: 0 })),
    db.prepare('SELECT COUNT(*) as count FROM reviews').first<{ count: number }>().catch(() => ({ count: 0 })),
    db.prepare('SELECT COUNT(*) as count FROM email_subscribers').first<{ count: number }>().catch(() => ({ count: 0 })),
    db.prepare('SELECT COUNT(*) as count FROM shared_tours').first<{ count: number }>().catch(() => ({ count: 0 })),
    db.prepare('SELECT * FROM check_ins ORDER BY created_at DESC LIMIT 10').all().catch(() => ({ results: [] })),
    db.prepare('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 10').all().catch(() => ({ results: [] })),
    db.prepare('SELECT region, COUNT(*) as count FROM breweries WHERE region IS NOT NULL GROUP BY region ORDER BY count DESC').all<{ region: string; count: number }>()
  ]);

  const stats = {
    totalBreweries: breweriesResult?.count || 0,
    totalCheckIns: checkInsResult?.count || 0,
    totalReviews: reviewsResult?.count || 0,
    totalSubscribers: subscribersResult?.count || 0,
    totalSharedTours: sharedToursResult?.count || 0,
    recentCheckIns: recentCheckInsResult?.results || [],
    recentReviews: recentReviewsResult?.results || [],
    topBreweries: [],
    regionCounts: regionsResult?.results || []
  };

  const html = adminDashboard(stats);
  return c.html(html);
});

// Breweries list
admin.get('/breweries', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const perPage = 25;
  const offset = (page - 1) * perPage;

  const [breweriesResult, countResult] = await Promise.all([
    c.env.DB.prepare(`SELECT * FROM breweries ORDER BY name ASC LIMIT ${perPage} OFFSET ${offset}`).all<any>(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM breweries').first<{ count: number }>()
  ]);

  const html = adminBreweriesPage(
    breweriesResult?.results || [],
    page,
    countResult?.count || 0
  );
  return c.html(html);
});

// Reviews
admin.get('/reviews', async (c) => {
  const reviewsResult = await c.env.DB.prepare(
    'SELECT * FROM reviews ORDER BY created_at DESC LIMIT 100'
  ).all().catch(() => ({ results: [] }));

  const html = adminReviewsPage(reviewsResult?.results || []);
  return c.html(html);
});

// Check-ins
admin.get('/check-ins', async (c) => {
  const checkInsResult = await c.env.DB.prepare(
    'SELECT * FROM check_ins ORDER BY created_at DESC LIMIT 100'
  ).all().catch(() => ({ results: [] }));

  const html = adminCheckInsPage(checkInsResult?.results || []);
  return c.html(html);
});

// Trails
admin.get('/trails', async (c) => {
  const trailsResult = await c.env.DB.prepare(
    'SELECT * FROM trails ORDER BY featured DESC, name ASC'
  ).all().catch(() => ({ results: [] }));

  const html = adminTrailsPage(trailsResult?.results || []);
  return c.html(html);
});

// Events
admin.get('/events', async (c) => {
  const eventsResult = await c.env.DB.prepare(
    'SELECT * FROM events ORDER BY event_date DESC LIMIT 100'
  ).all().catch(() => ({ results: [] }));

  const html = adminEventsPage(eventsResult?.results || []);
  return c.html(html);
});

// Subscribers
admin.get('/subscribers', async (c) => {
  const subscribersResult = await c.env.DB.prepare(
    'SELECT * FROM email_subscribers ORDER BY created_at DESC'
  ).all().catch(() => ({ results: [] }));

  const html = adminSubscribersPage(subscribersResult?.results || []);
  return c.html(html);
});

// AI Tools
admin.get('/ai-tools', (c) => {
  const html = adminAIToolsPage();
  return c.html(html);
});

export default admin;
