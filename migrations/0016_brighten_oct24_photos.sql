-- More photos for Brighten Brewing: Bill's own shots from his 2026-10-24 visit (files 1000019048 / 1000019050.jpg), shown with the
-- 2026-10-17 set from 0013. The tap-list shot is cropped to drop a TV broadcast on the right and a patron at the bottom edge. Both are
-- resized to 1600px WebP with all metadata stripped. The third Oct 24 file (1000019049) is left out: it's mostly a blurred reflection.
-- R2 upload (run before this UPDATE):
--   npx wrangler r2 object put ohio-beer-path-images/breweries/brighten-brewing/taplist-oct24.webp --file data/photos/brighten-brewing/brighten-taplist-oct24.webp --content-type image/webp --remote
--   npx wrangler r2 object put ohio-beer-path-images/breweries/brighten-brewing/taproom-4.webp --file data/photos/brighten-brewing/brighten-taproom-4.webp --content-type image/webp --remote
UPDATE breweries SET
  photos = '[{"url":"/images/breweries/brighten-brewing/taproom-1.webp","alt":"Brighten Brewing taproom: pool table, dartboard, bar-height counter with stools and three abstract landscape paintings"},{"url":"/images/breweries/brighten-brewing/taplist-oct24.webp","alt":"Brighten Brewing tap list on Oct 24, 2026: twelve hand-painted beer boards showing ABV and IBU, beside the Brighten Brew logo sign and the tap handles"},{"url":"/images/breweries/brighten-brewing/taproom-2.webp","alt":"Brighten Brewing taproom: counter seating under three paintings, an arcade cabinet, a leather couch and a window onto trees"},{"url":"/images/breweries/brighten-brewing/taproom-3.webp","alt":"Brighten Brewing dining room: tables and chairs, pool table, plants and the OPEN sign in the front window"},{"url":"/images/breweries/brighten-brewing/taproom-4.webp","alt":"Brighten Brewing dining room seen from the back: round and high-top tables, a pool table, an arcade cabinet and plants along the front windows"}]',
  photo_credit = 'Photos: Brewery Trip visits, Oct 17 and Oct 24, 2026'
WHERE name = 'Brighten Brewing Company';
