-- Five listings near US 422 retired after a source check. closed_at is the review date (2026-11-22), as in 0021: the
-- actual closing dates are in the sources; closed_at is never displayed, only used to retire the listing (the page is
-- kept with a "has closed" notice and is noindexed). Previous value for every row (for rollback): closed_at NULL.
-- "Re-read" below means the coordinator fetched the page on 2026-11-22 and found the quoted words on it.
--
-- 2407 Platform Beer Co, 4125 Lorain Ave, Cleveland (the taproom). Re-read:
--   News 5 Cleveland (Feb 2023): "Platform Beer Co. has closed its doors in Cleveland for good, Anheuser-Busch confirmed to
--   News 5 Cleveland Wednesday." The same report describes signage being scraped off "the Lorain Avenue taproom".
--   https://www.news5cleveland.com/news/local-news/cleveland-metro/platform-beer-co-closes-doors-in-cleveland-anheuser-busch-confirms
-- 2408 Platform Beer Co - Production Facility, 3506 Vega Ave, Cleveland. Re-read:
--   Audacy / Q104: "Platform Beer Company has closed here in Cleveland." and "All local production has ceased".
--   https://www.audacy.com/q104/latest/platform-beer-co-has-shut-down-operation
-- 2353 Granite City Food & Brewery, 24519 Cedar Rd (Legacy Village, Lyndhurst). Re-read:
--   FSR Magazine, on the 2019 bankruptcy: "shuttered six more on October 25 (Carmel, Indiana; Orland Park, Illinois;
--   Northbrook, Illinois; Peoria, Illinois; Lyndhurst, Ohio"  https://www.fsrmagazine.com/feature/granite-city-files-bankruptcy-facilitate-sale/
-- 1232 Stickman Brews, 326 N Lewis Rd, Royersford PA. Re-read:
--   Patch (3 Oct 2023): "Stickman Brews at 326 N. Lewis Road is closed permanently after being open for eight years."
--   https://patch.com/pennsylvania/limerick/stickman-brews-royersford-closes
-- 1102 Iron Hill Brewery & Restaurant - Phoenixville, 130 Bridge St. The closure evidence is Montco Today (page dated Nov
--   2024), read by a checker agent on 2026-11-22: "Iron Hill Brewery's Phoenixville location has permanently shut its
--   doors, yet the reasons for the closure are unsure."  https://montco.today/2024/11/iron-hill-brewery-phoenixville-closes
--   The coordinator's re-fetch of that page was refused (HTTP 403). Corroboration only: Iron Hill's own site,
--   https://www.ironhillbrewery.com/ , fetched the same day, does not mention Phoenixville.
--
-- HELD, not retired here (announcement or indefinite closure only; each needs a source saying the closure happened):
--   214 Midnight Owl (Shaker Heights), 1183 Reclamation (Butler PA), 1006 Butler Brew Works (Butler PA; reported replaced
--   by Hop Car Brewing at 101 S. Main St.), 998 Broken Chair (West Reading PA).
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2407 AND name = 'Platform Beer Co' AND closed_at IS NULL;
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2408 AND name = 'Platform Beer Co - Production Facility' AND closed_at IS NULL;
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2353 AND name = 'Granite City Food & Brewery' AND closed_at IS NULL;
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1232 AND name = 'Stickman Brews' AND closed_at IS NULL;
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1102 AND name = 'Iron Hill Brewery & Restaurant - Phoenixville' AND closed_at IS NULL;
