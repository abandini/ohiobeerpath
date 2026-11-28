import { describe, it, expect } from 'vitest';
import vm from 'node:vm';
import { renderRatingForm } from '../../src/templates/rating-form';

const HOSTILE = `x'</script><script>alert(1)</script>"\\`;
const page = (name: string, itineraryId?: string, signedIn = false) =>
  renderRatingForm({
    brewery: { id: 1, name, city: 'Columbus' } as any,
    user: signedIn ? ({ id: 'u1', display_name: 'T', privacy_default: 'ask', style_preference: 'simple', photo_mode: 'single' } as any) : null,
    itineraryId,
    baseUrl: 'https://brewerytrip.com'
  } as any);
const inlineScripts = (html: string) =>
  [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

describe('rating form page script', () => {
  it("parses when the brewery name has an apostrophe ('77 Brew House)", () => {
    for (const s of inlineScripts(page("'77 Brew House"))) expect(() => new vm.Script(s)).not.toThrow();
  });
  it('a name cannot close the script block or the string', () => {
    for (const signedIn of [false, true]) {
      const html = page(HOSTILE, undefined, signedIn);
      for (const s of inlineScripts(html)) expect(() => new vm.Script(s)).not.toThrow();
      expect(html).not.toContain('<script>alert(1)');
    }
  });
  it('the itinerary value from the address cannot inject markup or script', () => {
    for (const signedIn of [false, true]) {
      const html = page('Plain Brewery', HOSTILE, signedIn);
      for (const s of inlineScripts(html)) expect(() => new vm.Script(s)).not.toThrow();
      expect(html).not.toContain('<script>alert(1)');
    }
  });
});
