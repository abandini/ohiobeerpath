-- I-75 road check follow-up (leads from 2026-11-22; reviewed 2026-11-23). Applied to D1 on 2026-11-23 after outside review (GO on all eight statements).
-- Every source below was re-fetched on 2026-11-23 with a plain curl, User-Agent "BreweryTripBot/1.0 (+https://brewerytrip.com/about)",
-- and the quoted words were found in the fetched page text. Exact commands are in docs/status/0036-evidence.md.
-- Rule (as 0032/0033/0035): a different owner or brand is a different listing, never a rename; the old listing is retired only
-- with a quoted source that it closed or was replaced. One location of a multi-location brand retires only that location's row.
-- closed_at is the review date, as in 0021/0029/0033/0035; the real dates are in the sources. Previous value for every retired row:
-- closed_at NULL. Revert: migrations/0036_i75_closures_and_links.revert.sql.txt (run by hand; not a migration).
-- HELD (no UPDATE here; reasons in docs/status/0036-evidence.md): 656 Soo Brewing / 559 Lockside (moved, same business),
-- 896 / 941 Lexington Brewing (duplicate; no merge feature), 2396 Nowhere In Particular and 689 The Red Baron (not taprooms;
-- no retirement rule for that), 699 Traffic Jam and Snug (fire; owner said he would rebuild), 577 Motor City (taproom "paused"),
-- and the 1668winery.com link on 559 (403 to our fetch, not confirmed dead).
--
-- CLOSED
--
-- 2377 Lock 27 Brewing (329 E 1st St, Dayton OH; the brand's Centerville brewpub, row 2376, stays open):
--   https://www.whio.com/news/local/popular-local-brewery-closes-downtown-dayton-location/QOOONTAM4FHE3GGLQHRZUMLTR4/ (WHIO, 17 Oct 2023)
--   "A popular local brewery has closed its downtown Dayton location." and "Lock 27 Brewing, located at 329 E. First Street"  [re-fetched: yes, words found]
UPDATE breweries SET closed_at = '2026-11-23' WHERE id = 2377 AND name = 'Lock 27 Brewing' AND closed_at IS NULL;
-- 483 Founders Brewing Co (456 Charlotte St, Detroit MI; the Detroit taproom only, Grand Rapids is not this row):
--   https://www.fox2detroit.com/news/founders-closes-detroit-taproom-citing-impact-of-pandemics-shutdown (FOX 2 Detroit, 1 May 2023)
--   "Founders Detroit Taproom announced it is permanently closing after six years."  [re-fetched: yes, words found]
--   (same page: "The popular location on Charlotte Street between Cass and 2nd Avenue"). website_url foundersbrewing.com is the live brand site; unchanged.
UPDATE breweries SET closed_at = '2026-11-23' WHERE id = 483 AND name = 'Founders Brewing Co' AND closed_at IS NULL;
-- 633 Roak Brewing Co. (330 E Lincoln Ave, Royal Oak MI):
--   https://www.fox2detroit.com/news/roak-brewing-in-royal-oak-announces-closing-of-taproom-feb-1 (FOX 2 Detroit, 1 Feb 2021)
--   "Roak Brewing Company, which has operated a taproom in the Oakland County city since 2015 announced online it wouldn't be reopening Feb. 1."  [re-fetched: yes, words found]
--   Replacement: https://www.fox2detroit.com/news/eastern-market-brewing-to-expand-to-former-roak-space-in-royal-oak (5 May 2021)
--   "announced Wednesday that it will expand into the former Roak Brewing space in Royal Oak"  [re-fetched: yes, words found]
UPDATE breweries SET closed_at = '2026-11-23' WHERE id = 633 AND name = 'Roak Brewing Co.' AND closed_at IS NULL;
-- 397 Big Rock Chop House & Brewery (245 S Eton St, Birmingham MI):
--   https://www.downtownpublications.com/single-post/big-rock-chophouse-closing-december-18 (Downtown Newsmagazine, 10 Dec 2021)
--   "the owners of Birmingham's Big Rock Chophouse now stated the restaurant will be closing its doors for the last time on Saturday, December 18."  [re-fetched: yes, words found]
--   (same page: "Big Rock Chophouse is located at 245 S. Eton Street").
UPDATE breweries SET closed_at = '2026-11-23' WHERE id = 397 AND name = 'Big Rock Chop House & Brewery' AND closed_at IS NULL;
-- 564 Lumber Barons Brewery (804 E Midland St, Bay City MI). The blog lead was replaced by two news sources:
--   https://www.wnem.com/2024/06/13/businesses-breathing-life-into-bay-citys-midland-street/ (WNEM, 13 Jun 2024)
--   "The Lumber Barons and Stables on Bay City's Midland Street has been closed for nearly two years"  [re-fetched: yes, words found]
--   https://www.michigansthumb.com/news/article/bay-city-lumber-barons-stables-sold-golden-glow-18287457.php (Huron Daily Tribune, 11 Aug 2023)
--   "Currently, the now former Lumber Barons and Stables, which is located at 804 East Midland Street in Bay City, are closed"  [re-fetched: yes, words found]
--   website_url already NULL (0028); lumberbaronsbrewery.com now redirects to rtpslot828.com (slot gambling).
UPDATE breweries SET closed_at = '2026-11-23' WHERE id = 564 AND name = 'Lumber Barons Brewery' AND closed_at IS NULL;
--
-- REPLACED (successor is already listed; the old row is retired, as 0032 did; no merge)
--
-- 2436 Star City Brewing Company (319 S 2nd St, Miamisburg OH). Successor: row 302 Peerless Mill Inn & Brewery, same address.
--   Own site https://www.starcitybrewing.com/
--   "Founded in November of 2025, Peerless Mill Inn & Brewery (formerly Star City Brewing Co)"  [re-fetched: yes, words found]
--   website_url left as is (the domain is the successor's own live site, not dead or unrelated).
UPDATE breweries SET closed_at = '2026-11-23' WHERE id = 2436 AND name = 'Star City Brewing Company' AND closed_at IS NULL;
-- 2323 Bowling Green Beer Works (322 N Grove St Ste C, Bowling Green OH). Successor: row 50 Brewing Green (new owners, new name).
--   https://bgfalconmedia.com/97370/news/bgs-oldest-brewery-makes-new-changes/ (BG Falcon Media; article date not printed)
--   "Bowling Green's oldest brewery, Bowling Green Beer Works, is making some big changes."  [re-fetched: yes, words found]
--   "Householder and Develvis wanted a fresh start for the business, including a new name, changing it from Bowling Green Brew Works to Brewing Green."  [re-fetched: yes, words found]
UPDATE breweries SET closed_at = '2026-11-23' WHERE id = 2323 AND name = 'Bowling Green Beer Works' AND closed_at IS NULL;
--
-- WEBSITE LINK REMOVED
--
-- 397 Big Rock Chop House & Brewery. Previous website_url: 'http://www.bigrockchophouse.com'. On 2026-11-23 http 301 -> https; the https
--   site serves a TLS certificate for 375atthedistrict.com (an unrelated site) and a hosting company's default page:
--   "You have reached the default application for IP address 192.241.150.108."  [re-fetched: yes, words found]
UPDATE breweries SET website_url = NULL WHERE id = 397 AND name = 'Big Rock Chop House & Brewery' AND website_url = 'http://www.bigrockchophouse.com';
