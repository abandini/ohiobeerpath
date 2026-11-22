-- Two more listings linked to domains the breweries no longer control. Checked 2026-11-22 by plain fetch:
--   www.butlerbrewworks.com     -> lands on an unrelated host serving a page titled "BTV168: Situs Slot Gacor ..." (online gambling)
--   www.reclamationbrewing.com  -> redirects to royal707wow.com (online gambling)
-- The links are removed. Whether 1006 and 1183 are closed is a separate decision and is NOT made here.
-- NEVER link these two domains again.
-- Previous values (for rollback): 1006 'http://www.butlerbrewworks.com'; 1183 'http://www.reclamationbrewing.com'.
UPDATE breweries SET website_url = NULL WHERE id = 1006 AND website_url = 'http://www.butlerbrewworks.com';
UPDATE breweries SET website_url = NULL WHERE id = 1183 AND website_url = 'http://www.reclamationbrewing.com';
