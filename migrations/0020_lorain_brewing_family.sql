-- Lorain Brewing family (2026-10-30, at Bill's request: Medina Brewing is a sister of Lorain Brewing).
-- First-party source: https://www.lorainbrewingco.com/contact ("Welcome to the family") lists AVON 820 Center Rd, Avon, OH 44011,
-- (440) 695-0536; LORAIN 500 Shipyard Way Lorain, OH 44052, (440) 434-2020; MEDINA 320 S Court Street G9. Medina's own
-- https://www.medinabrewing.co/locations lists the same Avon address under a "ZZ's Big Top Avon, ESTD 2020" logo.
-- News5 Cleveland (grand opening "the day after Christmas"; page undated, image file dated 2024-12-26): "Now, Avon Brewing
-- Company has become Lorain Brewing Company." and co-owner/brewmaster Mathias Hauck: "Avon is no longer in existence but we
-- are here in Lorain". Coordinates: OpenStreetMap Nominatim for each street address.

-- 1. Lorain Brewing Company: new listing (applied 2026-10-30 as id 2468; roll back with DELETE ... WHERE id = 2468).
INSERT INTO breweries (name, brewery_type, street, city, state_province, postal_code, country, longitude, latitude, phone, website_url, state, region, amenities, hours, about_quote, about_source_url, about_checked_at) SELECT 'Lorain Brewing Company', 'brewpub', '500 Shipyard Way', 'Lorain', 'Ohio', '44052', 'United States', -82.1671599, 41.4670120, '(440) 434-2020', 'https://www.lorainbrewingco.com/', 'OH', 'northeast', '[]', NULL, 'Lorain Brewing Company is located in a historical, industrial shipyard building that occupies 25,000 square feet. The unique building houses a tap house, restaurant, event center, cocktail lounge, coffee shop, outdoor bar, and boat docks.', 'https://www.lorainbrewingco.com/', '2026-10-30'
WHERE NOT EXISTS (SELECT 1 FROM breweries WHERE name = 'Lorain Brewing Company');

-- 2. ZZs Big Top (id 351): street, ZIP and coordinates from the address above. Its own site (zzsbigtop.com) did not respond on
--    2026-10-30, so website_url stays empty. Nominatim labels the 820 Center Rd node "Moosehead BBQ Grill"; that label is not
--    evidence about ZZ's, and the pin is derived from the street address only. Previous values (for rollback): street '', postal_code '', latitude 41.4534496,
--    longitude -82.0005533.
UPDATE breweries SET street = '820 Center Rd', postal_code = '44011', latitude = 41.4800570, longitude = -82.0197823
WHERE id = 351 AND name = 'ZZs Big Top';

-- 3. Avon Brewing Company (id 17): retired; it became Lorain Brewing Company (News5, above). closed_at is the review date:
--    the historical closure date is not established (the News5 page is undated). It is never displayed, only used to
--    retire the old listing.
UPDATE breweries SET closed_at = '2026-10-30' WHERE id = 17 AND name = 'Avon Brewing Company' AND closed_at IS NULL;
