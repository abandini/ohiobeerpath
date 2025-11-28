// Cloudflare Workers environment bindings

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  GOOGLE_MAPS_API_KEY: string;
  ENVIRONMENT: string;
  ADMIN_USER?: string;
  ADMIN_PASS?: string;
  // Untappd OAuth
  UNTAPPD_CLIENT_ID?: string;
  UNTAPPD_CLIENT_SECRET?: string;
  UNTAPPD_REDIRECT_URI?: string;
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
  user?: User;
  session?: UserSession;
}

// Beer Rating Feature Types

export interface User {
  id: string;
  untappd_id?: string;
  untappd_username?: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
  privacy_default: 'public' | 'private' | 'ask';
  style_preference: 'simple' | 'comprehensive';
  photo_mode: 'single' | 'multiple';
  created_at: string;
  last_login: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  untappd_token?: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface BreweryVisit {
  id: string;
  user_id: string;
  brewery_id: number;
  itinerary_id?: string;
  visited_at: string;
  created_at: string;
}

export interface BeerRating {
  id: string;
  user_id: string;
  visit_id?: string;
  brewery_id: number;
  beer_name: string;
  beer_style?: string;
  stars: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  abv?: number;
  is_public: boolean;
  shared_to?: string[]; // ["untappd", "ratebeer", "twitter"]
  created_at: string;
  updated_at: string;
  // Joined fields
  brewery?: Brewery;
  photos?: RatingPhoto[];
  user?: User;
}

export interface RatingPhoto {
  id: string;
  rating_id: string;
  photo_url: string;
  photo_url_original?: string;
  photo_url_thumb?: string;
  sort_order: number;
  created_at: string;
}

export interface CreateRatingInput {
  brewery_id: number;
  beer_name: string;
  stars: 1 | 2 | 3 | 4 | 5;
  beer_style?: string;
  notes?: string;
  abv?: number;
  is_public?: boolean;
  itinerary_id?: string;
}

export interface UserStats {
  total_ratings: number;
  total_breweries: number;
  total_photos: number;
  average_rating: number;
  favorite_style?: string;
  ratings_this_month: number;
  recent_ratings: BeerRating[];
}

// Beer style categories
export type BeerStyleSimple =
  | 'IPA' | 'Pale Ale' | 'Lager' | 'Pilsner' | 'Stout' | 'Porter'
  | 'Wheat' | 'Sour' | 'Belgian' | 'Amber' | 'Brown Ale' | 'Blonde'
  | 'Hefeweizen' | 'Kolsch' | 'Saison' | 'Red Ale' | 'Scotch Ale'
  | 'Barleywine' | 'Bock' | 'Dunkel' | 'Marzen' | 'Schwarzbier'
  | 'Gose' | 'Berliner Weisse' | 'Fruit Beer' | 'Cider' | 'Mead' | 'Other';

export const BEER_STYLES_SIMPLE: BeerStyleSimple[] = [
  'IPA', 'Pale Ale', 'Lager', 'Pilsner', 'Stout', 'Porter',
  'Wheat', 'Sour', 'Belgian', 'Amber', 'Brown Ale', 'Blonde',
  'Hefeweizen', 'Kolsch', 'Saison', 'Red Ale', 'Scotch Ale',
  'Barleywine', 'Bock', 'Dunkel', 'Marzen', 'Schwarzbier',
  'Gose', 'Berliner Weisse', 'Fruit Beer', 'Cider', 'Mead', 'Other'
];
