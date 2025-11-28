-- Migration: Engagement Features
-- Adds tables for check-ins, reviews, trails, events, email subscribers, and shared tours

-- Check-ins table (track brewery visits)
CREATE TABLE IF NOT EXISTS check_ins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL, -- Anonymous user ID from localStorage
  brewery_id INTEGER NOT NULL,
  checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  rating INTEGER, -- 1-5 stars at check-in
  FOREIGN KEY (brewery_id) REFERENCES breweries(id)
);

CREATE INDEX IF NOT EXISTS idx_check_ins_user ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_brewery ON check_ins(brewery_id);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  brewery_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  visit_date DATE,
  helpful_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brewery_id) REFERENCES breweries(id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_brewery ON reviews(brewery_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Trails (pre-built brewery routes)
CREATE TABLE IF NOT EXISTS trails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  region TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'challenging')),
  estimated_hours REAL,
  brewery_ids TEXT NOT NULL, -- JSON array of brewery IDs in order
  image_url TEXT,
  featured INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trails_slug ON trails(slug);
CREATE INDEX IF NOT EXISTS idx_trails_region ON trails(region);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brewery_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('live-music', 'tasting', 'release', 'food', 'special', 'other')),
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME,
  recurring TEXT, -- JSON for recurring rules
  image_url TEXT,
  external_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brewery_id) REFERENCES breweries(id)
);

CREATE INDEX IF NOT EXISTS idx_events_brewery ON events(brewery_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- Email subscribers
CREATE TABLE IF NOT EXISTS email_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  preferences TEXT, -- JSON: regions, event types, frequency
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified INTEGER DEFAULT 0,
  verification_token TEXT,
  unsubscribed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON email_subscribers(email);

-- Shared tours (shareable itinerary links)
CREATE TABLE IF NOT EXISTS shared_tours (
  id TEXT PRIMARY KEY, -- Short UUID for sharing
  name TEXT,
  brewery_ids TEXT NOT NULL, -- JSON array of brewery IDs
  created_by TEXT, -- Optional user ID
  view_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME -- Optional expiration
);

-- User badges/achievements
CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  badge_data TEXT, -- JSON with badge-specific data
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_type ON user_badges(badge_type);

-- Blog posts for SEO content
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author TEXT DEFAULT 'Ohio Beer Path',
  featured_image TEXT,
  tags TEXT, -- JSON array
  published INTEGER DEFAULT 0,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published, published_at);
