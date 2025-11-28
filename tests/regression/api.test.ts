/**
 * API Regression Tests
 * Tests API endpoints to ensure they don't break during development
 */
import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URLS = {
  multiState: 'https://brewerytrip.com',
  ohio: 'https://ohio.brewerytrip.com',
  michigan: 'https://michigan.brewerytrip.com'
};

// Skip if no network (for CI)
const isOnline = async () => {
  try {
    await fetch('https://brewerytrip.com/health');
    return true;
  } catch {
    return false;
  }
};

describe('API Regression Tests', () => {
  let online: boolean;

  beforeAll(async () => {
    online = await isOnline();
  });

  describe('Health Endpoint', () => {
    it('returns 200 on brewerytrip.com', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data).toHaveProperty('subdomain');
    });

    it('returns correct subdomain context for ohio', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.ohio}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subdomain.stateName).toBe('Ohio');
      expect(data.subdomain.isMultiState).toBe(false);
    });

    it('returns correct subdomain context for michigan', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.michigan}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subdomain.stateName).toBe('Michigan');
      expect(data.subdomain.isMultiState).toBe(false);
    });

    it('returns multi-state context for main domain', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/health`);
      const data = await response.json();

      expect(data.subdomain.isMultiState).toBe(true);
      expect(data.subdomain.stateName).toBeNull();
    });
  });

  describe('Breweries API', () => {
    it('GET /api/breweries returns breweries list', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/breweries`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.breweries)).toBe(true);
      expect(data.breweries.length).toBeGreaterThan(0);
    });

    it('supports limit parameter', async () => {
      if (!online) return;

      // Add cache-bust and no-cache headers to avoid CDN caching
      const cacheBust = Date.now();
      const response = await fetch(`${BASE_URLS.multiState}/api/breweries?limit=5&_cb=${cacheBust}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      // After deployment, returned should be <= limit, count is total
      expect(data.returned || data.breweries.length).toBeLessThanOrEqual(5);
      expect(data.count).toBeGreaterThan(5); // Total should be more than limit
    });

    it('supports search parameter', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/breweries?search=Great`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Results should contain "Great" in name or other fields
    });

    it('brewery objects have required fields', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/breweries?limit=1`);
      const data = await response.json();

      expect(data.breweries.length).toBeGreaterThan(0);

      const brewery = data.breweries[0];
      expect(brewery).toHaveProperty('id');
      expect(brewery).toHaveProperty('name');
      expect(brewery).toHaveProperty('city');
    });
  });

  describe('Regions API', () => {
    it('GET /api/regions returns regions list', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/regions`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.regions)).toBe(true);
    });

    it('each region has name and brewery_count', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/regions`);
      const data = await response.json();

      data.regions.forEach((region: any) => {
        expect(region).toHaveProperty('name');
        // API returns brewery_count field
        expect(region).toHaveProperty('brewery_count');
        expect(typeof region.brewery_count).toBe('number');
      });
    });
  });

  describe('SEO Endpoints', () => {
    it('robots.txt is accessible', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/robots.txt`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/plain');

      const text = await response.text();
      expect(text).toContain('User-agent');
      expect(text).toContain('Sitemap');
    });

    it('sitemap.xml is accessible and valid', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/sitemap.xml`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/xml');

      const xml = await response.text();
      expect(xml).toContain('<?xml version');
      expect(xml).toContain('<urlset');
      expect(xml).toContain('<url>');
    });

    it('sitemap uses correct domain for subdomain', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.ohio}/sitemap.xml`);
      const xml = await response.text();

      expect(xml).toContain('ohio.brewerytrip.com');
    });
  });

  describe('CORS Headers', () => {
    it('includes CORS headers in API responses', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/breweries`);

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });
});
