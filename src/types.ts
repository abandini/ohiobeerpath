// Cloudflare Workers environment bindings

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  CACHE: KVNamespace;
  GOOGLE_MAPS_API_KEY: string;
  WORKERS_AI_API_KEY?: string;
  ENVIRONMENT: string;
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
