import { Hono } from 'hono';
import { cors } from './middleware/cors';
import { serveAssets } from './middleware/assets';
import { cacheMiddleware } from './middleware/cache';
import { subdomainMiddleware } from './middleware/subdomain';
import { optionalAuth } from './middleware/auth';
import type { Env, Brewery, AppVariables } from './types';
import apiRoutes from './routes/api';
import pageRoutes from './routes/pages';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import ratingsRoutes from './routes/ratings';

// Create Hono app with subdomain context
const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// Apply CORS middleware
app.use('*', cors());

// Apply subdomain detection (before other middleware)
app.use('*', subdomainMiddleware());

// Serve static assets
app.use('*', serveAssets());

// Apply caching middleware (before routes)
app.use('*', cacheMiddleware());

// Apply optional auth middleware (populates user if logged in)
app.use('*', optionalAuth);

// Health check endpoint
app.get('/health', (c) => {
  const subdomain = c.get('subdomain');
  return c.json({
    status: 'ok',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
    subdomain: subdomain
  });
});

// SEO: robots.txt
app.get('/robots.txt', (c) => {
  const subdomain = c.get('subdomain');
  const siteName = subdomain.stateName ? `${subdomain.stateName} Brewery Trip` : 'Brewery Trip';

  const robotsTxt = `# ${siteName} - Robots.txt
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${subdomain.baseUrl}/sitemap.xml

# Disallow admin and API endpoints
Disallow: /admin/
Disallow: /api/

# Crawl delay for polite crawling
Crawl-delay: 1
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  });
});

// SEO: Dynamic XML Sitemap
app.get('/sitemap.xml', async (c) => {
  const subdomain = c.get('subdomain');
  const baseUrl = subdomain.baseUrl;
  const today = new Date().toISOString().split('T')[0];

  // Get breweries - filter by state if on subdomain
  let query = 'SELECT id, region, state FROM breweries';
  if (subdomain.stateName) {
    query += ` WHERE state = '${subdomain.stateName}' OR state_province = '${subdomain.stateName}'`;
  }

  const { results: allBreweries } = await c.env.DB.prepare(query)
    .all<{ id: number; region: string; state: string }>();

  // Get all regions
  const regions = [...new Set((allBreweries || []).map(b => b.region).filter(Boolean))];

  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/breweries', priority: '0.9', changefreq: 'daily' },
    { url: '/regions', priority: '0.8', changefreq: 'weekly' },
    { url: '/events', priority: '0.8', changefreq: 'daily' },
    { url: '/trails', priority: '0.7', changefreq: 'weekly' },
    { url: '/nearby', priority: '0.7', changefreq: 'weekly' },
    { url: '/blog', priority: '0.6', changefreq: 'weekly' },
    { url: '/itinerary', priority: '0.6', changefreq: 'monthly' },
    { url: '/about', priority: '0.5', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add static pages
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // Add brewery pages
  for (const brewery of (allBreweries || [])) {
    xml += `  <url>
    <loc>${baseUrl}/brewery/${brewery.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  // Add region pages
  for (const region of regions) {
    xml += `  <url>
    <loc>${baseUrl}/regions/${region?.toLowerCase()}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  xml += '</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400'
    }
  });
});

// Admin endpoint to seed embeddings (protected by simple check)
app.post('/api/admin/seed-embeddings', async (c) => {
  const result = await seedEmbeddings(c.env);
  return c.json(result);
});

// Admin endpoint to enrich brewery descriptions using AI
app.post('/api/admin/enrich-descriptions', async (c) => {
  const result = await enrichDescriptions(c.env);
  return c.json(result);
});

// Mount API routes
app.route('/api', apiRoutes);

// Mount auth routes
app.route('/api/auth', authRoutes);

// Mount ratings routes
app.route('/api/ratings', ratingsRoutes);

// Mount admin routes (password protected)
app.route('/admin', adminRoutes);

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

// Seed embeddings helper function
async function seedEmbeddings(env: Env): Promise<{ success: boolean; processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  try {
    const { results: breweries } = await env.DB.prepare(
      'SELECT id, name, city, region, brewery_type, description FROM breweries'
    ).all<Brewery>();

    if (!breweries || breweries.length === 0) {
      return { success: false, processed: 0, errors: ['No breweries found'] };
    }

    const batchSize = 10;
    const vectors: { id: string; values: number[]; metadata: Record<string, string> }[] = [];

    for (let i = 0; i < breweries.length; i += batchSize) {
      const batch = breweries.slice(i, i + batchSize);

      for (const brewery of batch) {
        try {
          const textToEmbed = [
            brewery.name,
            brewery.city,
            brewery.region,
            brewery.brewery_type,
            brewery.description
          ].filter(Boolean).join(' | ');

          const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
            text: textToEmbed
          }) as any;

          const embeddingData = embeddingResponse?.data || embeddingResponse;
          const vector = Array.isArray(embeddingData) ? embeddingData[0] : embeddingData;

          if (Array.isArray(vector) && vector.length === 768) {
            vectors.push({
              id: String(brewery.id),
              values: vector,
              metadata: {
                name: brewery.name || '',
                city: brewery.city || '',
                region: brewery.region || ''
              }
            });
            processed++;
          }
        } catch (err: any) {
          errors.push(`Brewery ${brewery.id}: ${err.message}`);
        }
      }
    }

    if (vectors.length > 0) {
      for (let i = 0; i < vectors.length; i += 100) {
        const batch = vectors.slice(i, i + 100);
        await env.VECTORIZE.upsert(batch);
      }
    }

    return { success: true, processed, errors };
  } catch (err: any) {
    return { success: false, processed, errors: [...errors, err.message] };
  }
}

// Batch vibe inference for cron
async function processVibeInference(env: Env): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  try {
    // Get breweries that haven't been processed recently (older than 7 days or never)
    const { results: breweries } = await env.DB.prepare(`
      SELECT b.id, b.name, b.description, b.brewery_type, b.city
      FROM breweries b
      LEFT JOIN brewery_vibes v ON b.id = v.brewery_id
      WHERE v.brewery_id IS NULL
         OR v.last_updated < datetime('now', '-7 days')
      LIMIT 10
    `).all<Brewery>();

    if (!breweries || breweries.length === 0) {
      return { processed: 0, errors: [] };
    }

    for (const brewery of breweries) {
      try {
        const prompt = `Analyze this Ohio brewery and return a JSON object with inferred attributes:

Brewery: ${brewery.name}
Type: ${brewery.brewery_type || 'unknown'}
City: ${brewery.city}
Description: ${brewery.description || 'No description available'}

Return ONLY a JSON object like:
{
  "atmosphere_tags": ["cozy", "industrial", "family-friendly"],
  "style_specialties": ["IPA", "Stout", "Lager"],
  "crowd_type": "hipster|sports|date-night|family|mixed"
}

Base your analysis on the brewery name, type, and any available description. Return only valid JSON:`;

        const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          prompt,
          max_tokens: 150
        }) as any;

        const responseText = aiResponse?.response || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const vibeData = JSON.parse(jsonMatch[0]);

          await env.DB.prepare(`
            INSERT OR REPLACE INTO brewery_vibes
            (brewery_id, atmosphere_tags, style_specialties, crowd_type, last_updated)
            VALUES (?, ?, ?, ?, datetime('now'))
          `).bind(
            brewery.id,
            JSON.stringify(vibeData.atmosphere_tags || []),
            JSON.stringify(vibeData.style_specialties || []),
            vibeData.crowd_type || 'mixed'
          ).run();

          processed++;
        }
      } catch (err: any) {
        errors.push(`Brewery ${brewery.id}: ${err.message}`);
      }
    }

    return { processed, errors };
  } catch (err: any) {
    return { processed, errors: [err.message] };
  }
}

// Enrich brewery descriptions using AI
async function enrichDescriptions(env: Env): Promise<{ success: boolean; processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  try {
    // Get breweries with missing or placeholder descriptions
    const { results: breweries } = await env.DB.prepare(`
      SELECT id, name, city, region, brewery_type, description, street
      FROM breweries
      WHERE description IS NULL
         OR description = ''
         OR description = 'N/A'
         OR LENGTH(description) < 50
      LIMIT 20
    `).all<Brewery>();

    if (!breweries || breweries.length === 0) {
      return { success: true, processed: 0, errors: ['No breweries need descriptions'] };
    }

    for (const brewery of breweries) {
      try {
        const prompt = `Write a brief, engaging 2-3 sentence description for this Ohio craft brewery. Focus on what makes it unique and inviting.

Brewery: ${brewery.name}
City: ${brewery.city}, Ohio
Region: ${brewery.region || 'Ohio'}
Type: ${brewery.brewery_type || 'craft brewery'}
${brewery.street ? `Location: ${brewery.street}` : ''}

Write in third person, present tense. Be specific to Ohio and the local area. Do not include hours, prices, or contact info. Return ONLY the description text, no quotes or labels:`;

        const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          prompt,
          max_tokens: 150
        }) as any;

        const description = (aiResponse?.response || '').trim();

        if (description && description.length > 30 && description.length < 500) {
          await env.DB.prepare(
            'UPDATE breweries SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).bind(description, brewery.id).run();

          processed++;
        }
      } catch (err: any) {
        errors.push(`Brewery ${brewery.id} (${brewery.name}): ${err.message}`);
      }
    }

    return { success: true, processed, errors };
  } catch (err: any) {
    return { success: false, processed, errors: [...errors, err.message] };
  }
}

// Export for Cloudflare Workers
export default {
  fetch: app.fetch,

  // Cron handler for scheduled tasks
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron triggered at ${new Date().toISOString()}`);

    // Run vibe inference batch
    const vibeResult = await processVibeInference(env);
    console.log(`Vibe inference: processed ${vibeResult.processed}, errors: ${vibeResult.errors.length}`);

    // Track AI usage
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `stats:ai:daily:${today}`;
    const currentUsage = parseInt(await env.CACHE.get(usageKey) || '0');
    await env.CACHE.put(usageKey, String(currentUsage + vibeResult.processed), { expirationTtl: 86400 * 7 });
  }
};
