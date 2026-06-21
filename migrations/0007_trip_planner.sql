-- Trip plans table
CREATE TABLE IF NOT EXISTS trip_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  starting_city TEXT NOT NULL,
  starting_lat REAL,
  starting_lng REAL,
  time_budget_minutes INTEGER NOT NULL,
  preferences TEXT DEFAULT '[]',
  route_json TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_trip_plans_slug ON trip_plans(slug);
CREATE INDEX IF NOT EXISTS idx_trip_plans_created ON trip_plans(created_at);

-- Trip stops for relational queries
CREATE TABLE IF NOT EXISTS trip_stops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  brewery_id INTEGER NOT NULL,
  drive_minutes REAL DEFAULT 0,
  drive_miles REAL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_trip_stops_trip ON trip_stops(trip_id);
