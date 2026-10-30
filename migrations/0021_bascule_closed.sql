-- Bascule Brewery and Public House (id 21, Lorain): retired 2026-10-30 at Bill's direction ("keep Bascule Brewery and
-- Public House closed"). Evidence: Untappd (checked 2026-10-30) "This brewery is no longer in business."; Chronicle-Telegram
-- reported it "would be reducing its hours of operation and closing in the near future" (undated page); Cleveland19
-- (2025-12-08) listed its imminent closure. closed_at is the review date because the actual closing date is not established;
-- it is never displayed, only used to retire the listing. Previous value (for rollback): closed_at NULL.
UPDATE breweries SET closed_at = '2026-10-30' WHERE id = 21 AND name = 'Bascule Brewery and Public House' AND closed_at IS NULL;
