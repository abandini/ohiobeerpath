#!/usr/bin/env node
// For a directory road built by the location-identity rule (addressMustMatch): asks the US Census geocoder for the
// coordinates of every listable row's printed address and writes data/roads/<slug>/geocodes.json. Every row is asked,
// including ones whose address matches the directory's, because the directory's map point can be wrong even when its
// address is right (a city-centre placeholder, for example); the build uses an exact Census match ahead of it.
//   node scripts/geocode-road-addresses.mjs i-71      then: node scripts/build-road-trip.mjs i-71
// The US Census geocoder is a public service and its results are public domain. One request per address; the request
// carries only the brewery's printed address. No match is recorded as null, and that row then stays off the list:
// nothing is guessed, and no other geocoder is used. Results already on file for the same address are kept, not re-asked.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('usage: node scripts/geocode-road-addresses.mjs <slug>'); process.exit(2); }
const dir = join(root, 'data/roads', slug);
const read = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
const candidates = new Map(read('candidates.json').map((c) => [c.id, c]));
// The rows as they will be built: rulings and corrections applied, so the address geocoded is the one that is shown.
const { applyRowEdits } = await import(join(root, 'src/lib/road-trip.ts'));
const rows = applyRowEdits(readdirSync(dir).filter((f) => /^verified.*\.json$/.test(f)).sort().flatMap(read), existsSync(join(dir, 'decisions.json')) ? read('decisions.json') : [], existsSync(join(dir, 'corrections.json')) ? read('corrections.json') : []).rows;
const file = join(dir, 'geocodes.json');
const had = new Map((existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []).map((g) => [`${g.id}\n${g.address}`, g]));
const today = new Date().toISOString().slice(0, 10), out = [];
// What the geocoder is asked: the printed line with separators made plain. The row's own text is what is stored.
const plain = (a) => a.replace(/[•·|]|\s[-–—]\s/g, ', ').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
for (const r of rows) {
  const c = candidates.get(r.id), address = String(r.address_as_printed ?? '').trim();
  if (!c || r.status !== 'OPEN' || !r.operating_evidence || !address) continue;
  const kept = had.get(`${r.id}\n${address}`);
  if (kept) { out.push(kept); continue; }
  let rec = { id: r.id, address, lat: null, lon: null, matched: null, source: 'US Census geocoder', checked: today };
  try {
    const res = await fetch(`https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(plain(address))}&benchmark=Public_AR_Current&format=json`, { headers: { 'user-agent': 'BreweryTripBot/1.0 (+https://brewerytrip.com/about)' }, signal: AbortSignal.timeout(30000) });
    const m = res.ok ? (await res.json())?.result?.addressMatches?.[0] : null;
    if (m && Number.isFinite(m.coordinates?.y) && Number.isFinite(m.coordinates?.x)) rec = { ...rec, lat: m.coordinates.y, lon: m.coordinates.x, matched: m.matchedAddress ?? null };
    else if (!res.ok) { console.log(`error    ${r.id} ${r.name}: HTTP ${res.status} (not recorded; run again)`); continue; }
  } catch (e) { console.log(`error    ${r.id} ${r.name}: ${e?.name} (not recorded; run again)`); continue; }
  const far = rec.lat === null ? null : Math.hypot((rec.lat - c.latitude) * 69.1, (rec.lon - c.longitude) * 69.1 * Math.cos(rec.lat * Math.PI / 180));
  console.log(`${rec.lat === null ? 'NO MATCH' : 'matched '} ${r.id} ${r.name} | ${address}${rec.lat === null ? '' : ` -> ${rec.matched} (${far.toFixed(2)} mi from the directory's point)`}`);
  out.push(rec);
}
out.sort((a, b) => String(a.id).localeCompare(String(b.id), 'en', { numeric: true }));
writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
console.log(`${out.length} addresses on file, ${out.filter((g) => g.lat === null).length} with no Census match`);
