-- Retire the thin 2024 Ohio Beer Week preview (Bill, 2026-10-31). The route also answers 410 for this slug.
-- Rollback: UPDATE blog_posts SET published = 1 WHERE id = 19 AND slug = 'ohio-beer-week-2024-preview'; and remove the slug from RETIRED_BLOG_SLUGS in src/routes/pages.ts.
UPDATE blog_posts SET published = 0 WHERE id = 19 AND slug = 'ohio-beer-week-2024-preview';
