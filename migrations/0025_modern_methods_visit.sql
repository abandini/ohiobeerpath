-- Modern Methods Brewing Company (id 218): street address, ZIP, website and a verbatim About quote from the brewery's own site,
-- plus Bill's own photos and note from his visit on Saturday, 2026-11-21. Bill received the brewery's permission to use the photos.
-- Checked 2026-11-22: https://modernmethodsbrew.com/welcome prints "125 David Grohl Alley Warren, OH 44481", "(330) 333-1594"
-- (the phone already on file) and "Taproom Hours: Thu 5-10pm, Fri 2-11pm, Sat 12-11pm, Sun 12-6pm" (the hours already on file, unchanged).
-- Photos (files 1000019417/21/24/25.jpg), each resized to at most 1600px WebP with all metadata stripped:
--   bar-warren: cropped to drop a TV showing a broadcast at the left edge.
--   taplist-nov21: two small photo stickers of faces on the board (taps 10 and 17) are blurred.
--   coaster-face: cropped to drop a framed document with a transaction number below it.
--   coaster-be-nice: cropped to the subject. No people are in frame (one hand holding the coaster).
-- Left out after review: 1000019418 (a vintage Santa soda-advertisement cutout) and 1000019423 (a painting of a third party's
-- character). The brewery's permission covers the photos, not those characters. The Santa is still visible, small, in bar-warren.
-- R2 upload (run before this UPDATE), for each NAME in bar-warren taplist-nov21 coaster-face coaster-be-nice:
--   npx wrangler r2 object put ohio-beer-path-images/breweries/modern-methods/NAME.webp --file data/photos/modern-methods/modern-methods-NAME.webp --content-type image/webp --remote
-- Previous values (for rollback): street '', postal_code '', website_url 'http://www.modernmethodsbrew.com', about_quote NULL,
-- about_source_url NULL, about_checked_at NULL, photos NULL, photo_credit NULL, visit_notes NULL.
UPDATE breweries SET
  street = '125 David Grohl Alley',
  postal_code = '44481',
  website_url = 'https://modernmethodsbrew.com/',
  about_quote = 'In 1909, Warren erected a massive sign on City Hall: "Opportunity? It''s here! Warren - City of Modern Methods." At the time, Warren was a growing industrial city and was bursting at the seams with pride. In 1899, the first Packard Automobile rolled off the line and in 1905, it was the first city with electric street lights. We brew beer with the spirit of adventure, ambition, and optimism that made our town the City of Modern Methods!', about_source_url = 'https://modernmethodsbrew.com/welcome',
  about_checked_at = '2026-11-22',
  photos = '[{"url":"/images/breweries/modern-methods/bar-warren.webp","alt":"The bar at Modern Methods Brewing Company: large metal letters spelling WARREN on a wood-plank wall above a long row of taps, a framed “Drink Modern Methods Brewing Company” sign in the middle and a cardboard Santa standing in front","width":1600,"height":883},{"url":"/images/breweries/modern-methods/taplist-nov21.webp","alt":"Modern Methods Brewing Company “Beers on Tap” chalkboard on Nov 21, 2026: eighteen numbered, hand-lettered beer listings with styles, strengths and prices, among them Darlene Lager, Dub City West Coast IPA, Scrappy German Hefeweizen, Panthertown Pilsner, Hillbilly Elite Hazy IPA, Percolator Coffee Lager and Roast Beast American Nitro Stout, with a Fall Cocktails list to the left and steel tanks to the right","width":1600,"height":961},{"url":"/images/breweries/modern-methods/coaster-face.webp","alt":"A hand-painted coaster with a cubist-style face, above a ceramic beer-mug ornament","width":1071,"height":1600},{"url":"/images/breweries/modern-methods/coaster-be-nice.webp","alt":"A hand holding a round coaster with the handwritten words “Be nice to a mean person”, in front of the taps at Modern Methods Brewing Company","width":986,"height":1600}]',
  photo_credit = 'Photos: Brewery Trip visit, Nov 21, 2026, used with the brewery’s permission',
  visit_notes = '[{"date":"2026-11-21","text":"We stopped in on Saturday, Nov 21: great beer and a great experience."}]'
WHERE id = 218 AND name = 'Modern Methods Brewing Company';
