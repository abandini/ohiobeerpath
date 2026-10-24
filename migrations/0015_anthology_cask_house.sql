-- Anthology Cask House (2026-10-24). Every field below is sourced: address/owners/opening and the four hand-pulled
-- beer engines: Cleveland Magazine, Aug. 14, 2026; brewed on site: Cleveland Scene, Aug. 5, 2026; imported drafts and
-- Little Cloud food: Cleveland Scene, May 7, 2026; coordinates: OpenStreetMap Nominatim. No official website or phone
-- was found, so those stay empty.
INSERT INTO breweries (name, brewery_type, street, city, state_province, postal_code, country, longitude, latitude, phone, website_url, state, region, amenities, description, hours, image_url, created_at, updated_at, about_quote, about_source_url, about_checked_at)
SELECT 'Anthology Cask House', 'brewpub', '1526 W. 25th St', 'Cleveland', 'Ohio', '44113', 'United States', -81.7070255, 41.4895913, NULL, NULL, 'OH', 'northeast', NULL,
  'Anthology Cask House is a cask-ale pub and brewery in Ohio City that opened on Aug. 14, 2026, in the former Bookhouse Brewing space. It comes from Noble Beast''s Shaun and JoLyn Yasaki. Its cask ales are brewed on site and poured from hand-pulled beer engines, alongside imported European draft beers, and food comes from Little Cloud next door.',
  NULL, NULL, datetime('now'), datetime('now'),
  'the cask ales, which are brewed onsite by Yasaki and brewer Logan Buckley-Neff', 'https://www.clevescene.com/food-drink/first-look-anthology-cask-house-opening-in-ohio-city-friday-aug-14/', '2026-10-24'
WHERE NOT EXISTS (SELECT 1 FROM breweries WHERE name = 'Anthology Cask House');
