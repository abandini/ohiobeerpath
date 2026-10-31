import { describe, it, expect } from 'vitest';
import { sampleBlogPosts } from '../../src/templates/blog';
import pages, { RETIRED_BLOG_SLUGS } from '../../src/routes/pages';

const SLUG = 'ohio-beer-week-2024-preview';
// Even if the D1 row were still published, a retired slug answers 410.
const row = { id: 19, slug: SLUG, title: 'Ohio Beer Week 2024: What to Expect', excerpt: 'x', content: 'x', category: 'Events', published: 1, created_at: '2026-01-01T00:00:00.000Z' };
const env = { DB: { prepare: () => ({ bind() { return this; }, all: async () => ({ results: [] }), first: async () => row }) } };

describe('retired blog posts', () => {
  it('answers 410 Gone for the 2024 Ohio Beer Week preview', async () => {
    expect(RETIRED_BLOG_SLUGS.has(SLUG)).toBe(true);
    const r = await pages.request(`/blog/${SLUG}`, {}, env);
    expect(r.status).toBe(410);
    expect(await r.text()).toContain('href="/blog"');
  });
  it('is gone from the sample-post fallback', () => {
    expect(sampleBlogPosts.some((p) => p.slug === SLUG)).toBe(false);
  });
});
