-- Medina Brewing Company (id 211): website, street address and a verbatim About quote, all from the brewery's own site,
-- checked 2026-10-30. https://www.medinabrewing.co/ prints "320 S Court Street G9, Medina, OH 44256" and "(330) 952-1217"
-- (the phone already on file), with "Copyright © 2025 Medina Brewing Company". Do NOT use medinabrewingcompany.com: on
-- 2026-10-30 that domain served an unrelated online-casino affiliate page.
-- Previous values (for rollback): website_url NULL, street '', address_2 NULL, postal_code '', about_* NULL.
UPDATE breweries SET
  website_url = 'https://www.medinabrewing.co/',
  street = '320 S Court St',
  address_2 = 'G9',
  postal_code = '44256',
  about_quote = 'We craft memorable moments with seasonal in-house brews. Our location features indoor and outdoor seating in the unique Medina Farmers Exchange on South Court Street in historic downtown Medina Square.', about_source_url = 'https://www.medinabrewing.co/',
  about_checked_at = '2026-10-30'
WHERE id = 211 AND name = 'Medina Brewing Company';
