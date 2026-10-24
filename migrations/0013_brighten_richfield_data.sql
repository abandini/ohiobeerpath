-- Brighten Brewing Company, Copley OH: missing from the directory (reported by domain-hub 2026-10-18; API search "brighten" returned 0).
-- Verified 2026-10-18 against the brewery's own site (brightenbrew.com): address and taproom hours from the home and contact pages;
-- quote from the Our Story page. Summit Brew Path 2026 lists it as an official stop (visitakron-summit.org listing 527; LoyalBrew passport).
-- Not included: phone (only on the CVB listing, not the brewery's site), amenities, brewery_type (not stated by the brewery).
-- Street is written exactly as the brewery writes it. lat/lng are an OSM Nominatim geocode of that address: kept against Astra's advice because
-- every row needs coordinates for nearby/map/trip features; they derive from the sourced address and are never displayed as a claim.
INSERT INTO breweries (name, brewery_type, street, city, state_province, postal_code, country, longitude, latitude, phone, website_url, state, region, amenities, hours, about_quote, about_source_url, about_checked_at)
SELECT 'Brighten Brewing Company', NULL, '1374 S Cleve-Mass Rd', 'Copley', 'Ohio', '44321', 'United States', -81.6447221, 41.1008731, NULL, 'https://www.brightenbrew.com/', 'OH', 'northeast', '[]', '{"Monday": "Closed", "Tuesday": "4:00 pm – 10:00 pm", "Wednesday": "4:00 pm – 10:00 pm", "Thursday": "12:00 pm – 10:00 pm", "Friday": "12:00 pm – 11:00 pm", "Saturday": "12:00 pm – 11:00 pm", "Sunday": "1:00 pm – 7:00 pm"}', 'Our dream started out with two local Akron area high school friends wanting to bring a traditional and well-balanced brewery experience to life.', 'https://www.brightenbrew.com/brighten-our-story', '2026-10-24'
WHERE NOT EXISTS (SELECT 1 FROM breweries WHERE name = 'Brighten Brewing Company');

-- The Richfield Brewing Company, Richfield OH: Summit Brew Path 2026 official stop (LoyalBrew passport), missing from the directory.
-- Verified 2026-10-18 against richfieldbrewing.com: quote, address, phone and hours from the home page. The site's home page and /contact-us
-- disagree on Sunday (12-7 vs 11-4 brunch), so Sunday is omitted until the brewery confirms. lat/lng: OSM Nominatim geocode of the address (see note above).
INSERT INTO breweries (name, brewery_type, street, city, state_province, postal_code, country, longitude, latitude, phone, website_url, state, region, amenities, hours, about_quote, about_source_url, about_checked_at)
SELECT 'The Richfield Brewing Company', 'brewpub', '3871 Broadview Rd', 'Richfield', 'Ohio', '44286', 'United States', -81.6531024, 41.2374336, '330-944-2739', 'https://www.richfieldbrewing.com/', 'OH', 'northeast', '[]', '{"Monday": "11:30 am – 9:00 pm", "Tuesday": "Closed", "Wednesday": "11:30 am – 9:00 pm", "Thursday": "11:30 am – 9:00 pm", "Friday": "11:30 am – 10:00 pm", "Saturday": "11:30 am – 10:00 pm"}', 'After three years of dreaming, planning and building, we opened our doors in December 2024. Since then, we have been hard at work growing our home-brewed draft list, menu of elevated pub fare, and our community-based family atmosphere.', 'https://www.richfieldbrewing.com/', '2026-10-24'
WHERE NOT EXISTS (SELECT 1 FROM breweries WHERE name = 'The Richfield Brewing Company');

-- Photos for Brighten Brewing: Bill's own room shots from his 2026-10-17 visit (files 20261017_155025 / 140033 / 135735.jpg), resized to
-- 1600px WebP with all EXIF/GPS/ICC metadata stripped (verified: zero EXIF tags in the outputs). Close-ups of individual artworks were
-- deliberately excluded (artist copyright). Alt text is descriptive only. Credit line is a placeholder until Bill confirms the wording.
-- R2 upload (run before this UPDATE; bucket ohio-beer-path-images, served at brewerytrip.com/images/<key>):
--   npx wrangler r2 object put ohio-beer-path-images/breweries/brighten-brewing/taproom-1.webp --file data/photos/brighten-brewing/brighten-taproom-1.webp --content-type image/webp --remote
--   npx wrangler r2 object put ohio-beer-path-images/breweries/brighten-brewing/taproom-2.webp --file data/photos/brighten-brewing/brighten-taproom-2.webp --content-type image/webp --remote
--   npx wrangler r2 object put ohio-beer-path-images/breweries/brighten-brewing/taproom-3.webp --file data/photos/brighten-brewing/brighten-taproom-3.webp --content-type image/webp --remote
UPDATE breweries SET
  photos = '[{"url":"/images/breweries/brighten-brewing/taproom-1.webp","alt":"Brighten Brewing taproom: pool table, dartboard, bar-height counter with stools and three abstract landscape paintings"},{"url":"/images/breweries/brighten-brewing/taproom-2.webp","alt":"Brighten Brewing taproom: counter seating under three paintings, an arcade cabinet, a leather couch and a window onto trees"},{"url":"/images/breweries/brighten-brewing/taproom-3.webp","alt":"Brighten Brewing dining room: tables and chairs, pool table, plants and the OPEN sign in the front window"}]',
  photo_credit = 'Photo: Brewery Trip visit, Oct 17, 2026'
WHERE name = 'Brighten Brewing Company';
