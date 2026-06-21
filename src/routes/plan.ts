import { Hono } from 'hono';
import type { Env, AppVariables, PlanRequest, RefineRequest } from '../types';
import { checkRateLimit } from '../services/rate-limit';
import { selectCandidates, saveTripPlan, getTripBySlug, getTripBySlugInternal, getCachedRoute, setCachedRoute } from '../services/trip-planner';
import { buildTripPrompt, generateTripRoute, generateTripRouteStream, refineTripRoute } from '../services/claude';
import { planPage } from '../templates/plan';
import { tripPage } from '../templates/trip';

const planRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// === Page Routes ===

planRoutes.get('/plan', (c) => {
  const subdomain = c.get('subdomain');
  return c.html(planPage(subdomain));
});

planRoutes.get('/trip/:slug', async (c) => {
  const slug = c.req.param('slug');
  const trip = await getTripBySlug(c.env, slug);
  if (!trip) return c.json({ error: 'Trip not found' }, 404);
  const subdomain = c.get('subdomain');
  return c.html(tripPage(trip, subdomain));
});

// === API Routes ===

const ALLOWED_PREFERENCES = ['dog-friendly', 'food', 'outdoor', 'live-music', 'tours'] as const;

planRoutes.post('/api/plan', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const rateCheck = await checkRateLimit(c.env.CACHE, ip, 'plan', 10, 900);
  if (!rateCheck.allowed) {
    return c.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter || 60) } }
    );
  }

  const body = await c.req.json<PlanRequest>();

  if (!body.starting_city || !body.time_budget_minutes) {
    return c.json({ error: 'starting_city and time_budget_minutes are required' }, 400);
  }
  if (typeof body.starting_city !== 'string' || body.starting_city.length > 100) {
    return c.json({ error: 'starting_city must be a string under 100 characters' }, 400);
  }
  if (body.time_budget_minutes < 60 || body.time_budget_minutes > 720) {
    return c.json({ error: 'time_budget_minutes must be between 60 and 720' }, 400);
  }

  // Whitelist preferences to prevent prompt injection
  const rawPrefs = Array.isArray(body.preferences) ? body.preferences : [];
  const validPrefs = rawPrefs.filter((p): p is string =>
    typeof p === 'string' && ALLOWED_PREFERENCES.includes(p as any)
  );

  const request: PlanRequest = {
    starting_city: body.starting_city.slice(0, 100),
    starting_lat: body.starting_lat,
    starting_lng: body.starting_lng,
    time_budget_minutes: body.time_budget_minutes,
    preferences: validPrefs,
  };

  // Check cache
  const cached = await getCachedRoute(c.env, request);
  if (cached) {
    const trip = await saveTripPlan(c.env, cached.stops[0]?.city ? `${request.starting_city} Brewery Trip` : 'Brewery Trip', request, cached);
    return c.json({ success: true, trip });
  }

  // Select candidates
  const candidates = await selectCandidates(c.env, request);
  if (candidates.length === 0) {
    return c.json({ error: 'No breweries found near that location' }, 404);
  }

  // Check if client wants SSE streaming
  const wantsStream = c.req.header('accept')?.includes('text/event-stream');

  if (wantsStream && (!c.env.ANTHROPIC_API_KEY || !c.env.AI_GATEWAY_ENDPOINT)) {
    return c.json({ error: 'AI service not configured' }, 503);
  }

  if (wantsStream && c.env.ANTHROPIC_API_KEY && c.env.AI_GATEWAY_ENDPOINT) {
    const prompt = buildTripPrompt(request, candidates);
    const stream = generateTripRouteStream(
      c.env.ANTHROPIC_API_KEY, c.env.AI_GATEWAY_ENDPOINT, prompt,
      async (title: string, route: any) => {
        const trip = await saveTripPlan(c.env, title, request, route);
        return trip.slug;
      }
    );
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Non-streaming response
  if (c.env.ANTHROPIC_API_KEY && c.env.AI_GATEWAY_ENDPOINT) {
    try {
      const prompt = buildTripPrompt(request, candidates);
      const { title, route } = await generateTripRoute(c.env.ANTHROPIC_API_KEY, c.env.AI_GATEWAY_ENDPOINT, prompt);
      await setCachedRoute(c.env, request, route);
      const trip = await saveTripPlan(c.env, title, request, route);
      return c.json({ success: true, trip });
    } catch (err: any) {
      console.error('Claude API error:', err);
    }
  }

  // Fallback: distance-sorted candidates as simple route
  const fallbackStops = candidates.slice(0, Math.min(5, candidates.length)).map((cand, i) => ({
    brewery_id: cand.id,
    name: cand.name,
    city: cand.city,
    state: cand.state,
    latitude: cand.latitude,
    longitude: cand.longitude,
    amenities: cand.amenities,
    description: cand.description || undefined,
    drive_minutes_from_prev: i === 0 ? 0 : Math.round((cand.distance_miles || 10) * 1.2),
    drive_miles_from_prev: i === 0 ? 0 : Math.round(cand.distance_miles || 10),
    stop_duration_minutes: 45,
  }));

  const fallbackRoute = {
    stops: fallbackStops,
    total_drive_minutes: fallbackStops.reduce((sum, s) => sum + s.drive_minutes_from_prev, 0),
    total_drive_miles: fallbackStops.reduce((sum, s) => sum + s.drive_miles_from_prev, 0),
    total_brewery_time_minutes: fallbackStops.length * 45,
  };

  const trip = await saveTripPlan(c.env, `${request.starting_city} Brewery Trip`, request, fallbackRoute);
  return c.json({
    success: true,
    trip,
    note: 'AI route optimization temporarily unavailable. Showing nearest breweries.',
  });
});

planRoutes.post('/api/plan/refine', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const rateCheck = await checkRateLimit(c.env.CACHE, ip, 'refine', 20, 900);
  if (!rateCheck.allowed) {
    return c.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter || 60) } }
    );
  }

  const body = await c.req.json<RefineRequest>();
  if (!body.trip_slug || !body.message) {
    return c.json({ error: 'trip_slug and message are required' }, 400);
  }
  if (typeof body.message !== 'string' || body.message.length > 500) {
    return c.json({ error: 'message must be under 500 characters' }, 400);
  }

  const trip = await getTripBySlugInternal(c.env, body.trip_slug);
  if (!trip) return c.json({ error: 'Trip not found' }, 404);

  if (!c.env.ANTHROPIC_API_KEY || !c.env.AI_GATEWAY_ENDPOINT) {
    return c.json({ error: 'AI service not configured' }, 503);
  }

  const candidates = await selectCandidates(c.env, {
    starting_city: trip.starting_city,
    starting_lat: trip.starting_lat || undefined,
    starting_lng: trip.starting_lng || undefined,
    time_budget_minutes: trip.time_budget_minutes,
    preferences: trip.preferences,
  });
  const existingIds = new Set(trip.route_json.stops.map(s => s.brewery_id));
  const newCandidates = candidates.filter(cand => !existingIds.has(cand.id));

  try {
    const { title, route } = await refineTripRoute(
      c.env.ANTHROPIC_API_KEY, c.env.AI_GATEWAY_ENDPOINT,
      trip.route_json, body.message, newCandidates
    );
    const newTrip = await saveTripPlan(c.env, title, {
      starting_city: trip.starting_city,
      starting_lat: trip.starting_lat || undefined,
      starting_lng: trip.starting_lng || undefined,
      time_budget_minutes: trip.time_budget_minutes,
      preferences: trip.preferences,
    }, route);
    return c.json({ success: true, trip: newTrip });
  } catch (err: any) {
    console.error('Refine error:', err);
    return c.json({ error: 'Could not refine route. Try again.' }, 500);
  }
});

planRoutes.get('/api/trip/:slug', async (c) => {
  const slug = c.req.param('slug');
  const trip = await getTripBySlug(c.env, slug);
  if (!trip) return c.json({ error: 'Trip not found' }, 404);
  return c.json({ success: true, trip });
});

export default planRoutes;
