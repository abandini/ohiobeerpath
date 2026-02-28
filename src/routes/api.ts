import { Hono } from 'hono';
import type { Env } from '../types';
import * as breweriesDB from '../db/breweries';
import type { StateFilter } from '../db/breweries';
import type { SubdomainContext } from '../middleware/subdomain';
import { hashCode } from '../templates/utils';

const api = new Hono<{ Bindings: Env; Variables: { subdomain: SubdomainContext } }>();

// Helper to build state filter from subdomain context
function getStateFilter(subdomain: SubdomainContext): StateFilter {
  return {
    stateAbbreviation: subdomain.stateAbbreviation,
    isMultiState: subdomain.isMultiState
  };
}

// GET /api/ai/test - Test Workers AI connectivity
api.get('/ai/test', async (c) => {
  try {
    // Test text generation with Llama 3
    const textResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt: 'Say "Workers AI is working!" in exactly 5 words.',
      max_tokens: 20
    }) as any;

    // Test embeddings with BGE
    const embeddingResponse = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: 'Test brewery description for embedding'
    }) as any;

    // Handle different response structures
    const embeddingData = embeddingResponse?.data || embeddingResponse;
    const embeddingVector = Array.isArray(embeddingData) ? embeddingData[0] : embeddingData;

    return c.json({
      success: true,
      textGeneration: {
        working: true,
        response: textResponse?.response || textResponse
      },
      embeddings: {
        working: true,
        dimensions: Array.isArray(embeddingVector) ? embeddingVector.length : 0
      }
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// GET /api/breweries/nearby - Get breweries near coordinates (must be before :id route)
api.get('/breweries/nearby', async (c) => {
  const lat = parseFloat(c.req.query('lat') || '');
  const lng = parseFloat(c.req.query('lng') || '');
  const radius = parseFloat(c.req.query('radius') || '50');

  if (isNaN(lat) || isNaN(lng)) {
    return c.json({ error: 'Invalid coordinates' }, 400);
  }

  // Get state filter from subdomain context
  const subdomain = c.get('subdomain');
  const stateFilter = getStateFilter(subdomain);

  const breweries = await breweriesDB.getNearbyBreweries(c.env, lat, lng, radius, stateFilter);

  return c.json({
    success: true,
    count: breweries.length,
    state: subdomain.stateName || 'All States',
    breweries
  });
});

// GET /api/breweries - Get all breweries with optional filters
api.get('/breweries', async (c) => {
  const region = c.req.query('region');
  const city = c.req.query('city');
  const search = c.req.query('search');
  const limit = parseInt(c.req.query('limit') || '0');
  const offset = parseInt(c.req.query('offset') || '0');

  // Get state filter from subdomain context
  const subdomain = c.get('subdomain');
  const stateFilter = getStateFilter(subdomain);

  let breweries;

  if (search) {
    breweries = await breweriesDB.searchBreweries(c.env, search, stateFilter);
  } else if (region) {
    breweries = await breweriesDB.getBreweriesByRegion(c.env, region, stateFilter);
  } else if (city) {
    breweries = await breweriesDB.getBreweriesByCity(c.env, city, stateFilter);
  } else {
    breweries = await breweriesDB.getAllBreweries(c.env, stateFilter);
  }

  const totalCount = breweries.length;

  // Apply pagination if limit is specified
  if (limit > 0) {
    breweries = breweries.slice(offset, offset + limit);
  }

  return c.json({
    success: true,
    count: totalCount,
    returned: breweries.length,
    state: subdomain.stateName || 'All States',
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

// GET /api/regions - Get all regions with brewery counts
api.get('/regions', async (c) => {
  // Get state filter from subdomain context
  const subdomain = c.get('subdomain');
  const stateFilter = getStateFilter(subdomain);

  const allBreweries = await breweriesDB.getAllBreweries(c.env, stateFilter);

  const regionCounts = new Map<string, number>();
  allBreweries.forEach(b => {
    if (b.region) {
      regionCounts.set(b.region, (regionCounts.get(b.region) || 0) + 1);
    }
  });

  const regions = Array.from(regionCounts.entries()).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    slug: name.toLowerCase(),
    brewery_count: count
  })).sort((a, b) => b.brewery_count - a.brewery_count);

  return c.json({
    success: true,
    count: regions.length,
    state: subdomain.stateName || 'All States',
    regions
  });
});

// POST /api/itinerary/optimize - AI-powered route optimization
api.post('/itinerary/optimize', async (c) => {
  try {
    const body = await c.req.json();
    const breweryIds: number[] = body.brewery_ids;

    if (!breweryIds || breweryIds.length < 2) {
      return c.json({ error: 'At least 2 brewery IDs required' }, 400);
    }

    // Fetch brewery details
    const breweries = await Promise.all(
      breweryIds.map(id => breweriesDB.getBreweryById(c.env, id))
    );
    const validBreweries = breweries.filter(b => b !== null);

    if (validBreweries.length < 2) {
      return c.json({ error: 'Could not find enough valid breweries' }, 400);
    }

    // Check cache first
    const cacheKey = `cache:route:${breweryIds.sort().join('-')}`;
    const cached = await c.env.CACHE.get(cacheKey);
    if (cached) {
      return c.json({ success: true, optimized_route: JSON.parse(cached), cached: true });
    }

    // Build prompt for AI
    const breweryInfo = validBreweries.map(b =>
      `- ${b!.name} (ID: ${b!.id}): ${b!.city}, lat: ${b!.latitude}, lng: ${b!.longitude}`
    ).join('\n');

    const prompt = `You are a route optimization assistant. Given these breweries with their coordinates, suggest the optimal driving order to minimize total travel distance. Return ONLY a JSON object with this exact structure:
{
  "order": [array of brewery IDs in optimal order],
  "total_distance_miles": estimated total miles,
  "total_time_minutes": estimated total driving time in minutes,
  "legs": [{"from_id": id, "to_id": id, "distance_miles": miles, "time_minutes": minutes}]
}

Breweries:
${breweryInfo}

Assume average speed of 40mph. Calculate approximate distances using the coordinates. Return only valid JSON, no explanations.`;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt,
      max_tokens: 500
    }) as any;

    const responseText = aiResponse?.response || '';

    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback: return original order with simple distance calc
      return c.json({
        success: true,
        optimized_route: {
          order: breweryIds,
          total_distance_miles: validBreweries.length * 15,
          total_time_minutes: validBreweries.length * 25,
          legs: []
        },
        ai_failed: true
      });
    }

    const optimizedRoute = JSON.parse(jsonMatch[0]);

    // Cache the result for 24 hours
    await c.env.CACHE.put(cacheKey, JSON.stringify(optimizedRoute), { expirationTtl: 86400 });

    return c.json({ success: true, optimized_route: optimizedRoute });

  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/ai/search - Semantic search using embeddings
api.get('/ai/search', async (c) => {
  const query = c.req.query('q');

  if (!query || query.length < 2) {
    return c.json({ error: 'Search query required (min 2 chars)' }, 400);
  }

  try {
    // Generate embedding for the query
    const embeddingResponse = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: query
    }) as any;

    const embeddingData = embeddingResponse?.data || embeddingResponse;
    const queryVector = Array.isArray(embeddingData) ? embeddingData[0] : embeddingData;

    if (!Array.isArray(queryVector)) {
      // Fallback to text search
      const breweries = await breweriesDB.searchBreweries(c.env, query);
      return c.json({ success: true, breweries, method: 'text_fallback' });
    }

    // Query Vectorize for similar breweries
    const vectorResults = await c.env.VECTORIZE.query(queryVector, {
      topK: 10,
      returnMetadata: true
    });

    if (!vectorResults.matches || vectorResults.matches.length === 0) {
      // Fallback to text search
      const breweries = await breweriesDB.searchBreweries(c.env, query);
      return c.json({ success: true, breweries, method: 'text_fallback' });
    }

    // Fetch full brewery details for matches
    const breweryIds = vectorResults.matches.map(m => parseInt(m.id));
    const breweries = await Promise.all(
      breweryIds.map(id => breweriesDB.getBreweryById(c.env, id))
    );

    return c.json({
      success: true,
      breweries: breweries.filter(b => b !== null),
      method: 'semantic',
      scores: vectorResults.matches.map(m => ({ id: m.id, score: m.score }))
    });

  } catch (error: any) {
    // Fallback to text search on any error
    const breweries = await breweriesDB.searchBreweries(c.env, query);
    return c.json({ success: true, breweries, method: 'text_fallback', error: error.message });
  }
});

// GET /api/ai/recommend - AI-powered brewery recommendations
api.get('/ai/recommend', async (c) => {
  const breweryId = c.req.query('brewery_id');
  const mood = c.req.query('mood'); // e.g., "cozy", "lively", "family-friendly"
  const style = c.req.query('style'); // e.g., "IPA", "stout", "lager"

  // Get state filter from subdomain context
  const subdomain = c.get('subdomain');
  const stateFilter = getStateFilter(subdomain);
  const stateName = subdomain.stateName || 'All States';

  try {
    let prompt: string;
    let allBreweries = await breweriesDB.getAllBreweries(c.env, stateFilter);

    if (breweryId) {
      // Recommend similar to a specific brewery
      const brewery = await breweriesDB.getBreweryById(c.env, parseInt(breweryId));
      if (!brewery) {
        return c.json({ error: 'Brewery not found' }, 404);
      }

      // Get other breweries in same region
      const sameRegion = allBreweries.filter(b =>
        b.region === brewery.region && b.id !== brewery.id
      ).slice(0, 5);

      return c.json({
        success: true,
        recommendations: sameRegion,
        state: stateName,
        reason: `Breweries in ${brewery.region} region like ${brewery.name}`
      });
    }

    if (mood || style) {
      // Use AI to find matching breweries
      const breweryList = allBreweries.slice(0, 50).map(b =>
        `${b.id}: ${b.name} - ${b.city} (${b.brewery_type || 'brewery'})`
      ).join('\n');

      prompt = `Given these ${stateName} breweries and a user looking for ${mood || ''} ${style || ''} vibes, recommend the top 5 brewery IDs that would be the best match. Return ONLY a JSON array of IDs like [1, 2, 3, 4, 5].

Breweries:
${breweryList}

User wants: ${mood ? `Mood: ${mood}` : ''} ${style ? `Style: ${style}` : ''}

Return only the JSON array of 5 IDs:`;

      const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        prompt,
        max_tokens: 50
      }) as any;

      const responseText = aiResponse?.response || '';
      const idsMatch = responseText.match(/\[[\d,\s]+\]/);

      if (idsMatch) {
        const recommendedIds: number[] = JSON.parse(idsMatch[0]);
        const recommendations = await Promise.all(
          recommendedIds.map(id => breweriesDB.getBreweryById(c.env, id))
        );

        return c.json({
          success: true,
          recommendations: recommendations.filter(b => b !== null),
          reason: `AI recommended for ${mood || ''} ${style || ''}`
        });
      }
    }

    // Default: return random selection
    const shuffled = allBreweries.sort(() => Math.random() - 0.5);
    return c.json({
      success: true,
      recommendations: shuffled.slice(0, 5),
      state: stateName,
      reason: 'Random selection'
    });

  } catch (error: any) {
    // Fallback to random (still respecting state context)
    const subdomain = c.get('subdomain');
    const stateFilter = getStateFilter(subdomain);
    const allBreweries = await breweriesDB.getAllBreweries(c.env, stateFilter);
    const shuffled = allBreweries.sort(() => Math.random() - 0.5);
    return c.json({
      success: true,
      recommendations: shuffled.slice(0, 5),
      state: subdomain.stateName || 'All States',
      reason: 'Random selection (AI unavailable)',
      error: error.message
    });
  }
});

// ============ ENGAGEMENT FEATURES ============

// POST /api/tours/share - Create a shareable tour link
api.post('/tours/share', async (c) => {
  try {
    const body = await c.req.json();
    const breweryIds: number[] = body.brewery_ids;
    const name = body.name || 'My Brewery Tour';

    if (!breweryIds || breweryIds.length === 0) {
      return c.json({ error: 'At least 1 brewery ID required' }, 400);
    }

    // Generate short ID
    const id = Math.random().toString(36).substring(2, 10);

    await c.env.DB.prepare(
      `INSERT INTO shared_tours (id, name, brewery_ids, created_at)
       VALUES (?, ?, ?, datetime('now'))`
    ).bind(id, name, JSON.stringify(breweryIds)).run();

    return c.json({
      success: true,
      share_id: id,
      share_url: `https://brewerytrip.com/tour/${id}`
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/tours/:id - Get shared tour details
api.get('/tours/:id', async (c) => {
  const id = c.req.param('id');

  const tour = await c.env.DB.prepare(
    'SELECT * FROM shared_tours WHERE id = ?'
  ).bind(id).first<any>();

  if (!tour) {
    return c.json({ error: 'Tour not found' }, 404);
  }

  // Increment view count
  await c.env.DB.prepare(
    'UPDATE shared_tours SET view_count = view_count + 1 WHERE id = ?'
  ).bind(id).run();

  // Fetch brewery details
  const breweryIds = JSON.parse(tour.brewery_ids || '[]');
  const breweries = await Promise.all(
    breweryIds.map((bid: number) => breweriesDB.getBreweryById(c.env, bid))
  );

  return c.json({
    success: true,
    tour: {
      ...tour,
      breweries: breweries.filter(b => b !== null)
    }
  });
});

// POST /api/check-ins - Record a brewery check-in
api.post('/check-ins', async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, brewery_id, notes, rating } = body;

    if (!user_id || !brewery_id) {
      return c.json({ error: 'user_id and brewery_id required' }, 400);
    }

    await c.env.DB.prepare(
      `INSERT INTO check_ins (user_id, brewery_id, notes, rating, checked_in_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    ).bind(user_id, brewery_id, notes || null, rating || null).run();

    // Check for badges
    const { results: checkInCount } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM check_ins WHERE user_id = ?'
    ).bind(user_id).all<{ count: number }>();

    const count = checkInCount?.[0]?.count || 0;
    const badges: string[] = [];

    // Badge thresholds
    if (count === 1) badges.push('first-check-in');
    if (count === 5) badges.push('beer-explorer');
    if (count === 10) badges.push('brewery-enthusiast');
    if (count === 25) badges.push('hophead');
    if (count === 50) badges.push('beer-master');

    // Award badges
    for (const badge of badges) {
      await c.env.DB.prepare(
        `INSERT INTO user_badges (user_id, badge_type, earned_at)
         VALUES (?, ?, datetime('now'))`
      ).bind(user_id, badge).run();
    }

    return c.json({
      success: true,
      total_check_ins: count,
      new_badges: badges
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/check-ins/:user_id - Get user's check-ins
api.get('/check-ins/:user_id', async (c) => {
  const userId = c.req.param('user_id');

  const { results: checkIns } = await c.env.DB.prepare(
    `SELECT c.*, b.name as brewery_name, b.city
     FROM check_ins c
     JOIN breweries b ON c.brewery_id = b.id
     WHERE c.user_id = ?
     ORDER BY c.checked_in_at DESC`
  ).bind(userId).all<any>();

  const { results: badges } = await c.env.DB.prepare(
    'SELECT * FROM user_badges WHERE user_id = ?'
  ).bind(userId).all<any>();

  return c.json({
    success: true,
    check_ins: checkIns || [],
    badges: badges || []
  });
});

// POST /api/subscribe - Email newsletter signup
api.post('/subscribe', async (c) => {
  try {
    const body = await c.req.json();
    const { email, name, preferences } = body;

    if (!email || !email.includes('@')) {
      return c.json({ error: 'Valid email required' }, 400);
    }

    // Generate verification token
    const token = Math.random().toString(36).substring(2, 15);

    try {
      await c.env.DB.prepare(
        `INSERT INTO email_subscribers (email, name, preferences, verification_token, subscribed_at)
         VALUES (?, ?, ?, ?, datetime('now'))`
      ).bind(email, name || null, JSON.stringify(preferences || {}), token).run();
    } catch (err: any) {
      if (err.message.includes('UNIQUE')) {
        return c.json({ error: 'Email already subscribed' }, 400);
      }
      throw err;
    }

    return c.json({
      success: true,
      message: 'Subscribed! Check your email to verify.'
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/events - Get upcoming brewery events
api.get('/events', async (c) => {
  const breweryId = c.req.query('brewery_id');
  const eventType = c.req.query('type');
  const limit = parseInt(c.req.query('limit') || '20');

  let query = `
    SELECT e.*, b.name as brewery_name, b.city
    FROM events e
    JOIN breweries b ON e.brewery_id = b.id
    WHERE e.start_datetime >= datetime('now')
  `;
  const params: any[] = [];

  if (breweryId) {
    query += ' AND e.brewery_id = ?';
    params.push(parseInt(breweryId));
  }

  if (eventType) {
    query += ' AND e.event_type = ?';
    params.push(eventType);
  }

  query += ' ORDER BY e.start_datetime ASC LIMIT ?';
  params.push(limit);

  const stmt = c.env.DB.prepare(query);
  const { results: events } = await stmt.bind(...params).all<any>();

  return c.json({
    success: true,
    events: events || []
  });
});

// GET /api/og/:brewery_id - Generate dynamic OG image for a brewery (SVG)
api.get('/og/:brewery_id', async (c) => {
  const breweryId = parseInt(c.req.param('brewery_id'));

  if (isNaN(breweryId)) {
    return c.json({ error: 'Invalid brewery ID' }, 400);
  }

  const brewery = await breweriesDB.getBreweryById(c.env, breweryId);

  if (!brewery) {
    return c.json({ error: 'Brewery not found' }, 404);
  }

  // Generate consistent color based on brewery name
  const hue = Math.abs(hashCode(brewery.name)) % 360;
  const hue2 = (hue + 40) % 360;

  // SVG-based OG image (1200x630)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 35%);stop-opacity:1" />
      <stop offset="100%" style="stop-color:hsl(${hue2}, 60%, 25%);stop-opacity:1" />
    </linearGradient>
    <pattern id="lines" patternUnits="userSpaceOnUse" width="4" height="4">
      <rect width="4" height="2" fill="rgba(0,0,0,0.08)"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#lines)"/>

  <!-- Beer icon (faded) -->
  <g transform="translate(950, 200)" opacity="0.15">
    <rect x="0" y="0" width="150" height="200" rx="15" fill="white"/>
    <ellipse cx="75" cy="10" rx="80" ry="25" fill="white"/>
    <path d="M150 60 Q180 80 180 120 Q180 160 150 180" stroke="white" stroke-width="20" fill="none"/>
  </g>

  <!-- Region badge -->
  <rect x="80" y="80" width="${((brewery.region || 'Ohio').length * 14) + 40}" height="40" rx="20" fill="rgba(255,255,255,0.2)"/>
  <text x="100" y="107" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">${(brewery.region || 'Ohio').toUpperCase()}</text>

  <!-- Brewery name -->
  <text x="80" y="200" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="white">
    ${brewery.name.length > 28 ? brewery.name.substring(0, 28) + '...' : brewery.name}
  </text>

  <!-- Location -->
  <text x="80" y="260" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.9)">${brewery.city}, Ohio</text>

  <!-- Divider -->
  <line x1="80" y1="300" x2="400" y2="300" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>

  <!-- View on text -->
  <text x="80" y="360" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.7)">View on Ohio Beer Path</text>

  <!-- Branding -->
  <text x="80" y="560" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#fbbf24">Ohio Beer Path</text>
  <text x="80" y="595" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.6)">Discover Ohio's Craft Beer Scene</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  });
});

// GET /api/stats - Get user stats
api.get('/stats/:user_id', async (c) => {
  const userId = c.req.param('user_id');

  const [checkIns, reviews, badges] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as count FROM check_ins WHERE user_id = ?').bind(userId).first<{ count: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM reviews WHERE user_id = ?').bind(userId).first<{ count: number }>(),
    c.env.DB.prepare('SELECT badge_type, earned_at FROM user_badges WHERE user_id = ?').bind(userId).all<any>()
  ]);

  // Get unique breweries visited
  const { results: uniqueBreweries } = await c.env.DB.prepare(
    'SELECT COUNT(DISTINCT brewery_id) as count FROM check_ins WHERE user_id = ?'
  ).bind(userId).all<{ count: number }>();

  // Get regions visited
  const { results: regions } = await c.env.DB.prepare(
    `SELECT DISTINCT b.region
     FROM check_ins c
     JOIN breweries b ON c.brewery_id = b.id
     WHERE c.user_id = ?`
  ).bind(userId).all<{ region: string }>();

  return c.json({
    success: true,
    stats: {
      total_check_ins: checkIns?.count || 0,
      unique_breweries: uniqueBreweries?.[0]?.count || 0,
      total_reviews: reviews?.count || 0,
      regions_visited: regions?.length || 0,
      badges: badges?.results || []
    }
  });
});

// POST /api/reviews - Submit a new review
api.post('/reviews', async (c) => {
  try {
    const body = await c.req.json();
    const { brewery_id, rating, title, content, user_id, visit_date } = body;

    // Validation
    if (!brewery_id || !rating || !content || !user_id) {
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    if (rating < 1 || rating > 5) {
      return c.json({ success: false, message: 'Rating must be between 1 and 5' }, 400);
    }

    // Check brewery exists
    const brewery = await breweriesDB.getBreweryById(c.env, brewery_id);
    if (!brewery) {
      return c.json({ success: false, message: 'Brewery not found' }, 404);
    }

    // Insert review
    const result = await c.env.DB.prepare(`
      INSERT INTO reviews (brewery_id, user_id, rating, title, content, visit_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(brewery_id, user_id, rating, title || null, content, visit_date || null).run();

    return c.json({
      success: true,
      message: 'Review submitted successfully',
      review_id: result.meta.last_row_id
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/reviews/:brewery_id - Get reviews for a brewery
api.get('/reviews/:brewery_id', async (c) => {
  try {
    const breweryId = parseInt(c.req.param('brewery_id'));

    const { results } = await c.env.DB.prepare(`
      SELECT * FROM reviews
      WHERE brewery_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(breweryId).all();

    return c.json({
      success: true,
      reviews: results || []
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/reviews/:id/helpful - Mark a review as helpful
api.post('/reviews/:id/helpful', async (c) => {
  try {
    const reviewId = parseInt(c.req.param('id'));

    await c.env.DB.prepare(`
      UPDATE reviews
      SET helpful_count = helpful_count + 1
      WHERE id = ?
    `).bind(reviewId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ============ BREWERY CLAIMS ============

// POST /api/brewery-claims - Submit a claim request for a brewery
api.post('/brewery-claims', async (c) => {
  try {
    const body = await c.req.json();
    const { brewery_id, contact_name, contact_role, contact_email, contact_phone, notes } = body;

    // Validation
    if (!brewery_id || !contact_name || !contact_role || !contact_email) {
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    // Validate email format
    if (!contact_email.includes('@') || !contact_email.includes('.')) {
      return c.json({ success: false, message: 'Invalid email format' }, 400);
    }

    // Check brewery exists
    const brewery = await breweriesDB.getBreweryById(c.env, brewery_id);
    if (!brewery) {
      return c.json({ success: false, message: 'Brewery not found' }, 404);
    }

    // Check for existing pending claim
    const existingClaim = await c.env.DB.prepare(`
      SELECT id FROM brewery_claims
      WHERE brewery_id = ? AND contact_email = ? AND status = 'pending'
    `).bind(brewery_id, contact_email).first();

    if (existingClaim) {
      return c.json({ success: false, message: 'A pending claim already exists for this brewery from this email' }, 400);
    }

    // Insert claim request
    const result = await c.env.DB.prepare(`
      INSERT INTO brewery_claims (brewery_id, contact_name, contact_role, contact_email, contact_phone, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(brewery_id, contact_name, contact_role, contact_email, contact_phone || null, notes || null).run();

    return c.json({
      success: true,
      message: 'Claim request submitted successfully. We will review and contact you within 2-3 business days.',
      claim_id: result.meta.last_row_id
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/brewery-claims - Get all claims (admin only)
api.get('/brewery-claims', async (c) => {
  try {
    const status = c.req.query('status');

    let query = `
      SELECT bc.*, b.name as brewery_name, b.city
      FROM brewery_claims bc
      LEFT JOIN breweries b ON bc.brewery_id = b.id
    `;

    if (status) {
      query += ` WHERE bc.status = ?`;
    }

    query += ` ORDER BY bc.created_at DESC`;

    const stmt = status
      ? c.env.DB.prepare(query).bind(status)
      : c.env.DB.prepare(query);

    const { results } = await stmt.all();

    return c.json({
      success: true,
      claims: results || []
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PATCH /api/brewery-claims/:id - Update claim status (admin only)
api.patch('/brewery-claims/:id', async (c) => {
  try {
    const claimId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { status } = body;

    if (!['pending', 'approved', 'rejected', 'contacted'].includes(status)) {
      return c.json({ success: false, message: 'Invalid status' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE brewery_claims
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, claimId).run();

    return c.json({ success: true, message: 'Claim status updated' });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default api;
