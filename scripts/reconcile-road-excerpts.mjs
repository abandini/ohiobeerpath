#!/usr/bin/env node
// For a road built from the regional checkers' files: re-reads every cited page and writes
// data/roads/<slug>/corrections.json, so that what the page shows is word for word what the source prints.
//   node scripts/reconcile-road-excerpts.mjs route-66      then: node scripts/build-road-trip.mjs route-66
// The checkers sometimes tidied what they copied (added commas to an address, skipped a phone number or a
// "Get directions" link in the middle of the hours). This script never invents text: a correction is always a piece
// copied from the live page (see asPrinted in src/lib/road-trip.ts), or null when the page does not carry the words.
// Null operating evidence takes the row off the list; a null address or quote just is not shown.
// Pages that cannot be read are left alone (the verifier reports them as unread). Honest user agent, one request per URL.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('usage: node scripts/reconcile-road-excerpts.mjs <slug>'); process.exit(2); }
const { normaliseCheckerFiles, pageText, asPrinted, hoursOnly } = await import(join(root, 'src/lib/road-trip.ts'));
const dir = join(root, 'data/roads', slug);
const read = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
const all = readdirSync(dir).sort(), list = (re) => all.filter((f) => re.test(f));
// The rows as the checkers wrote them, with the editor's rulings applied but no earlier corrections.
const { verified } = normaliseCheckerFiles(read('candidates.json'), list(/^verified_.*\.json$/).flatMap(read), list(/^leads_.*\.json$/).flatMap(read), existsSync(join(dir, 'decisions.json')) ? read('decisions.json') : []);
const today = new Date().toISOString().slice(0, 10);
const pages = new Map(), out = [];
const linksOf = new Map();
const page = async (url) => {
  if (!pages.has(url)) {
    try { const r = await fetch(url, { headers: { 'user-agent': 'BreweryTripBot/1.0 (+https://brewerytrip.com/about)', accept: 'text/html,*/*;q=0.5' }, signal: AbortSignal.timeout(30000) });
      const html = r.ok && /html|text/i.test(r.headers.get('content-type') || '') ? await r.text() : '';
      const text = pageText(html);
      pages.set(url, text.length >= 200 ? text : null);
      // The same site's own visit, hours, location and contact pages, in case the checker cited the wrong one of them.
      const base = new URL(r.url || url), host = (h) => h.replace(/^www\./, '');
      linksOf.set(url, [...new Set([...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)].map((m) => { try { return new URL(m[1], base).href; } catch { return ''; } })
        .filter((h) => h && host(new URL(h).hostname) === host(base.hostname) && /locat|visit|hour|contact|taproom|find-us/i.test(new URL(h).pathname)))].slice(0, 6));
    } catch { pages.set(url, null); }
  }
  return pages.get(url);
};
// An excerpt with words left out (" ... ") is checked part by part, in order, and left as the checker wrote it.
const elided = (q) => /\.\.\.|…/.test(q);
const inOrder = (text, q) => { let at = 0; for (const part of pageText(q).split(/\s*(?:\.\.\.|…)\s*/).filter(Boolean)) { const i = text.indexOf(part, at); if (i < 0) return false; at = i + part.length; } return true; };
for (const row of verified) {
  if (row.status !== 'OPEN' || !row.operating_evidence) continue;
  const fields = [['evidence', row.operating_evidence.excerpt, row.operating_evidence.url, true], ['address', row.address_as_printed, row.address_source_url, false], ['quote', row.quote, row.quote_source_url, false]];
  for (const [field, value, url, needHours] of fields) {
    if (!value || !/^https?:\/\//.test(url || '')) continue;
    const text = await page(url);
    if (text === null) { console.log(`unread   ${row.id} ${field} | ${url}`); continue; }
    const want = pageText(String(value));
    // Hours evidence is cut back to the hours (no phone number, copyright line or stray next word after the last time).
    const tidy = (t) => (field === 'evidence' && row.evidence_kind !== 'notice' && !elided(t) ? hoursOnly(t) : t);
    if (text.includes(want) || (elided(want) && inOrder(text, want))) {
      // Hours evidence that stops before the hours (a name, an address, a phone number): carry on along the page to
      // the end of the hours that follow it there.
      let short = tidy(want);
      if (field === 'evidence' && row.evidence_kind !== 'notice' && !elided(want) && short === want && !/\d\s*(?::\d\d)?\s*[ap]\.?m|\bnoon\b/i.test(want)) {
        const at = text.indexOf(want), longer = hoursOnly(text.slice(at, at + want.length + 240));
        if (longer.length > want.length && longer.length < want.length + 240) short = longer;
      }
      if (short !== want && text.includes(short)) { out.push({ key: row.id, field, value: short, reason: `${short.length > want.length ? 'carried on to the hours' : 'cut back to the hours'}, as the page prints them, re-read ${today}` }); console.log(`trimmed  ${row.id} ${field}\n    was: ${want.slice(0, 150)}\n    now: ${short.slice(0, 150)}`); }
      continue;
    }
    // Words left out and not found in order: fall back to the first part that the page prints and that shows hours.
    const tries = elided(want) ? want.split(/\s*(?:\.\.\.|…)\s*/).filter(Boolean) : [want];
    let printed = null, at = url;
    for (const t of tries) { printed = asPrinted(t, text, needHours, field === 'address'); if (printed) break; }
    if (!printed && field === 'evidence') {
      for (const other of linksOf.get(url) || []) {
        const t2 = await page(other); if (!t2) continue;
        for (const t of tries) { printed = asPrinted(t, t2, true); if (printed) break; }
        if (printed) { at = other; break; }
      }
    }
    if (printed) { const short = tidy(printed); if (short !== printed && (pages.get(at) || '').includes(short)) printed = short; }
    out.push({ key: row.id, field, value: printed, ...(at !== url ? { url: at } : {}), reason: printed ? `as the page prints it, re-read ${today} (the checker's copy differed${at !== url ? ', and the words are on this page of the same site, not the one cited' : ''})` : `not found on the page when re-read ${today}` });
    console.log(`${printed ? 'reworded' : 'DROPPED '} ${row.id} ${field}${at !== url ? ` (found on ${at})` : ''}\n    was: ${want.slice(0, 150)}\n    now: ${printed ? printed.slice(0, 150) : '(nothing)'}`);
  }
}
out.sort((a, b) => a.key.localeCompare(b.key) || a.field.localeCompare(b.field));
writeFileSync(join(dir, 'corrections.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`${out.length} corrections written (${out.filter((c) => c.value === null && c.field === 'evidence').length} rows lose their operating evidence); ${pages.size} pages requested`);
