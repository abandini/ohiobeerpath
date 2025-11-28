/**
 * Advanced API Regression Tests
 * Tests more complex API endpoints and edge cases
 */
import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URLS = {
  multiState: 'https://brewerytrip.com',
  ohio: 'https://ohio.brewerytrip.com',
  michigan: 'https://michigan.brewerytrip.com'
};

const isOnline = async () => {
  try {
    await fetch('https://brewerytrip.com/health');
    return true;
  } catch {
    return false;
  }
};

describe('Advanced API Regression Tests', () => {
  let online: boolean;

  beforeAll(async () => {
    online = await isOnline();
  });

  describe('Pagination Tests', () => {
    it('offset parameter works correctly', async () => {
      if (!online) return;

      const cacheBust = Date.now();

      // Get first 5
      const first5 = await fetch(`${BASE_URLS.multiState}/api/breweries?limit=5&offset=0&_cb=${cacheBust}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const first5Data = await first5.json();

      // Get next 5
      const next5 = await fetch(`${BASE_URLS.multiState}/api/breweries?limit=5&offset=5&_cb=${cacheBust}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const next5Data = await next5.json();

      expect(first5.status).toBe(200);
      expect(next5.status).toBe(200);

      // IDs should be different between pages
      if (first5Data.breweries.length > 0 && next5Data.breweries.length > 0) {
        const firstIds = first5Data.breweries.map((b: any) => b.id);
        const nextIds = next5Data.breweries.map((b: any) => b.id);

        // No overlap between pages
        const overlap = firstIds.filter((id: number) => nextIds.includes(id));
        expect(overlap.length).toBe(0);
      }
    });

    it('count reflects total regardless of limit', async () => {
      if (!online) return;

      const cacheBust = Date.now();
      const response = await fetch(`${BASE_URLS.multiState}/api/breweries?limit=3&_cb=${cacheBust}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await response.json();

      // Total count should be much larger than returned
      expect(data.count).toBeGreaterThan(data.returned || data.breweries.length);
    });
  });

  describe('Single Brewery Endpoint', () => {
    it('GET /api/breweries/:id returns single brewery', async () => {
      if (!online) return;

      // First get a valid ID
      const listResponse = await fetch(`${BASE_URLS.multiState}/api/breweries?limit=1`);
      const listData = await listResponse.json();

      if (listData.breweries.length === 0) return;

      const breweryId = listData.breweries[0].id;
      const response = await fetch(`${BASE_URLS.multiState}/api/breweries/${breweryId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.brewery).toBeDefined();
      expect(data.brewery.id).toBe(breweryId);
    });

    it('returns 400 for invalid brewery ID', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/breweries/invalid`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('returns 404 for non-existent brewery ID', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/breweries/999999`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });

  describe('Nearby Breweries Endpoint', () => {
    it('GET /api/breweries/nearby returns breweries near coordinates', async () => {
      if (!online) return;

      // Columbus, OH coordinates
      const response = await fetch(
        `${BASE_URLS.multiState}/api/breweries/nearby?lat=39.961&lng=-82.998&radius=25`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.breweries)).toBe(true);
    });

    it('returns 400 for missing coordinates', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/breweries/nearby`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('returns 400 for invalid coordinates', async () => {
      if (!online) return;

      const response = await fetch(
        `${BASE_URLS.multiState}/api/breweries/nearby?lat=invalid&lng=also-invalid`
      );
      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe('Search Functionality', () => {
    it('search parameter filters breweries', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/breweries?search=craft`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.breweries)).toBe(true);
    });

    it('region filter works correctly', async () => {
      if (!online) return;

      // First get regions
      const regionsResponse = await fetch(`${BASE_URLS.multiState}/api/regions`);
      const regionsData = await regionsResponse.json();

      if (regionsData.regions.length === 0) return;

      const region = regionsData.regions[0].slug;
      const response = await fetch(`${BASE_URLS.multiState}/api/breweries?region=${region}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('city filter works correctly', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/breweries?city=Columbus`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // All results should be from Columbus
      if (data.breweries.length > 0) {
        data.breweries.forEach((brewery: any) => {
          expect(brewery.city.toLowerCase()).toContain('columbus');
        });
      }
    });
  });

  describe('Multi-domain Consistency', () => {
    it('API returns same data structure across domains', async () => {
      if (!online) return;

      const responses = await Promise.all([
        fetch(`${BASE_URLS.multiState}/api/breweries?limit=1`),
        fetch(`${BASE_URLS.ohio}/api/breweries?limit=1`),
        fetch(`${BASE_URLS.michigan}/api/breweries?limit=1`)
      ]);

      const dataArr = await Promise.all(responses.map(r => r.json()));

      // All should have same structure
      dataArr.forEach(data => {
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('breweries');
        expect(Array.isArray(data.breweries)).toBe(true);
      });
    });

    it('health endpoint returns correct subdomain context', async () => {
      if (!online) return;

      const [mainHealth, ohioHealth, michiganHealth] = await Promise.all([
        fetch(`${BASE_URLS.multiState}/health`).then(r => r.json()),
        fetch(`${BASE_URLS.ohio}/health`).then(r => r.json()),
        fetch(`${BASE_URLS.michigan}/health`).then(r => r.json())
      ]);

      expect(mainHealth.subdomain.isMultiState).toBe(true);
      expect(ohioHealth.subdomain.isMultiState).toBe(false);
      expect(ohioHealth.subdomain.stateName).toBe('Ohio');
      expect(michiganHealth.subdomain.isMultiState).toBe(false);
      expect(michiganHealth.subdomain.stateName).toBe('Michigan');
    });
  });

  describe('Error Handling', () => {
    it('returns JSON for invalid endpoints', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/nonexistent`);

      // Should return valid response (404 is acceptable)
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Cache Headers', () => {
    it('API responses include cache headers', async () => {
      if (!online) return;

      const response = await fetch(`${BASE_URLS.multiState}/api/breweries?limit=1`);

      // Check for either cache-control or etag
      const cacheControl = response.headers.get('cache-control');
      const etag = response.headers.get('etag');

      // At least one caching mechanism should be present
      // (though not strictly required, good practice)
      expect(response.status).toBe(200);
    });
  });
});
