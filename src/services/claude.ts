import type { TripRoute, PlanRequest } from '../types';

interface BreweryCandidate {
  id: number;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  description?: string | null;
  distance_miles?: number;
}

/**
 * Build the initial trip planning prompt.
 */
export function buildTripPrompt(request: PlanRequest, candidates: BreweryCandidate[]): string {
  const prefsText = request.preferences.length > 0
    ? `Preferences: ${request.preferences.join(', ')}`
    : 'No specific preferences';

  const candidateList = candidates.map(c => {
    const amenities = c.amenities.length > 0 ? ` (amenities: ${c.amenities.join(', ')})` : '';
    return `- ID:${c.id} ${c.name}, ${c.city}, ${c.state} [${c.latitude},${c.longitude}]${amenities}${c.distance_miles ? ` ~${Math.round(c.distance_miles)}mi away` : ''}`;
  }).join('\n');

  return `You are a brewery trip planner. Create an optimized road trip route.

Starting from: ${request.starting_city}
Time budget: ${request.time_budget_minutes} minutes total (including driving and brewery visits)
${prefsText}

Available breweries:
${candidateList}

Return a JSON object with this exact structure:
{
  "title": "Creative trip title",
  "stops": [
    {
      "brewery_id": <id>,
      "name": "<name>",
      "city": "<city>",
      "state": "<state>",
      "latitude": <lat>,
      "longitude": <lng>,
      "amenities": ["..."],
      "description": "<brief why this stop>",
      "drive_minutes_from_prev": <minutes from previous stop or starting city>,
      "drive_miles_from_prev": <miles>,
      "stop_duration_minutes": <recommended time at brewery, 30-60 min>
    }
  ],
  "total_drive_minutes": <sum of all drive times>,
  "total_drive_miles": <sum of all drive distances>,
  "total_brewery_time_minutes": <sum of all stop durations>
}

Rules:
- Select 3-6 breweries that fit within the time budget
- Optimize the route to minimize driving between stops
- Estimate realistic drive times (assume ~45 mph average)
- Each brewery stop should be 30-60 minutes
- Total time (driving + stops) must not exceed the time budget
- Return ONLY the JSON object, no other text`;
}

/**
 * Build a refinement prompt for an existing route.
 */
export function buildRefinePrompt(
  currentRoute: TripRoute,
  userMessage: string,
  candidates: BreweryCandidate[]
): string {
  const currentStops = currentRoute.stops.map((s, i) =>
    `${i + 1}. ${s.name}, ${s.city} (${s.stop_duration_minutes}min stop, ${s.drive_minutes_from_prev}min drive)`
  ).join('\n');

  const candidateList = candidates.map(c =>
    `- ID:${c.id} ${c.name}, ${c.city}, ${c.state} [${c.latitude},${c.longitude}]`
  ).join('\n');

  return `You are a brewery trip planner. Modify the existing route based on the user's request.

Current route:
${currentStops}

User says: "${userMessage}"

Additional breweries available (not in current route):
${candidateList}

Return the same JSON structure as before with the modified route. Keep stops the user didn't mention. Return ONLY the JSON object.`;
}

// Claude Sonnet 4.6 — balanced speed/intelligence for this per-request,
// user-facing route. (Replaces claude-sonnet-4-20250514, which retired
// 2026-06-15. For max quality switch to "claude-opus-4-8".)
const CLAUDE_MODEL = 'claude-sonnet-4-6';

/**
 * Resolve the Anthropic Messages endpoint. A Cloudflare AI Gateway base must
 * be complete (…/v1/<account>/<gateway>); the bare "…/v1" is incomplete and
 * 404s, so we fall back to calling the Anthropic API directly.
 */
function anthropicMessagesUrl(gatewayEndpoint?: string): string {
  if (gatewayEndpoint && /\/v1\/[^/]+\/[^/]+/.test(gatewayEndpoint)) {
    return `${gatewayEndpoint.replace(/\/$/, '')}/anthropic/v1/messages`;
  }
  return 'https://api.anthropic.com/v1/messages';
}

/**
 * Call Claude API (non-streaming) to generate a trip route.
 */
export async function generateTripRoute(
  apiKey: string,
  gatewayEndpoint: string,
  prompt: string
): Promise<{ title: string; route: TripRoute }> {
  const response = await fetch(anthropicMessagesUrl(gatewayEndpoint), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as any;
  const text = data.content?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse route from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const title = parsed.title || 'Brewery Road Trip';
  const route: TripRoute = {
    stops: parsed.stops || [],
    total_drive_minutes: parsed.total_drive_minutes || 0,
    total_drive_miles: parsed.total_drive_miles || 0,
    total_brewery_time_minutes: parsed.total_brewery_time_minutes || 0,
  };

  return { title, route };
}

/**
 * Call Claude API with SSE streaming. Returns a ReadableStream.
 */
export function generateTripRouteStream(
  apiKey: string,
  gatewayEndpoint: string,
  prompt: string,
  onComplete?: (title: string, route: TripRoute) => Promise<string | undefined>
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(anthropicMessagesUrl(gatewayEndpoint), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: 2048,
            stream: true,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!response.ok || !response.body) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: `API error: ${response.status}` })}\n\n`));
          controller.close();
          return;
        }

        let fullText = '';
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  fullText += parsed.delta.text;
                }
              } catch {
                // skip unparseable lines
              }
            }
          }
        }

        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Could not parse route from AI response' })}\n\n`));
          controller.close();
          return;
        }

        const routeData = JSON.parse(jsonMatch[0]);
        const stops = routeData.stops || [];
        for (let i = 0; i < stops.length; i++) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stop', index: i, stop: stops[i] })}\n\n`));
        }

        const title = routeData.title || 'Brewery Road Trip';
        const route: TripRoute = {
          stops,
          total_drive_minutes: routeData.total_drive_minutes || 0,
          total_drive_miles: routeData.total_drive_miles || 0,
          total_brewery_time_minutes: routeData.total_brewery_time_minutes || 0,
        };

        let slug: string | undefined;
        if (onComplete) {
          try {
            slug = await onComplete(title, route);
          } catch (err: any) {
            console.error('Failed to save trip:', err);
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'route_complete',
          title,
          slug,
          route,
        })}\n\n`));

        controller.close();
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: err.message || 'Unknown error' })}\n\n`));
        controller.close();
      }
    },
  });
}

/**
 * Refine an existing route via Claude. Non-streaming.
 */
export async function refineTripRoute(
  apiKey: string,
  gatewayEndpoint: string,
  currentRoute: TripRoute,
  userMessage: string,
  candidates: BreweryCandidate[]
): Promise<{ title: string; route: TripRoute }> {
  const prompt = buildRefinePrompt(currentRoute, userMessage, candidates);
  return generateTripRoute(apiKey, gatewayEndpoint, prompt);
}
