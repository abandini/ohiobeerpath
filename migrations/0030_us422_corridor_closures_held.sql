-- The four listings held in 0029 are retired now that a second, independent signal confirms each closure happened.
-- closed_at is the review date (2026-11-22), as in 0021 and 0029. Previous value for every row: closed_at NULL.
-- Second signal: Google Maps place status, read on 2026-11-22 through the Gemini API's Google Maps grounding (an internal
-- check; nothing from Google Maps is published on the site). First signal: the source already quoted in 0029's review.
--
-- 214 Midnight Owl Brewing Company, 20312 Chagrin Blvd, Shaker Heights.
--   Beverage World (22 Jan 2026): "Midnight Owl Brewing Co. is shutting down this month, Cleveland.com reported on January 15."
--   https://www.beverage-world.com/en/newsdetail/usa-oh-midnight-owl-brewing-co-closes
--   Google Maps: marked permanently closed (https://maps.google.com/maps?cid=6261349872288307823).
-- 1006 Butler Brew Works, 101 S Main St, Butler PA.
--   Butler Eagle (2 Apr 2025): taproom "will be closed “until further notice.”"  https://www.butlereagle.com/20250402/butler-brew-works-closed-until-further-notice/
--   Google Maps: marked permanently closed; Hop Car Brewing now occupies the address (https://maps.google.com/maps?cid=14648723119202282572).
-- 998 Broken Chair Brewery, 424 Penn Ave, West Reading PA.
--   The Beer Thrillers (18 Jun 2024), quoting the owners: "Broken Chair Brewery will be closing at the end of August depending on
--   how much beer we have."  https://thebeerthrillers.com/2024/06/18/broken-chair-brewery-has-announced-they-will-be-closing/
--   Google Maps: marked permanently closed; another restaurant now occupies the address (https://maps.google.com/maps?cid=3167885764856775849).
--   Its old domain redirects to a gambling site (link removed in 0026).
-- 1183 Reclamation Brewing Company, Butler PA.
--   Breweries in PA: "Reclamation Brewing Company will be closing its doors in Butler, after serving the community for about 7 1/2
--   years."  https://breweriesinpa.com/reclamation-brewing-company-announces-closing-of-brewery-in-butler/
--   Google Maps: no listing for the brewery; another business occupies 221 S Main St. Its old domain redirects to a gambling site
--   (link removed in 0027).
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 214 AND name = 'Midnight Owl Brewing Company' AND closed_at IS NULL;
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1006 AND name = 'Butler Brew Works' AND closed_at IS NULL;
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 998 AND name = 'Broken Chair Brewery' AND closed_at IS NULL;
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1183 AND name = 'Reclamation Brewing Company' AND closed_at IS NULL;
