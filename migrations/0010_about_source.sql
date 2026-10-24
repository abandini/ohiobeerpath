-- Sourced "About" copy: a verbatim quote from the brewery's own website, where it came from, and when we checked.
-- The generated `description` column stays in place but is no longer rendered anywhere.
ALTER TABLE breweries ADD COLUMN about_quote TEXT;
ALTER TABLE breweries ADD COLUMN about_source_url TEXT;
ALTER TABLE breweries ADD COLUMN about_checked_at TEXT;
