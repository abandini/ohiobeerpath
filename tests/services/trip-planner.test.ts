import { describe, it, expect } from 'vitest';
import { generateSlug } from '../../src/services/trip-planner';

describe('generateSlug', () => {
  it('generates a slug from title', () => {
    const slug = generateSlug('The Columbus Brewery Crawl');
    expect(slug).toMatch(/^the-columbus-brewery-crawl-[a-z0-9]+$/);
  });

  it('handles special characters', () => {
    const slug = generateSlug("Wolf's Ridge & Hoof Hearted!");
    expect(slug).toMatch(/^wolfs-ridge-hoof-hearted-[a-z0-9]+$/);
  });

  it('generates unique slugs', () => {
    const a = generateSlug('Test');
    const b = generateSlug('Test');
    expect(a).not.toBe(b);
  });
});
