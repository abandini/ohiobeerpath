-- Medina Brewing Company (id 211): Bill's own photo and note from his visit on Thursday, 2026-10-29 (file 20261029_152146.jpg).
-- The tap-list shot is cropped to the 16 hand-lettered beer boards (eight per column) (drops the ceiling pipes, bar shelving and the floor mat);
-- no people are in frame. Resized to 1600px WebP with all metadata stripped.
-- R2 upload (run before this UPDATE):
--   npx wrangler r2 object put ohio-beer-path-images/breweries/medina-brewing/taplist-oct29.webp --file data/photos/medina-brewing/medina-taplist-oct29.webp --content-type image/webp --remote
UPDATE breweries SET
  photos = '[{"url":"/images/breweries/medina-brewing/taplist-oct29.webp","alt":"Medina Brewing Company tap list on Oct 29, 2026: sixteen hand-lettered chalkboards in two columns with beer names and ABVs, from Medina Lite Pilsner and 99 Pumpkins to Wai-iti War Dance New England IPA, with a jack-o’-lantern ghost hanging between the two columns"}]',
  photo_credit = 'Photo: Brewery Trip visit, Oct 29, 2026',
  visit_notes = '[{"date":"2026-10-29","text":"We stopped in on Thursday, Oct 29. Curtis was serving: informative, fun, and good conversation with the folks at the bar. The photo above shows that day’s tap list."}]'
WHERE id = 211 AND name = 'Medina Brewing Company';
