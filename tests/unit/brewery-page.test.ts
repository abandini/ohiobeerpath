import { describe, it, expect } from 'vitest';
import { breweryPage, buildPageTitle, buildSeoDescription, breweryTypeLabel, hostOf } from '../../src/templates/brewery';
import { sourcedQuote, safeHttpUrl, isCalendarDate, safeImagePath } from '../../src/templates/utils';
import { breweryCard } from '../../src/templates/breweries';
import type { Brewery } from '../../src/types';

const GENERATED = 'Nestled in the charming town of Columbiana, Ohio, Birdfish Brewing Co. is a warm and welcoming haven with a signature Appalachian Pale Ale.';

const base: Brewery = {
  id: 27,
  name: 'Birdfish Brewing Co.',
  brewery_type: 'micro',
  city: 'Columbiana',
  state: 'OH',
  region: 'Northeast',
  postal_code: '44408',
  phone: '330-333-9385',
  website_url: 'http://www.birdfishbrew.com',
  description: GENERATED,
  amenities: [],
  hours: {},
};

describe('brewery page: sourced copy only', () => {
  it('never renders the generated description, even when it is the only text available', () => {
    const html = breweryPage(base);
    expect(html).not.toContain('Nestled in the charming town');
    expect(html).not.toContain('signature Appalachian Pale Ale');
    expect(html).toContain('We haven’t confirmed a description from Birdfish Brewing Co.’s own website yet');
    // the fallback still shows listing facts
    expect(html).toContain('<dt>Type</dt><dd>Microbrewery</dd>');
    expect(html).toContain('<dt>Location</dt><dd>Columbiana, OH, 44408</dd>');
    expect(html).toContain('tel:3303339385');
    expect(html).toContain('birdfishbrew.com</a>');
  });

  it('renders a verbatim quote with its source link and check date', () => {
    const html = breweryPage({
      ...base,
      about_quote: 'We’re a family-friendly establishment. Our taproom and patio are dog-friendly.',
      about_source_url: 'https://www.birdfishbrew.com/',
      about_checked_at: '2026-10-18',
    });
    expect(html).toContain('<blockquote class="about-quote" cite="https://www.birdfishbrew.com/">');
    expect(html).toContain('“We’re a family-friendly establishment. Our taproom and patio are dog-friendly.”');
    expect(html).toContain('href="https://www.birdfishbrew.com/"');
    expect(html).toContain('birdfishbrew.com</a>, checked October 18, 2026');
    expect(html).not.toContain('Nestled in the charming town');
  });

  it('escapes HTML inside the quote and source', () => {
    const html = breweryPage({ ...base, about_quote: 'Beer <b>&</b> "pizza"', about_source_url: 'https://x.test/?a=1&b=2', about_checked_at: '2026-10-18' });
    expect(html).toContain('Beer &lt;b&gt;&amp;&lt;/b&gt; &quot;pizza&quot;');
    expect(html).toContain('href="https://x.test/?a=1&amp;b=2"');
  });

  it('ignores a quote that has no source url, a non-http source, or an impossible check date', () => {
    expect(breweryPage({ ...base, about_quote: 'Unsourced claim', about_checked_at: '2026-10-18' })).not.toContain('Unsourced claim');
    expect(breweryPage({ ...base, about_quote: 'Unsourced claim', about_source_url: 'javascript:alert(1)', about_checked_at: '2026-10-18' })).not.toContain('Unsourced claim');
    expect(breweryPage({ ...base, about_quote: 'Unsourced claim', about_source_url: 'https://ok.test/', about_checked_at: '2026-02-30' })).not.toContain('Unsourced claim');
    expect(breweryPage({ ...base, about_quote: 'Unsourced claim', about_source_url: 'https://ok.test/' })).not.toContain('Unsourced claim');
  });

  it('never emits a non-http website link', () => {
    const html = breweryPage({ ...base, website_url: 'javascript:alert(1)' });
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('<dt>Website</dt>');
  });

  it('does not invent a state or price for rows without one', () => {
    const html = breweryPage({ ...base, state: undefined, postal_code: undefined });
    expect(html).not.toContain('Ohio');
    expect(html).not.toContain('priceRange');
    expect(html).not.toContain('isAccessibleForFree');
    const title = html.match(/<title>(.*?)<\/title>/)![1];
    expect(title).toBe('Birdfish Brewing Co., Columbiana: phone | Brewery Trip');
  });
});

describe('provenance validator', () => {
  it('requires quote + http(s) source + real calendar date', () => {
    expect(sourcedQuote({ about_quote: 'x', about_source_url: 'https://a.test/p', about_checked_at: '2026-10-18' })).toEqual({ quote: 'x', sourceUrl: 'https://a.test/p', host: 'a.test', checkedAt: '2026-10-18' });
    expect(sourcedQuote({ about_quote: '  ', about_source_url: 'https://a.test/', about_checked_at: '2026-10-18' })).toBeNull();
    expect(sourcedQuote({ about_quote: 'x', about_source_url: 'ftp://a.test/', about_checked_at: '2026-10-18' })).toBeNull();
    expect(sourcedQuote({ about_quote: 'x', about_source_url: 'https://a.test/', about_checked_at: '2026-13-01' })).toBeNull();
    expect(sourcedQuote({ about_quote: 'x', about_source_url: 'https://a.test/', about_checked_at: '18 Oct 2026' })).toBeNull();
  });
  it('safeHttpUrl and isCalendarDate', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBe('');
    expect(safeHttpUrl('http://www.birdfishbrew.com')).toBe('http://www.birdfishbrew.com/');
    expect(safeHttpUrl('nope')).toBe('');
    expect(isCalendarDate('2026-02-29')).toBe(false);
    expect(isCalendarDate('2024-02-29')).toBe(true);
  });
  it('card and spotlight escape the quote and only show it when sourced', () => {
    const card = breweryCard({ ...base, about_quote: 'Beer <b>&</b>', about_source_url: 'https://a.test/', about_checked_at: '2026-10-18' });
    expect(card).toContain('Beer &lt;b&gt;&amp;&lt;/b&gt;');
    expect(card).toContain('cite="https://a.test/"');
    const unsourced = breweryCard({ ...base, about_quote: 'Beer <b>&</b>' });
    expect(unsourced).not.toContain('Beer');
    expect(unsourced).toContain('micro in Columbiana, Ohio.');
  });
});

describe('brewery page: empty sections are not rendered', () => {
  it('omits the amenities card when there are none', () => {
    expect(breweryPage(base)).not.toContain('Amenities &amp; Features');
    expect(breweryPage(base)).not.toContain('Amenities & Features');
    expect(breweryPage(base)).not.toContain('No amenities listed');
    const withAmenities = breweryPage({ ...base, amenities: ['Dog Friendly'] });
    expect(withAmenities).toContain('Amenities & Features');
    expect(withAmenities).toContain('Dog Friendly');
  });

  it('has no inferred-vibe recommendations block', () => {
    const html = breweryPage(base);
    expect(html).not.toContain('AI-Powered Recommendations');
    expect(html).not.toContain('getRecommendations(');
    expect(html).not.toContain('Finding recommendations');
  });

  it('keeps the review form but drops the "No reviews yet" filler', () => {
    const html = breweryPage(base, undefined, [], []);
    expect(html).toContain('id="review-form"');
    expect(html).not.toContain('No reviews yet');
    expect(html).not.toContain('Be the first to share');
  });

  it('does not count blank hour values as hours the page shows', () => {
    const html = breweryPage({ ...base, hours: { Monday: '', Tuesday: '   ' } });
    expect(html).toContain('Hours not available');
    const title = html.match(/<title>(.*?)<\/title>/)![1];
    expect(title).not.toContain('hours');
  });

  it('says "Closed now" for hours-based status, never a bare "Closed"', () => {
    const html = breweryPage({ ...base, hours: { Monday: '12:00 AM - 12:01 AM', Tuesday: '12:00 AM - 12:01 AM', Wednesday: '12:00 AM - 12:01 AM', Thursday: '12:00 AM - 12:01 AM', Friday: '12:00 AM - 12:01 AM', Saturday: '12:00 AM - 12:01 AM', Sunday: '12:00 AM - 12:01 AM' } });
    expect(html).not.toMatch(/open-status status-closed"><i class="bi bi-clock-history"><\/i> Closed<\/span>/);
  });
});

describe('brewery page: title and meta describe only what the page shows', () => {
  it('lists hours, address and phone only when present', () => {
    expect(buildPageTitle(base, 'Columbiana', 'OH', ['phone'])).toBe('Birdfish Brewing Co., Columbiana OH: phone');
    expect(buildPageTitle(base, 'Columbiana', 'OH', ['hours', 'address', 'phone'])).toBe('Birdfish Brewing Co., Columbiana OH: hours, address, phone');
    expect(buildPageTitle(base, 'Columbiana', 'OH', [])).toBe('Birdfish Brewing Co., Columbiana OH');
  });

  it('drops trailing facts to stay near 60 characters', () => {
    const long = { ...base, name: 'Third Eye Brewing Company - Hamilton' };
    const t = buildPageTitle(long, 'Hamilton', 'OH', ['hours', 'address', 'phone']);
    expect(t).toBe('Third Eye Brewing Company - Hamilton, Hamilton OH: hours');
  });

  it('marks closed breweries in the title and sets noindex', () => {
    const closed = { ...base, closed_at: '2026-09-30' };
    expect(buildPageTitle(closed, 'Columbiana', 'OH', ['hours'])).toBe('Birdfish Brewing Co., Columbiana OH (closed)');
    const html = breweryPage(closed);
    expect(html).toContain('<meta name="robots" content="noindex, follow">');
    expect(html).toContain('This brewery has closed');
  });

  it('page <title> never says "reviews" when there are none', () => {
    const html = breweryPage(base, undefined, [], []);
    const title = html.match(/<title>(.*?)<\/title>/)![1];
    expect(title).toBe('Birdfish Brewing Co., Columbiana OH: phone | Brewery Trip');
    expect(title).not.toMatch(/review/i);
  });

  it('meta description uses the sourced quote when present, otherwise listing facts', () => {
    const withQuote = buildSeoDescription({ ...base, about_quote: 'Our taproom and patio are dog-friendly.', about_source_url: 'https://www.birdfishbrew.com/', about_checked_at: '2026-10-18' }, 'Columbiana', 'Ohio', 'OH', ['phone']);
    const undated = buildSeoDescription({ ...base, about_quote: 'Our taproom and patio are dog-friendly.', about_source_url: 'https://www.birdfishbrew.com/' }, 'Columbiana', 'Ohio', 'OH', ['phone']);
    expect(undated).not.toContain('dog-friendly');
    expect(withQuote).toBe('Birdfish Brewing Co., Columbiana, OH: “Our taproom and patio are dog-friendly.”');
    const noQuote = buildSeoDescription(base, 'Columbiana', 'Ohio', 'OH', ['hours', 'phone']);
    expect(noQuote).toBe('Birdfish Brewing Co. is a microbrewery in Columbiana, Ohio. Hours and phone on Brewery Trip.');
    expect(noQuote).not.toContain('Nestled');
    const html = breweryPage(base);
    expect(html).not.toContain('Discover craft beers and plan your brewery tour');
    expect(html).toContain('<meta name="description" content="Birdfish Brewing Co. is a microbrewery in Columbiana, Ohio. Phone on Brewery Trip.">');
  });

  it('JSON-LD description matches the meta description, not the generated copy', () => {
    const html = breweryPage(base);
    expect(html).toContain('"description":"Birdfish Brewing Co. is a microbrewery in Columbiana, Ohio. Phone on Brewery Trip."');
    expect(html).not.toContain(GENERATED);
  });
});

describe('owner-supplied photos', () => {
  it('renders a gallery with factual alt text and a credit line, and uses the first photo as the hero', () => {
    const html = breweryPage({ ...base, photos: [{ url: '/images/breweries/brighten/taproom-1.webp', alt: 'Taproom with pool table & paintings' }], photo_credit: 'Photo: Brewery Trip visit, Oct 17, 2026' });
    expect(html).toContain('<img src="/images/breweries/brighten/taproom-1.webp" alt="Taproom with pool table &amp; paintings"');
    expect(html).toContain('<p class="photo-credit">Photo: Brewery Trip visit, Oct 17, 2026</p>');
    expect(html).toContain("url('/images/breweries/brighten/taproom-1.webp')");
  });
  it('rejects CSS-injection and path-traversal image paths at the hero and gallery', () => {
    const inj = "/images/x');background-image:url(https://example.org/pixel);/*";
    const html = breweryPage({ ...base, photos: [{ url: inj, alt: 'x' }, { url: '/images/../other/x.webp', alt: 'y' }], image_url: inj });
    expect(html).not.toContain('example.org');
    expect(html).not.toContain('background-image:url');
    expect(html).not.toContain('brewery-photos');
    expect(safeImagePath(inj)).toBe('');
    expect(safeImagePath('/images/../other/x.webp')).toBe('');
    expect(safeImagePath('/images/a//b.webp')).toBe('');
    expect(safeImagePath('/images/breweries/brighten-brewing/taproom-1.webp')).toBe('/images/breweries/brighten-brewing/taproom-1.webp');
    expect(safeImagePath('/images/x y.webp')).toBe('');
  });

  it('ignores photos that are not same-origin /images/ paths and renders no gallery without photos', () => {
    const html = breweryPage({ ...base, photos: [{ url: 'https://evil.test/x.jpg', alt: 'x' }], image_url: 'javascript:alert(1)' });
    expect(html).not.toContain('evil.test');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('brewery-photos');
    expect(breweryPage(base)).not.toContain('brewery-photos');
  });
});

describe('helpers', () => {
  it('maps brewery types to labels and falls back to Brewery', () => {
    expect(breweryTypeLabel('micro')).toBe('Microbrewery');
    expect(breweryTypeLabel('brewpub')).toBe('Brewpub');
    expect(breweryTypeLabel('weird')).toBe('Brewery');
    expect(breweryTypeLabel(undefined)).toBe('Brewery');
  });
  it('hostOf strips www and survives junk', () => {
    expect(hostOf('https://www.ripponbrewing.com/about')).toBe('ripponbrewing.com');
    expect(hostOf('not a url')).toBe('');
    expect(hostOf('javascript:alert(1)')).toBe('');
    expect(hostOf(null)).toBe('');
  });
});

describe('location labels and hostile names (Astra review 2026-10-24)', () => {
  it('placeLabel joins only present, distinct parts', async () => {
    const { placeLabel } = await import('../../src/templates/brewery');
    expect(placeLabel('Cleveland', 'Ohio')).toBe('Cleveland, Ohio');
    expect(placeLabel(null, 'Ohio')).toBe('Ohio');
    expect(placeLabel('Ohio', 'Ohio')).toBe('Ohio');
    expect(placeLabel('', '')).toBe('');
  });
  it('titles and descriptions never say "Ohio, Ohio" or leave dangling commas', async () => {
    const { buildPageTitle, buildSeoDescription } = await import('../../src/templates/brewery');
    const b = { id: 1, name: 'X Brewing', city: '', state: 'OH', brewery_type: 'micro' } as any;
    expect(buildPageTitle(b, 'Ohio', 'OH', [])).toBe('X Brewing, OH');
    expect(buildSeoDescription(b, 'Ohio', 'Ohio', 'OH', [])).not.toMatch(/Ohio, Ohio|, \.|in \./);
    expect(buildSeoDescription({ ...b, closed_at: '2025-01-01' }, '', '', '', [])).toBe('X Brewing has closed. This page is kept for reference.');
  });
  it('a hostile brewery name is escaped in the page and in the share script', async () => {
    const { breweryPage } = await import('../../src/templates/brewery');
    const evil = '<img src=x onerror=alert(1)>\'";</script><script>alert(2)</script>';
    const html = breweryPage({ id: 9, name: evil, city: 'Cleveland', state: 'OH', region: 'northeast' } as any);
    const outsideScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    expect(outsideScripts).not.toContain('<img src=x onerror'); // inside JSON strings in scripts it is inert text
    expect(html).not.toContain('</script><script>alert(2)');   // no script breakout anywhere
  });
});

describe('hostile location fields (Astra review round 2)', () => {
  it('city, region, state and state_province never reach the HTML unescaped, with or without a city', async () => {
    const { breweryPage } = await import('../../src/templates/brewery');
    const evil = '<img src=x onerror=alert(1)>';
    for (const row of [
      { city: evil, region: evil, state: 'OH', state_province: 'Ohio' },
      { city: '', region: evil, state: evil, state_province: evil },
      { city: null, region: null, state: null, state_province: evil },
    ]) {
      const html = breweryPage({ id: 7, name: 'Safe Name', ...row } as any);
      expect(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')).not.toContain('<img src=x');
    }
  });
});
