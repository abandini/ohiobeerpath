-- Owner-supplied listing photos: JSON array of {"url","alt"} served from the IMAGES R2 bucket, plus one credit line shown under the gallery.
ALTER TABLE breweries ADD COLUMN photos TEXT;
ALTER TABLE breweries ADD COLUMN photo_credit TEXT;
