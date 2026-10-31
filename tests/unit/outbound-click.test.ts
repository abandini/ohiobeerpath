/**
 * Outbound-click tracking: the layout ships an inline listener that sends GA4 "outbound_click"
 * (same event and parameters as the domain-hub Worker sites) for links that leave brewerytrip.com.
 */
import { describe, it, expect } from 'vitest';
import { runInNewContext } from 'node:vm';
import { layout, OUTBOUND_CLICK_JS } from '../../src/templates/layout';

// Runs the inline script against a fake page on `pageUrl`, clicks a link to `href`, returns the gtag calls.
function click(href: string, pageUrl = 'https://brewerytrip.com/brewery/1', withGtag = true) {
  const calls: unknown[][] = [];
  let handler: ((e: unknown) => void) | undefined;
  let installs = 0;
  const loc = new URL(pageUrl);
  const win: Record<string, unknown> = {};
  if (withGtag) win.gtag = (...args: unknown[]) => calls.push(args);
  const ctx = {
    window: win, location: loc, URL,
    document: { addEventListener: (type: string, fn: (e: unknown) => void, capture: boolean) => { if (type === 'click' && capture) { handler = fn; installs++; } } },
    gtag: (...args: unknown[]) => (win.gtag as (...a: unknown[]) => void)(...args),
  };
  const code = OUTBOUND_CLICK_JS.replace(/^<script>/, '').replace(/<\/script>$/, '');
  runInNewContext(code, ctx);
  runInNewContext(code, ctx); // a second copy on the page must not add a second listener
  const a = { href: new URL(href, pageUrl).href, closest: (sel: string) => (sel === 'a[href]' ? a : null) };
  handler?.({ target: { closest: (sel: string) => (sel === 'a[href]' ? a : null) } });
  return { calls, installs };
}

describe('outbound click tracking', () => {
  it('is in every layout page, right after the GA4 config, and loads no new script', () => {
    const html = layout('Test', '<p>x</p>');
    expect(html).toContain('gtag("config","G-05G0EVSWWR");</script>' + OUTBOUND_CLICK_JS);
    expect(OUTBOUND_CLICK_JS).not.toMatch(/src=/);
  });

  it('sends outbound_click with the domain-hub parameters for a same-owner site', () => {
    const { calls, installs } = click('https://www.happygotchadays.com/faq?utm_source=brewerytrip#dogs');
    expect(installs).toBe(1);
    expect(calls).toEqual([['event', 'outbound_click', {
      link_domain: 'www.happygotchadays.com',
      link_url: 'https://www.happygotchadays.com/faq',
      outbound: true,
      transport_type: 'beacon',
    }]]);
  });

  it('counts a brewery website link and cuts link_url to 100 characters', () => {
    const { calls } = click('https://www.1056brew.com/' + 'a'.repeat(200));
    expect(calls).toHaveLength(1);
    const p = calls[0][2] as { link_url: string; link_domain: string };
    expect(p.link_domain).toBe('www.1056brew.com');
    expect(p.link_url).toHaveLength(100);
  });

  it('counts ohiobrewpath.com from brewerytrip.com (different site)', () => {
    expect(click('https://ohiobrewpath.com/').calls).toHaveLength(1);
  });

  it('ignores internal links: same host, www, and state subdomains', () => {
    expect(click('/breweries').calls).toHaveLength(0);
    expect(click('https://www.brewerytrip.com/plan').calls).toHaveLength(0);
    expect(click('https://ohio.brewerytrip.com/').calls).toHaveLength(0);
    expect(click('https://brewerytrip.com/', 'https://ohio.brewerytrip.com/').calls).toHaveLength(0);
  });

  it('ignores non-web links and does nothing when gtag is missing', () => {
    expect(click('mailto:hi@example.com').calls).toHaveLength(0);
    expect(click('tel:+15555550100').calls).toHaveLength(0);
    expect(click('https://example.com/', undefined, false).calls).toHaveLength(0);
  });
});
