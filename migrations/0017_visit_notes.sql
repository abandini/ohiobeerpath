-- First-hand notes from Brewery Trip's own visits: JSON array of {"date":"YYYY-MM-DD","text"} shown under the photos,
-- each with its visit date. Plain text only; malformed JSON renders as no notes (src/db/breweries.ts parseVisitNotes).
ALTER TABLE breweries ADD COLUMN visit_notes TEXT;
