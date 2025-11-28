-- AI-related tables for Ohio Beer Path
-- Migration: 0003_ai_tables.sql

-- Brewery vibes table for AI-inferred atmosphere/style data
CREATE TABLE IF NOT EXISTS brewery_vibes (
    brewery_id INTEGER PRIMARY KEY,
    atmosphere_tags TEXT,      -- JSON array: ["cozy", "industrial", "family-friendly"]
    style_specialties TEXT,    -- JSON array: ["IPA", "Stout", "Lager"]
    crowd_type TEXT,           -- "hipster", "sports", "date-night", "family"
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brewery_id) REFERENCES breweries(id) ON DELETE CASCADE
);

-- User itineraries for trip planning
CREATE TABLE IF NOT EXISTS user_itineraries (
    id TEXT PRIMARY KEY,                    -- UUID stored in cookie
    breweries_json TEXT NOT NULL,           -- JSON array of brewery IDs: [1, 5, 12]
    optimized_route_json TEXT,              -- AI-generated optimized route
    name TEXT,                              -- Optional user-provided name
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick itinerary lookups
CREATE INDEX IF NOT EXISTS idx_itineraries_created ON user_itineraries(created_at);
