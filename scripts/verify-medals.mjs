#!/usr/bin/env node
// Re-checks every medal in src/data/medals.ts against the official winners list it cites (one request per list, honest
// user agent). The data file is imported, not pattern-matched, so no record can be skipped: a medal from a competition
// this script has no parser for fails. An unreadable list is "unread". Exit 2 on any failure, unread list or empty data.
// Usage: node scripts/verify-medals.mjs   (Node 23.6 or later, which runs the TypeScript data file directly)
import { BREWERY_MEDALS } from '../src/data/medals.ts';
import { parseCupResults, hasMedal } from './lib/cup-results.mjs';

const PARSERS = { 'www.ohiocraftbrewerscup.com': parseCupResults };
const rows = Object.entries(BREWERY_MEDALS).flatMap(([id, sets]) => sets.flatMap((set) => set.medals.map((m) => ({ id, competition: set.competition, ...m }))));
const pages = new Map(); let bad = 0, unread = 0;
for (const r of rows) {
  const parse = PARSERS[new URL(r.url).hostname];
  if (!parse) { bad++; console.log(`NO PARSER ${r.year} ${r.medal} ${r.printed} | ${r.url}`); continue; }
  if (!pages.has(r.url)) {
    try { const res = await fetch(r.url, { headers: { 'user-agent': 'BreweryTripBot/1.0 (+https://brewerytrip.com/about) medal source check' }, signal: AbortSignal.timeout(20000) });
      pages.set(r.url, res.ok ? parse(await res.text()) : `HTTP ${res.status}`); }
    catch (e) { pages.set(r.url, `ERROR ${e?.name}`); }
  }
  const recs = pages.get(r.url);
  if (typeof recs === 'string') { unread++; console.log(`unread  ${r.year} ${r.medal} ${r.printed} | ${r.url} (${recs})`); continue; }
  const ok = hasMedal(recs, r);
  if (!ok) bad++;
  console.log(`${ok ? 'ok     ' : 'MISSING'} brewery ${r.id}: ${r.year} ${r.medal} ${r.printed} [${r.category}] | ${r.url}`);
}
console.log(`${rows.length - bad - unread}/${rows.length} confirmed, ${bad} failed, ${unread} unreadable`);
process.exit(bad || unread || rows.length === 0 ? 2 : 0);
