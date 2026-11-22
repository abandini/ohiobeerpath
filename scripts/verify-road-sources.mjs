#!/usr/bin/env node
// Re-checks every quote on a single-road trip page against the page it cites: each stop's quote, each stop's printed
// address, and the quotes behind what we say about the road. One request per URL, honest user agent.
//   node scripts/verify-road-sources.mjs us-422
// "ok" means the text was found on the live page ("ok-meta": only in the page's description tag). "MISSING" means the page was read and the text is not there.
// "unread" means the page could not be read (an error, a refusal, or a page that only renders in a browser); it is
// never counted as a pass. Exit 0 only when every source is ok; otherwise exit 2.
// The data files are imported, not pattern-matched, so no stop can be skipped. Needs Node 23.6 or later.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('usage: node scripts/verify-road-sources.mjs <slug>'); process.exit(2); }
const { isShowableStop } = await import(join(root, 'src/lib/road-trip.ts'));
const pick = (mod, test) => Object.values(mod).find((v) => v && typeof v === 'object' && v.slug === slug && test(v));
const config = pick(await import(join(root, `src/data/roads/${slug}.ts`)), (v) => Array.isArray(v.roadSources));
const built = pick(await import(join(root, `src/data/roads/${slug}.built.ts`)), (v) => Array.isArray(v.stops));
if (!config || !built) { console.error(`road ${slug}: config or built data not found`); process.exit(2); }

const stops = built.stops.filter(isShowableStop);
const pairs = [
  ...config.roadSources.map((s) => ({ what: 'road', quote: s.quote, url: s.url })),
  ...stops.flatMap((s) => [
    { what: `stop ${s.breweryId} quote`, quote: s.quote, url: s.quoteSourceUrl },
    ...(s.address ? [{ what: `stop ${s.breweryId} address`, quote: s.address, url: s.addressSourceUrl }] : []),
  ]),
];
const expected = config.roadSources.length + stops.length + stops.filter((s) => s.address).length;
if (!pairs.length || pairs.length !== expected || pairs.some((p) => !p.quote || !/^https?:\/\//.test(p.url || ''))) { console.error(`expected ${expected} sources with a quote and a URL, got ${pairs.length}`); process.exit(2); }

const ENT = { amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', eacute: 'é', copy: '©', reg: '®', trade: '™', deg: '°', middot: '·', bull: '•' };
// Page text as a reader sees it: tags dropped, entities decoded, runs of whitespace as one space, and no space before
// punctuation (a link ending just before a comma otherwise leaves "Cleveland , Ohio").
export const norm = (s) => s
  .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? m)
  .replace(/[ ​ ]/g, ' ').replace(/\s+/g, ' ').replace(/ ([,.;:!?])/g, '$1').trim();

const pages = new Map(); let ok = 0, missing = 0, unread = 0;
for (const p of pairs) {
  if (!pages.has(p.url)) {
    try {
      const r = await fetch(p.url, { headers: { 'user-agent': 'BreweryTripBot/1.0 (+https://brewerytrip.com/about)', accept: 'text/html,*/*;q=0.5' }, signal: AbortSignal.timeout(30000) });
      const type = r.headers.get('content-type') || '';
      if (!r.ok) pages.set(p.url, { error: `HTTP ${r.status}` });
      else if (!/html|text/i.test(type)) pages.set(p.url, { error: `not a text page (${type || 'no content type'})` });
      else {
        const html = await r.text(), text = norm(html);
        // The page's own description tags are text the site publishes, though a visitor does not see them on the page;
        // a quote found only there is reported as "ok-meta" so a person can decide whether that is good enough.
        const meta = [...html.matchAll(/<meta\b[^>]*\b(?:name|property)=["'](?:description|og:description)["'][^>]*>/gi)].map((m) => norm((m[0].match(/\bcontent=(["'])([\s\S]*?)\1/i) || [])[2] || '')).join(' \n ');
        pages.set(p.url, text.length < 200 && !meta ? { error: 'almost no text (needs a browser?)' } : { text, meta, thin: text.length < 200 });
      }
    } catch (e) { pages.set(p.url, { error: `ERROR ${e?.name || 'fetch'}` }); }
  }
  const page = pages.get(p.url), show = `${p.what}: ${p.quote.slice(0, 70)} | ${p.url}`;
  if (page.error) { unread++; console.log(`unread  ${show} (${page.error})`); }
  else if (page.text.includes(norm(p.quote))) { ok++; console.log(`ok      ${show}`); }
  else if (page.meta.includes(norm(p.quote))) { ok++; console.log(`ok-meta ${show}`); }
  else if (page.thin) { unread++; console.log(`unread  ${show} (almost no text (needs a browser?))`); }
  else { missing++; console.log(`MISSING ${show}`); }
}
console.log(`${ok}/${pairs.length} found, ${missing} missing, ${unread} unread (${pages.size} pages requested)`);
process.exit(missing || unread ? 2 : 0);
