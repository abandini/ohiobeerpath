#!/usr/bin/env node
// Re-checks every quote in src/data/tours/downtown-cleveland.ts against its live source (honest user agent, one
// request per URL). Exit 0 when all quotes are found; exit 2 with the missing ones listed otherwise. Pages that only
// render in a browser are reported as "unreadable", never as passing.
// Imports the data module itself (Node strips TypeScript types), so no quote can be skipped by a parsing mismatch.
const { DOWNTOWN_TOUR } = await import('../src/data/tours/downtown-cleveland.ts');
const medals = DOWNTOWN_TOUR.stops.flatMap((s) => s.gabf || []);
const pairs = [...DOWNTOWN_TOUR.stops.flatMap((s) => [s.addressSource, s.noteSource]), ...DOWNTOWN_TOUR.nearby.map((n) => n.source), ...medals];
const expected = DOWNTOWN_TOUR.stops.length * 2 + DOWNTOWN_TOUR.nearby.length + medals.length;
if (!pairs.length || pairs.length !== expected || pairs.some((p) => !p?.quote || !p?.url)) { console.error(`expected ${expected} sources, got ${pairs.length}`); process.exit(2); }
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
// PDF text via poppler's pdftotext (reading order), whitespace collapsed; "ERROR no-pdftotext" when it is missing.
function pdfText(buf) {
  try { const d = mkdtempSync(`${tmpdir()}/tour-`), f = `${d}/x.pdf`; writeFileSync(f, buf); return execFileSync('pdftotext', [f, '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }).replace(/\s+/g, ' '); }
  catch { return 'ERROR no-pdftotext'; }
}
const norm = (s) => s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>|<[^>]+>/gi, ' ').replace(/&#8217;|&rsquo;/g, '’').replace(/&#039;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/&#8211;|&ndash;/g, '–').replace(/\s+/g, ' ');
const cache = new Map(); let bad = 0;
for (const { quote, url } of pairs) {
  if (!cache.has(url)) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'brewerytrip.com source check (bill.burkey@ememetics.com)' }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) cache.set(url, `HTTP ${r.status}`);
      else if (url.endsWith('.pdf')) cache.set(url, pdfText(Buffer.from(await r.arrayBuffer())));
      else cache.set(url, norm(await r.text()));
    }
    catch (e) { cache.set(url, `ERROR ${e?.name}`); }
  }
  const t = cache.get(url), ok = t.includes(quote);
  if (!ok) bad++;
  console.log(`${ok ? 'ok     ' : t.startsWith('HTTP') || t.startsWith('ERROR') ? 'unread ' : 'MISSING'} ${quote.slice(0, 60)} | ${url}`);
}
console.log(`${pairs.length - bad}/${pairs.length} quotes found`);
process.exit(bad ? 2 : 0);
