-- Ohio Beer Path D1 Database Schema
-- Converted from MySQL to SQLite

-- Breweries table
CREATE TABLE IF NOT EXISTS breweries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brewery_type TEXT,
    street TEXT,
    address_2 TEXT,
    address_3 TEXT,
    city TEXT NOT NULL,
    state_province TEXT DEFAULT 'Ohio',
    postal_code TEXT,
    country TEXT DEFAULT 'United States',
    longitude REAL,
    latitude REAL,
    phone TEXT,
    website_url TEXT,
    state TEXT,
    region TEXT,
    amenities TEXT, -- JSON array as TEXT
    description TEXT,
    hours TEXT, -- JSON object as TEXT
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_breweries_city ON breweries(city);
CREATE INDEX IF NOT EXISTS idx_breweries_region ON breweries(region);
CREATE INDEX IF NOT EXISTS idx_breweries_location ON breweries(latitude, longitude);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    brewery_id INTEGER,
    data TEXT, -- JSON data
    user_agent TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brewery_id) REFERENCES breweries(id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_brewery_id ON analytics(brewery_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
