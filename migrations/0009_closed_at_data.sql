-- 2026-09-29 closure audit round 3 (dated press only) + verified website fixes. Idempotent.
UPDATE breweries SET closed_at='2026-01-13' WHERE id IN (47, 2328) AND closed_at IS NULL; -- BrewDog Short North (both rows): NBC4 2026-01-13
UPDATE breweries SET closed_at='2026-01-01' WHERE id=213 AND closed_at IS NULL;          -- Mentor Brewing: cleveland.com 2025-10
UPDATE breweries SET closed_at='2025-02-07' WHERE id IN (264, 2418) AND closed_at IS NULL; -- Railroad Brewing (Avon, both rows): WKYC 2025-02-07
UPDATE breweries SET closed_at='2025-08-31' WHERE id=321 AND closed_at IS NULL;          -- Tricky Tortoise: Cleveland Scene 2025-09-03
UPDATE breweries SET closed_at='2025-10-10' WHERE id=330 AND closed_at IS NULL;          -- Verge Brewing never opened: Business Courier 2025-10-10
UPDATE breweries SET website_url='https://www.austinmillbrewingcompany.com/' WHERE id=16;
UPDATE breweries SET website_url='https://brickandbarrelbrewery.com/' WHERE id=51;
UPDATE breweries SET website_url='https://www.bumminbeaver.com/' WHERE id=60;
UPDATE breweries SET website_url='https://www.earnestbrewworks.com/westgate/' WHERE id=97;
UPDATE breweries SET website_url='https://fcbrewgarden.com/' WHERE id=124;
UPDATE breweries SET website_url='https://gravelroadbrewingco.com/' WHERE id=134;
UPDATE breweries SET website_url='https://www.hoptometrybrewing.com/' WHERE id=165;
UPDATE breweries SET website_url='https://purposebrewworks.com/' WHERE id=262;
UPDATE breweries SET website_url='https://cleveland.stbcbeer.com/' WHERE id=296;
UPDATE breweries SET website_url='https://www.squidsbrewery.com/' WHERE id=298;
UPDATE breweries SET website_url='https://thelivingroomcabaret.com/' WHERE id=309;
INSERT INTO d1_migrations (name, applied_at) SELECT '0009_closed_at.sql', CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0009_closed_at.sql');
