-- Add category column to blog_posts.
-- The original 0004 schema omitted it, but src/routes/pages.ts and the
-- BlogPost interface reference category (related-posts query filters on it),
-- so DB-backed posts 404'd until this column existed.
ALTER TABLE blog_posts ADD COLUMN category TEXT;

CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_posts(category);
