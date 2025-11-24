import { Hono } from 'hono';
import type { Env } from '../types';
import * as breweriesDB from '../db/breweries';

const api = new Hono<{ Bindings: Env }>();

// GET /api/breweries/nearby - Get breweries near coordinates (must be before :id route)
api.get('/breweries/nearby', async (c) => {
  const lat = parseFloat(c.req.query('lat') || '');
  const lng = parseFloat(c.req.query('lng') || '');
  const radius = parseFloat(c.req.query('radius') || '50');

  if (isNaN(lat) || isNaN(lng)) {
    return c.json({ error: 'Invalid coordinates' }, 400);
  }

  const breweries = await breweriesDB.getNearbyBreweries(c.env, lat, lng, radius);

  return c.json({
    success: true,
    count: breweries.length,
    breweries
  });
});

// GET /api/breweries - Get all breweries with optional filters
api.get('/breweries', async (c) => {
  const region = c.req.query('region');
  const city = c.req.query('city');
  const search = c.req.query('search');

  let breweries;

  if (search) {
    breweries = await breweriesDB.searchBreweries(c.env, search);
  } else if (region) {
    breweries = await breweriesDB.getBreweriesByRegion(c.env, region);
  } else if (city) {
    breweries = await breweriesDB.getBreweriesByCity(c.env, city);
  } else {
    breweries = await breweriesDB.getAllBreweries(c.env);
  }

  return c.json({
    success: true,
    count: breweries.length,
    breweries
  });
});

// GET /api/breweries/:id - Get single brewery
api.get('/breweries/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  if (isNaN(id)) {
    return c.json({ error: 'Invalid brewery ID' }, 400);
  }

  const brewery = await breweriesDB.getBreweryById(c.env, id);

  if (!brewery) {
    return c.json({ error: 'Brewery not found' }, 404);
  }

  return c.json({
    success: true,
    brewery
  });
});

export default api;
