import { Hono } from 'hono';
import type { Env } from '../types';
import * as breweriesDB from '../db/breweries';
import { homePage } from '../templates/home';
import { breweriesPage } from '../templates/breweries';

const pages = new Hono<{ Bindings: Env }>();

// Home page
pages.get('/', async (c) => {
  const allBreweries = await breweriesDB.getAllBreweries(c.env);
  const featured = allBreweries.slice(0, 6); // First 6 as featured

  const regions = new Set(allBreweries.map(b => b.region).filter(Boolean));

  const html = homePage(featured, {
    total: allBreweries.length,
    regions: regions.size
  });

  return c.html(html);
});

// Breweries page
pages.get('/breweries', async (c) => {
  const region = c.req.query('region');
  const search = c.req.query('search');

  let breweries;
  if (search) {
    breweries = await breweriesDB.searchBreweries(c.env, search);
  } else if (region) {
    breweries = await breweriesDB.getBreweriesByRegion(c.env, region);
  } else {
    breweries = await breweriesDB.getAllBreweries(c.env);
  }

  const html = breweriesPage(breweries, region);
  return c.html(html);
});

// Single brewery page
pages.get('/brewery/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const brewery = await breweriesDB.getBreweryById(c.env, id);

  if (!brewery) {
    return c.html('<h1>Brewery not found</h1>', 404);
  }

  // TODO: Create brewery detail template
  return c.html(`<h1>${brewery.name}</h1><pre>${JSON.stringify(brewery, null, 2)}</pre>`);
});

export default pages;
