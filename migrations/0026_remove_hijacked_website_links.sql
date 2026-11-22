-- Five Pennsylvania listings linked to domains the breweries no longer control. Checked 2026-11-22 by plain fetch:
--   www.gretnabrewery.com        -> redirects to 3dbet777.com (online gambling)
--   www.batdorfrestaurant.com    -> redirects to generasitogel1.xyz (online gambling)
--   www.brokenchairbrewery.com   -> redirects to cikatoto4d.com (online gambling)
--   www.stickmanbrews.com        -> redirects to infotogelonlineterpercaya.online (online gambling)
--   www.crowdedcastle.com        -> parked page
-- The links are removed. Rotunda Brewing (1197) gets its own current site, https://rotundabrewing.com/ (HTTP 200, names
-- Annville). Whether 998, 1031, 1153 and 1232 are closed or renamed is a separate decision and is NOT made here.
-- NEVER link these five domains again.
-- Previous values (for rollback): 998 'http://www.brokenchairbrewery.com'; 1031 'http://www.crowdedcastle.com';
-- 1153 'http://www.gretnabrewery.com'; 1197 'http://www.batdorfrestaurant.com/rbc'; 1232 'http://www.stickmanbrews.com'.
UPDATE breweries SET website_url = NULL WHERE id = 998 AND website_url = 'http://www.brokenchairbrewery.com';
UPDATE breweries SET website_url = NULL WHERE id = 1031 AND website_url = 'http://www.crowdedcastle.com';
UPDATE breweries SET website_url = NULL WHERE id = 1153 AND website_url = 'http://www.gretnabrewery.com';
UPDATE breweries SET website_url = 'https://rotundabrewing.com/' WHERE id = 1197 AND website_url = 'http://www.batdorfrestaurant.com/rbc';
UPDATE breweries SET website_url = NULL WHERE id = 1232 AND website_url = 'http://www.stickmanbrews.com';
