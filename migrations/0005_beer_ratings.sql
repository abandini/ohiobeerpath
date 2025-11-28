-- Beer Rating Feature Tables
-- Migration 0005: Users, Brewery Visits, Beer Ratings, Rating Photos

-- Users table (Untappd OAuth integration)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  untappd_id TEXT UNIQUE,
  untappd_username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  privacy_default TEXT DEFAULT 'ask' CHECK (privacy_default IN ('public', 'private', 'ask')),
  style_preference TEXT DEFAULT 'simple' CHECK (style_preference IN ('simple', 'comprehensive')),
  photo_mode TEXT DEFAULT 'single' CHECK (photo_mode IN ('single', 'multiple')),
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT DEFAULT (datetime('now'))
);

-- Brewery visits (implicit check-in when first rating at brewery)
CREATE TABLE IF NOT EXISTS brewery_visits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brewery_id INTEGER NOT NULL REFERENCES breweries(id) ON DELETE CASCADE,
  itinerary_id TEXT,
  visited_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, brewery_id, visited_at)
);

-- Beer ratings
CREATE TABLE IF NOT EXISTS beer_ratings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visit_id TEXT REFERENCES brewery_visits(id) ON DELETE SET NULL,
  brewery_id INTEGER NOT NULL REFERENCES breweries(id) ON DELETE CASCADE,
  beer_name TEXT NOT NULL,
  beer_style TEXT,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  notes TEXT,
  abv REAL,
  is_public INTEGER DEFAULT 0,
  shared_to TEXT, -- JSON array of platforms: ["untappd", "ratebeer", "twitter"]
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Rating photos (stored in R2)
CREATE TABLE IF NOT EXISTS rating_photos (
  id TEXT PRIMARY KEY,
  rating_id TEXT NOT NULL REFERENCES beer_ratings(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_url_original TEXT,
  photo_url_thumb TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_untappd ON users(untappd_id);
CREATE INDEX IF NOT EXISTS idx_visits_user ON brewery_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_brewery ON brewery_visits(brewery_id);
CREATE INDEX IF NOT EXISTS idx_visits_user_brewery ON brewery_visits(user_id, brewery_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON beer_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_brewery ON beer_ratings(brewery_id);
CREATE INDEX IF NOT EXISTS idx_ratings_visit ON beer_ratings(visit_id);
CREATE INDEX IF NOT EXISTS idx_ratings_public ON beer_ratings(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_user_created ON beer_ratings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_rating ON rating_photos(rating_id);

-- Sessions stored in KV, but we need a table for session metadata/audit
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
