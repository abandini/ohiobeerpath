#!/usr/bin/env node
// Re-checks every quote in src/data/beer-of-the-month.ts against its live source (honest user agent, one request per
// URL). Exit 0 when all are found; exit 2 with the missing ones listed otherwise. Unreadable pages never pass.
// It matches against the page's HTML text (tags removed), not rendered visibility.
const { BEER_OF_THE_MONTH: B } = await import('../src/data/beer-of-the-month.ts');
const pairs = [...B.tradition, ...B.pours.flatMap((p) => [p.identity, p.about, p.when].filter(Boolean)), ...B.events.flatMap((e) => [e.source, e.dateSource])];
const SOCIAL = /facebook|reddit|nextdoor|instagram|untappd|beeradvocate|twitter\.com|(^|\.)x\.com/i;
const bare = (u) => new URL(u).hostname.replace(/^www\./, '');
if (!pairs.length || pairs.some((p) => !p?.quote || !p?.url)) { console.error('bad source list'); process.exit(2); }
const norm = (s) => s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>|<[^>]+>/gi, ' ')
  .replace(/&#8217;|&rsquo;|&#x2019;/g, '’').replace(/&#039;|&#39;|&#x27;|&apos;/g, "'").replace(/&quot;|&#34;|&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
  .replace(/&amp;|&#038;/g, '&').replace(/&#8211;|&ndash;|&#x2013;/g, '–').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
const fold = (s) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ');
const cache = new Map(); let bad = 0;
for (const { quote, url } of pairs) {
  if (!cache.has(url)) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'brewerytrip.com source check (bill.burkey@ememetics.com)' }, signal: AbortSignal.timeout(30000) });
      // A redirect to another host (or to a social site) never passes: the quote must be on the page we cite.
      if (bare(r.url) !== bare(url) || SOCIAL.test(bare(r.url))) cache.set(url, `ERROR redirected to ${bare(r.url)}`);
      else cache.set(url, r.ok ? fold(norm(await r.text())) : `HTTP ${r.status}`);
    } catch (e) { cache.set(url, `ERROR ${e?.name}`); }
  }
  const t = cache.get(url), ok = t.includes(fold(quote));
  if (!ok) bad++;
  console.log(`${ok ? 'ok     ' : /^(HTTP|ERROR)/.test(t) ? 'unread ' : 'MISSING'} ${quote.slice(0, 60)} | ${url}`);
}
console.log(`${pairs.length - bad}/${pairs.length} quotes found (matched in the page's HTML text with tags, scripts and styles removed, so the <title> counts; entities decoded, curly quotes and runs of whitespace folded; other punctuation must match exactly)`);
process.exit(bad ? 2 : 0);
