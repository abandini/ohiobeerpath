#!/usr/bin/env node
// Re-checks every excerpt on a single-road trip page against the page it cites: each stop's operating evidence (why it
// is listed as open), its descriptive quote if it has one, its printed address, and the quotes behind what we say
// about the road. One request per URL, honest user agent.
//   node scripts/verify-road-sources.mjs us-422
// "ok" means the text was found on the live page ("ok-meta": only in the page's description tag). "MISSING" means the page was read and the text is not there.
// "unread" means the page could not be read (an error, a refusal, or a page that only renders in a browser); it is
// never counted as a pass, with one recorded exception: a row whose browser_checked date says a person read the rendered
// page is listed as "browser-checked DATE" in its own count. Exit 0 only when nothing is missing and every source this
// script could not read has a browser check no older than 45 days; otherwise exit 2.
// The data files are imported, not pattern-matched, so no stop can be skipped. Needs Node 23.6 or later.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('usage: node scripts/verify-road-sources.mjs <slug>'); process.exit(2); }
const { stopProblems, excerptFound, unreadVerdict, verifierExit, pageText, BROWSER_CHECK_MAX_DAYS } = await import(join(root, 'src/lib/road-trip.ts'));
const pick = (mod, test) => Object.values(mod).find((v) => v && typeof v === 'object' && v.slug === slug && test(v));
const config = pick(await import(join(root, `src/data/roads/${slug}.ts`)), (v) => Array.isArray(v.roadSources));
const built = pick(await import(join(root, `src/data/roads/${slug}.built.ts`)), (v) => Array.isArray(v.stops));
if (!config || !built) { console.error(`road ${slug}: config or built data not found`); process.exit(2); }

// The same road-aware check the builder and the page use (directory id on a directory road; address and own-site link
// on a road of stand-alone stops).
const stops = built.stops.filter((s) => stopProblems(s, config).length === 0);
if (stops.length !== built.stops.length) { for (const s of built.stops) { const w = stopProblems(s, config); if (w.length) console.error(`${s.key}: ${w.join('; ')}`); } console.error(`${built.stops.length - stops.length} stop(s) in the built file fail validation: rebuild before verifying`); process.exit(2); }
// Notes on legs and stretches (alcohol law on tribal land, for example) rest on quoted sources too; the same source
// used in two notes is checked once.
const noteSources = [...new Map(config.legs.flatMap((l) => [...(l.notes ?? []), ...(l.segments ?? []).flatMap((g) => g.notes ?? [])]).flatMap((n) => n.sources ?? []).map((q) => [`${q.url}\n${q.quote}`, q])).values()];
const pairs = [
  ...config.roadSources.map((s) => ({ what: 'road', quote: s.quote, url: s.url })),
  ...noteSources.map((s) => ({ what: 'note', quote: s.quote, url: s.url })),
  ...stops.flatMap((s) => [
    { what: `stop ${s.key} operating evidence`, quote: s.evidence, url: s.evidenceUrl, browser: s.browserChecked, ...(s.evidenceVia === 'google-maps' ? { maps: s.evidenceChecked } : {}) },
    ...(s.quote ? [{ what: `stop ${s.key} quote`, quote: s.quote, url: s.quoteSourceUrl, browser: s.browserChecked }] : []),
    ...(s.address ? [{ what: `stop ${s.key} address`, quote: s.address, url: s.addressSourceUrl, browser: s.browserChecked }] : []),
    // a note that the brewery's own pages disagree quotes each claim: each must be on the page it names
    ...(s.conflict?.sources ?? []).map((q) => ({ what: `stop ${s.key} conflict note`, quote: q.quote, url: q.url, browser: s.browserChecked })),
  ]),
];
const expected = config.roadSources.length + noteSources.length + stops.length + stops.filter((s) => s.quote).length + stops.filter((s) => s.address).length + stops.reduce((n, s) => n + (s.conflict?.sources?.length ?? 0), 0);
if (!pairs.length || pairs.length !== expected || pairs.some((p) => !String(p.quote || '').replace(/\.\.\.|…/g, '').trim() || !/^https?:\/\//.test(p.url || ''))) { console.error(`expected ${expected} sources with a quote and a URL, got ${pairs.length}`); process.exit(2); }

// Page text as a reader sees it (tags dropped, entities decoded, whitespace collapsed): the same function the
// reconcile step uses, so both read a page the same way.
const norm = pageText;

// An excerpt may leave words out (" ... "): every part must be on the page, in order. An empty excerpt is never found.
const found = excerptFound;
const pages = new Map(); let ok = 0, missing = 0, unread = 0, browser = 0, stale = 0, maps = 0;
// --as-of YYYY-MM-DD: judge browser checks and Google Maps citations as they will stand on a LATER day, to see what
// is about to expire. An earlier day is refused: this option can only make the check stricter, never looser.
const realToday = new Date().toISOString().slice(0, 10), asOfAt = process.argv.indexOf('--as-of'), asOf = asOfAt > 0 ? process.argv[asOfAt + 1] : '';
if (asOfAt > 0 && (!/^\d{4}-\d{2}-\d{2}$/.test(asOf || '') || asOf < realToday)) { console.error('--as-of takes a date that is today or later'); process.exit(2); }
const today = asOf || realToday;
// A source the script cannot read may carry the date a person read it in a browser (browser_checked in the checker's
// row). It is reported and counted separately, never as found by this script, and only for BROWSER_CHECK_MAX_DAYS days.
const notRead = (p, show, why) => {
  const v = unreadVerdict(p.browser, today);
  if (v === 'browser-checked') { browser++; console.log(`browser-checked ${p.browser}  ${show} (${why})`); }
  else if (v === 'browser-check-stale') { stale++; console.log(`unread  ${show} (${why}; browser check of ${p.browser} is older than ${BROWSER_CHECK_MAX_DAYS} days)`); }
  else { unread++; console.log(`unread  ${show} (${why})`); }
};
for (const p of pairs) {
  // Hours cited to Google Maps are not re-read here: this script does not request Google Maps. They are counted on their
  // own, never as found, and only while the check is no older than BROWSER_CHECK_MAX_DAYS days; after that they fail.
  if (p.maps) {
    const show = `${p.what}: ${p.quote.slice(0, 70)} | ${p.url}`;
    if (unreadVerdict(p.maps, today) === 'browser-checked') { maps++; console.log(`maps-sourced ${p.maps}  ${show} (cited to Google Maps; not read by this script)`); }
    else { stale++; console.log(`unread  ${show} (cited to Google Maps on ${p.maps}, which is older than ${BROWSER_CHECK_MAX_DAYS} days or not a date)`); }
    continue;
  }
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
  if (page.error) notRead(p, show, page.error);
  else if (found(page.text, p.quote)) { ok++; console.log(`ok      ${show}`); }
  else if (found(page.meta, p.quote)) { ok++; console.log(`ok-meta ${show}`); }
  else if (page.thin) notRead(p, show, 'almost no text (needs a browser?)');
  else { missing++; console.log(`MISSING ${show}`); }
}
console.log(`${ok}/${pairs.length} found by this script, ${browser} browser-checked by a person, ${maps} cited to Google Maps, ${missing} missing, ${unread + stale} unread${stale ? ` (${stale} with a browser check that is too old)` : ''} (${pages.size} pages requested)`);
process.exit(verifierExit({ total: pairs.length, missing, unread, stale }));
