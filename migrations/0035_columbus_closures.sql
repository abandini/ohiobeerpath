-- Four Columbus-area listings retired on quoted sources found while checking breweries along I-71 (2026-11-22). Each quote was
-- re-fetched by the coordinator the same day unless marked otherwise. closed_at is the review date, as in 0021/0029/0033.
-- Three of these (2313, 2345, 2339 and 238's sibling evidence) had been held in 0033 for lack of a clear source.
-- Previous value for every row: closed_at NULL.
-- NOT retired: 103 Endeavor Brewing Company. Its Grandview taproom closed (own site: "Our Grandview Taproom is closed to the
-- public. It is for Events only.") but the listing has no street and the brand's Linworth location is open, so the listing
-- should be re-pointed to Linworth, not retired. 2345: the production facility at 165 N 4th St was acquired by Jackie O's,
-- which is listed separately (178) at that building and is open.
-- 2313 Actual Brewing Company, LLC (655 N James Rd, Columbus): https://breakfastwithnick.com/2024/04/12/hoster-brewing-columbus-ohio/
--   "The space was formerly home to Actual Brewing, which shuttered in 2019."  [re-fetched by coordinator: yes, words found]
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2313 AND name = 'Actual Brewing Company, LLC' AND closed_at IS NULL;
-- 2345 Elevator Brewing Co - Production facility (165 N 4th St, Columbus): https://drinkupcolumbus.com/2020/10/07/jackie-o-columbus
--   "Jackie O’s Brewery announced today that they have acquired the Elevator Brewing Company production facility in Downtown Columbus."  [re-fetched by coordinator: yes, words found]
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2345 AND name = 'Elevator Brewing Co - Production facility' AND closed_at IS NULL;
-- 2339 Commonhouse Ales (535 Short St, Columbus): https://breakfastwithnick.com/2021/01/08/friday-food-bites-january-8-2021/
--   "Commonhouse Ales announced this week that it has ceased operations."  [re-fetched by coordinator: yes, words found]
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2339 AND name = 'Commonhouse Ales' AND closed_at IS NULL;
-- 238 Nocterra Brewing Co - Audubon (, Columbus): https://www.wosu.org/2026-08-31/nocterra-brewing-co-unexpectedly-closes-both-locations
--   "The Audubon location closed on Saturday and the Powell location closed on Sunday."  [re-fetched by coordinator: yes, words found]
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 238 AND name = 'Nocterra Brewing Co - Audubon' AND closed_at IS NULL;
