// Cloudflare Workers environment bindings

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  CACHE: KVNamespace;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  GOOGLE_MAPS_API_KEY: string;
  ENVIRONMENT: string;
  ADMIN_USER?: string;
  ADMIN_PASS?: string;
}

export interface Brewery {
  id: number;
  name: string;
  brewery_type?: string;
  street?: string;
  city: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  longitude?: number;
  latitude?: number;
  phone?: string;
  website_url?: string;
  state?: string;
  region?: string;
  amenities?: string[]; // Parsed from JSON
  description?: string;
  hours?: Record<string, string>; // Parsed from JSON
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnalyticsEvent {
  event_type: string;
  brewery_id?: number;
  data?: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
}

export interface BreweryVibe {
  brewery_id: number;
  atmosphere_tags?: string[];
  style_specialties?: string[];
  crowd_type?: string;
  last_updated?: string;
}

export interface UserItinerary {
  id: string;
  breweries_json: number[];
  optimized_route_json?: OptimizedRoute;
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OptimizedRoute {
  order: number[];
  total_distance_miles: number;
  total_time_minutes: number;
  legs: RouteLeg[];
}

export interface RouteLeg {
  from_id: number;
  to_id: number;
  distance_miles: number;
  time_minutes: number;
}

export interface Region {
  name: string;
  slug: string;
  brewery_count: number;
  description?: string;
}

export interface SubdomainContext {
  stateSubdomain: string | null;  // e.g., "ohio" or null for main domain
  stateName: string | null;       // e.g., "Ohio" or null for multi-state
  stateAbbreviation: string | null; // e.g., "OH" or null for multi-state
  isMultiState: boolean;          // true if on main brewerytrip.com
  baseUrl: string;                // The full base URL for links
}

// Extended Hono context variables
export interface AppVariables {
  subdomain: SubdomainContext;
}
