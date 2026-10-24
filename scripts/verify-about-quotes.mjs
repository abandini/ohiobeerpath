#!/usr/bin/env node
// Re-checks every about_quote in the given migration files against its about_source_url (honest user agent, one request
// per URL). Pages that render only in a browser are reported "unreadable" (exit 2), never as passing.
// Usage: node scripts/verify-about-quotes.mjs migrations/0012_about_source_data.sql migrations/0013_brighten_richfield_data.sql migrations/0014_downtown_walk_about_data.sql migrations/0015_anthology_cask_house.sql
import { readFileSync } from 'node:fs';
const files = process.argv.slice(2);
// UPDATE … about_quote = '…', about_source_url = '…'  and  INSERT … SELECT …, '<quote>', '<url>', '<YYYY-MM-DD>' (the last three columns).
const rows = files.flatMap((f) => { const t = readFileSync(f, 'utf8'); return [
  ...[...t.matchAll(/about_quote = '((?:[^']|'')*)', about_source_url = '([^']+)'/g)].map((m) => ({ quote: m[1], url: m[2] })),
  ...[...t.matchAll(/'((?:[^']|''){20,})',\s*'(https?:\/\/[^']+)',\s*'\d{4}-\d{2}-\d{2}'\s*\n?WHERE NOT EXISTS/g)].map((m) => ({ quote: m[1], url: m[2] })),
].map((r) => ({ quote: r.quote.replace(/''/g, "'"), url: r.url, file: f })); });
const norm = (s) => s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>|<[^>]+>/gi, ' ').replace(/&#8217;|&rsquo;/g, '’').replace(/&#8216;|&lsquo;/g, '‘').replace(/&#8220;|&ldquo;/g, '“').replace(/&#8221;|&rdquo;/g, '”').replace(/&#039;|&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ');
const loose = (s) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const cache = new Map(), rawCache = new Map(); let bad = 0, unread = 0, viaData = 0;
for (const r of rows) {
  if (!cache.has(r.url)) {
    try { const res = await fetch(r.url, { headers: { 'user-agent': 'brewerytrip.com source check (bill.burkey@ememetics.com)' }, signal: AbortSignal.timeout(20000) }); if (res.ok) { const raw = await res.text(); cache.set(r.url, norm(raw)); rawCache.set(r.url, raw.replace(/\\u2019/g, '’').replace(/\\"/g, '"')); } else cache.set(r.url, `HTTP ${res.status}`); }
    catch (e) { cache.set(r.url, `ERROR ${e?.name}`); }
  }
  const t = cache.get(r.url), readable = !/^(HTTP|ERROR) /.test(t);
  // Pages that render client-side often still carry the text in embedded page data: accept it there, reported apart.
  const inText = readable && loose(t).includes(loose(r.quote)), inData = !inText && readable && loose(rawCache.get(r.url) || '').includes(loose(r.quote));
  const ok = inText || inData; if (inData) viaData++;
  if (!readable) unread++; else if (!ok) bad++;
  console.log(`${inText ? 'ok     ' : inData ? 'ok-data' : readable ? 'MISSING' : 'unread '} ${r.quote.slice(0, 60)} | ${r.url}`);
}
console.log(`${rows.length - bad - unread}/${rows.length} found (${viaData} in embedded page data), ${bad} missing, ${unread} unreadable`);
process.exit(bad || unread ? 2 : 0);
