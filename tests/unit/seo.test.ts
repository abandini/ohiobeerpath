/**
 * Unit tests for SEO / AEO / AdSense head output
 */
import { describe, it, expect } from 'vitest';
import { layout, ADSENSE_CLIENT } from '../../src/templates/layout';
import { homePage, homeSummary } from '../../src/templates/home';
import { jsonLd, escapeAttr, truncateDescription } from '../../src/templates/utils';
import type { Brewery } from '../../src/types';

const brewery = (id: number, name: string): Brewery => ({ id, name, city: 'Columbus', state: 'OH', region: 'Central' });

describe('utils', () => {
  it('jsonLd escapes a closing script tag inside JSON', () => {
    const out = jsonLd({ description: 'bad </script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(JSON.parse(out).description).toBe('bad </script><script>alert(1)</script>');
    const comment = jsonLd({ d: 'x <!-- y' });
    expect(comment).not.toContain('<!--');
    expect(JSON.parse(comment).d).toBe('x <!-- y');
  });

  it('escapeAttr neutralizes quotes and angle brackets', () => {
    expect(escapeAttr('Dog & "Pony" <Show>')).toBe('Dog &amp; &quot;Pony&quot; &lt;Show&gt;');
  });

  it('truncateDescription keeps short text and trims long text at a word boundary', () => {
    expect(truncateDescription('Short and sweet.')).toBe('Short and sweet.');
    const long = 'word '.repeat(60).trim();
    const out = truncateDescription(long);
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });
});

describe('layout head', () => {
  const html = layout('Test Page', '<p>body</p>', { description: 'A "quoted" description with </script> inside' });

  it('includes the AdSense account meta and Auto ads loader', () => {
    expect(ADSENSE_CLIENT).toBe('ca-pub-3401889582473794');
    expect(html).toContain('<meta name="google-adsense-account" content="ca-pub-3401889582473794">');
    expect(html).toContain('<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3401889582473794" crossorigin="anonymous"></script>');
  });

  it('uses the trailing-slash root canonical by default', () => {
    expect(html).toContain('<link rel="canonical" href="https://brewerytrip.com/">');
    expect(html).toContain('<meta property="og:url" content="https://brewerytrip.com/">');
  });

  it('escapes quotes in meta description and title', () => {
    expect(html).toContain('content="A &quot;quoted&quot; description with &lt;/script&gt; inside"');
    expect(html).toContain('<title>Test Page | Brewery Trip</title>');
  });

  it('emits exactly one og:image and a twitter card', () => {
    expect(html.match(/property="og:image"/g)?.length).toBe(1);
    expect(html).toContain('https://brewerytrip.com/assets/images/og-image.png');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
  });

  it('WebSite JSON-LD parses and never contains a raw closing script tag', () => {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
    expect(blocks.length).toBeGreaterThan(0);
    const site = JSON.parse(blocks[0]);
    expect(site['@type']).toBe('WebSite');
    expect(site.description).toContain('</script>');
  });

  it('caps meta description at 160 characters', () => {
    const longHtml = layout('T', '', { description: 'x'.repeat(50) + ' ' + 'y'.repeat(200) });
    const m = longHtml.match(/<meta name="description" content="([^"]*)"/);
    expect(m).not.toBeNull();
    expect(m![1].length).toBeLessThanOrEqual(160);
  });
});

describe('home page', () => {
  const stats = { total: 1365, regions: 24, states: ['Ohio', 'Michigan', 'Pennsylvania'], updatedAt: '2026-06-21' };
  const html = homePage([brewery(1, 'A'), brewery(2, 'B')], stats);

  it('has exactly one h1', () => {
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
  });

  it('shows a quotable summary with count, coverage and last-updated date near the top', () => {
    const summary = homeSummary(stats, 'Brewery Trip', true, 'Ohio');
    expect(summary).toContain('1,365 craft breweries');
    expect(summary).toContain('Ohio, Michigan and Pennsylvania');
    expect(summary).toContain('Listings last updated June 21, 2026');
    expect(html).toContain(summary);
    expect(html.indexOf('hero-summary')).toBeLessThan(html.indexOf('searchInput'));
  });

  it('HowTo and FAQ JSON-LD both parse', () => {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    const types = blocks.map(b => b['@type']);
    expect(types).toEqual(expect.arrayContaining(['WebSite', 'HowTo', 'FAQPage']));
  });
});
