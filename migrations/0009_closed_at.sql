-- Closure flag: closed breweries stay addressable by id (external links, ratings, quiz links)
-- but drop out of listings, search, nearby, trip planning and the sitemap.
ALTER TABLE breweries ADD COLUMN closed_at TEXT;
CREATE INDEX IF NOT EXISTS idx_breweries_closed_at ON breweries(closed_at);
