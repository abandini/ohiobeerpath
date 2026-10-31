-- Dog-friendly Ohio breweries guide (2026-10-31): /blog/dog-friendly-ohio-breweries now renders the sourced guide in
-- src/templates/dog-guide.ts (data in src/data/dog-guide.ts) instead of this row's unsourced content. The title is
-- unchanged (still 15, all sourced). Only the excerpt and updated_at change, so the /blog list matches the guide
-- (the route also overlays them until this runs). Previous values (for rollback): excerpt 'Bring your four-legged
-- friend along for brewery hopping at these pet-friendly Ohio spots.', updated_at '2026-06-02T12:00:00.000Z'.
UPDATE blog_posts SET excerpt = 'Fifteen Ohio breweries from Cleveland to Cincinnati that welcome dogs, each policy quoted from the brewery’s own website with the rules it posts.', updated_at = '2026-10-31T12:00:00.000Z' WHERE id = 20 AND slug = 'dog-friendly-ohio-breweries';
