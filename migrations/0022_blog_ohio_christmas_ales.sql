-- Lists the sourced Ohio Christmas ales guide (/blog/ohio-christmas-ales) on /blog. The page itself is served by
-- src/templates/christmas-ales.ts from src/data/christmas-ales.ts (route registered before /blog/:slug), so `content`
-- here is only a summary and is never rendered. Title and excerpt match CHRISTMAS_ALES in src/data/christmas-ales.ts.
-- Rollback: DELETE FROM blog_posts WHERE slug = 'ohio-christmas-ales';
INSERT OR IGNORE INTO blog_posts (slug, title, excerpt, content, author, featured_image, tags, category, published, published_at, created_at, updated_at)
VALUES (
  'ohio-christmas-ales',
  'Ohio Christmas Ales: 10 Holiday Beers to Look For (2026 Guide)',
  'Ten Ohio Christmas and holiday beers from Cleveland, Akron, Toledo, Columbus, Dayton, Cincinnati and Athens, each described in its brewery’s own words, with a link to the page we quoted.',
  'Ten Ohio Christmas and holiday beers from Cleveland, Akron, Toledo, Columbus, Dayton, Cincinnati and Athens, each described in its brewery’s own words, with a link to the page we quoted.',
  'Ohio Beer Path',
  'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=1200',
  'Christmas Ale, Holiday Beer, Guides, Craft Beer',
  'Guides',
  1,
  '2026-10-31T12:00:00.000Z',
  '2026-10-31T12:00:00.000Z',
  '2026-10-31'
);
