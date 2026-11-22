#!/usr/bin/env node
// Builds the stops for a single-road trip (/roads/<slug>) from the checkers' rows.
//
//   node scripts/build-road-trip.mjs us-422            write src/data/roads/us-422.built.ts
//   node scripts/build-road-trip.mjs us-422 --check    exit 2 if that file is out of date with the inputs
//
// Inputs, all under data/roads/<slug>/:
//   osm-ways.json        the road as [lat, lon] points per OpenStreetMap way (ODbL, (c) OpenStreetMap contributors)
//   candidates.json      directory rows near the road (id, name, city, state, latitude, longitude)
//   verified*.json       the checkers' rows: id, name, status, official_url, address_as_printed, address_source_url,
//                        quote, quote_source_url, notes, checked. Drop a new or updated file in and run this again.
//                        and operating_evidence { excerpt, url, checked }: a verbatim excerpt showing the place was
//                        operating (printed visiting hours, a dated notice), the page it is on, the day it was read.
// Only a row with status OPEN and operating evidence becomes a stop; every other row is listed below with the reason
// and is written nowhere else. A candidate counts as decided only when it is a stop or its row settles it (closed,
// moved, duplicate, not a taproom); UNCONFIRMED rows and OPEN rows without evidence are undecided. No network, no database: the same inputs give the same file.
// Roads that list the same brewery must agree about it: the run ends with the cross-road gate (exit 2 on a difference
// not recorded in data/roads/shared-differences.json). When shared facts change, rebuild every road.
// Needs Node 23.6 or later (it loads the TypeScript library and config directly).
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2], check = process.argv.includes('--check');
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('usage: node scripts/build-road-trip.mjs <slug> [--check]'); process.exit(2); }
const { buildRoad, normaliseCheckerFiles, applyRowEdits, shareRows, crossRoadDifferences, sharedStopIds } = await import(join(root, 'src/lib/road-trip.ts'));
const configModule = await import(join(root, `src/data/roads/${slug}.ts`));
const config = Object.values(configModule).find((v) => v && typeof v === 'object' && v.slug === slug);
if (!config) { console.error(`no road config with slug ${slug} in src/data/roads/${slug}.ts`); process.exit(2); }

const dir = join(root, 'data/roads', slug);
const read = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
const ways = read('osm-ways.json');
let candidates, verified, files, ingest = null, shared = null;
if (config.ingest === 'checker-files') {
  // A road outside the directory: candidates.json is the outside dataset the checkers started from, verified_*.json
  // their rows for it, leads_*.json the breweries they found that it lacks, and decisions.json the editor's rulings
  // (rows to leave off, with the reason). corrections.json, written by scripts/reconcile-road-excerpts.mjs, holds the
  // excerpts and addresses as the cited pages really print them. None of the checkers' files is edited.
  const all = readdirSync(dir).sort(), list = (re) => all.filter((f) => re.test(f));
  files = [...list(/^verified_.*\.json$/), ...list(/^leads_.*\.json$/)];
  ingest = normaliseCheckerFiles(read('candidates.json'), list(/^verified_.*\.json$/).flatMap(read), list(/^leads_.*\.json$/).flatMap(read), existsSync(join(dir, 'decisions.json')) ? read('decisions.json') : [], existsSync(join(dir, 'corrections.json')) ? read('corrections.json') : []);
  ({ candidates, verified } = ingest);
  if (ingest.unmatchedDecisions.length) { console.error(`decisions.json names rows that do not exist: ${ingest.unmatchedDecisions.join(', ')}`); process.exit(2); }
} else {
  candidates = read('candidates.json');
  files = readdirSync(dir).filter((f) => /^verified.*\.json$/.test(f)).sort();
  verified = files.flatMap((f) => { const rows = read(f); if (!Array.isArray(rows)) { console.error(`${f} is not a list of rows`); process.exit(2); } return rows; });
  // decisions.json (optional): an editor's or a second check's ruling on single rows, by directory id. corrections.json
  // (optional, written by scripts/reconcile-road-excerpts.mjs): excerpts and addresses as the cited pages really print
  // them. Both are kept apart from the checkers' files and applied here.
  const edits = applyRowEdits(verified, existsSync(join(dir, 'decisions.json')) ? read('decisions.json') : [], existsSync(join(dir, 'corrections.json')) ? read('corrections.json') : []);
  if (edits.unmatched.length) { console.error(`decisions.json or corrections.json names rows that do not exist: ${edits.unmatched.join(', ')}`); process.exit(2); }
  for (const d of edits.applied) console.log(`  decision  ${d.id} ${d.name}: ${d.status} (${d.reason})`);
  verified = edits.rows;
  // Shared rows: one record of a brewery that two roads check. sharedRowsFrom prefers the other road's listable row;
  // fillRowsFrom uses it only where our own check could not list the brewery. See shareRows.
  for (const [from, mode] of [[config.sharedRowsFrom, 'prefer'], [config.fillRowsFrom, 'fill']]) {
    if (!from) continue;
    const other = join(root, 'data/roads', from), readOther = (f) => JSON.parse(readFileSync(join(other, f), 'utf8')), has = (f) => existsSync(join(other, f));
    const theirs = applyRowEdits(readdirSync(other).filter((f) => /^verified.*\.json$/.test(f)).sort().flatMap(readOther), has('decisions.json') ? readOther('decisions.json') : [], has('corrections.json') ? readOther('corrections.json') : []).rows;
    shared = shareRows(verified, shared ? shared.geocodes : existsSync(join(dir, 'geocodes.json')) ? read('geocodes.json') : [], theirs, has('geocodes.json') ? readOther('geocodes.json') : [], mode, from);
    verified = shared.rows;
    if (shared.taken.length) console.log(`  ${shared.taken.length} rows taken from ${from} (${mode}): ${shared.taken.join(', ')}`);
  }
}

const out = join(root, `src/data/roads/${slug}.built.ts`);
// The build date is the newest check date in the rows, so re-running without new rows changes nothing.
const built = verified.flatMap((r) => [r?.checked, r?.operating_evidence?.checked]).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '')).sort().pop() || config.geometry.downloaded;
// geocodes.json (optional): Census coordinates for printed addresses that are not the directory's in full.
const geocodes = shared ? shared.geocodes : !ingest && existsSync(join(dir, 'geocodes.json')) ? read('geocodes.json') : [];
const { road, report } = buildRoad(config, ways, candidates, verified, built, undefined, geocodes);
if (report.geocoded.length) console.log(`  placed by Census coordinates for the printed address: ${report.geocoded.join(', ')}`);

const name = slug.toUpperCase().replace(/-/g, '_') + '_BUILT';
const body = `// GENERATED by scripts/build-road-trip.mjs from data/roads/${slug}/ (${files.join(', ') || 'no verified files yet'}). Do not edit by hand:
// change the inputs and run the script again. Each stop is a checker's row with status OPEN and operating evidence (an
// excerpt, its page and the day it was read); its mile and straight-line distance are our calculation from the OpenStreetMap line (ODbL, (c) OpenStreetMap contributors).
import type { BuiltRoad } from '../../lib/road-trip';

export const ${name}: BuiltRoad = ${JSON.stringify({ ...road, ...(ingest ? { unplaced: ingest.unplaced.filter((u) => verified.some((v) => v.id === u.key && v.status === 'OPEN' && v.operating_evidence)).length } : {}), legs: road.legs.map((l) => ({ ...l, line: '@@' + l.id })) }, null, 2)
    .replace(/"@@([a-z0-9-]+)"/g, (_, id) => JSON.stringify(road.legs.find((l) => l.id === id).line))};
`;

for (const l of report.legs) console.log(`leg ${l.id}: ${l.lengthMiles.toFixed(1)} mi, ${l.points} points, ${l.bridges} joins (${l.bridgedMiles.toFixed(3)} mi)${l.joins.filter((j) => j.miles > 0.05).map((j) => ` [${j.miles.toFixed(2)} mi at ${j.from[0].toFixed(3)},${j.from[1].toFixed(3)}]`).join('')}`);
for (const l of road.legs) console.log(`leg ${l.id}: ${l.candidates} directory candidates within the limit, ${l.decided} with a completed decision, ${road.stops.filter((s) => s.legId === l.id).length} stops, ${l.line.length} points kept for drawing`);
if (ingest) { for (const u of ingest.unplaced) console.log(`  unplaced  ${u.name} (${u.city}, ${u.state}): ${u.why}`); for (const d of ingest.applied) console.log(`  decision  ${d.name}: ${d.status} (${d.reason})`); }
for (const s of road.stops) console.log(`  stop  ${s.legId} mile ${String(s.mile).padStart(5)} +${s.detourMiles.toFixed(2)}${s.outer ? ' outer' : ''}  ${s.key} ${s.name} (${s.town})${s.pastEnd ? ' [past the ' + s.pastEnd + ']' : ''}${s.address ? '' : ' [no printed address]'}`);
for (const x of report.left) console.log(`  left  ${x.id} ${x.name}: ${x.reason}`);
for (const x of report.undecided) console.log(`  undecided  ${x.id} ${x.name}: ${x.why}`);
console.log(`${road.stops.length} stops from ${verified.length} checked rows in ${files.length} file(s); ${report.undecided.length} candidates within the limit have no completed decision`);

if (check) {
  const same = existsSync(out) && readFileSync(out, 'utf8') === body;
  console.log(same ? 'built file is up to date' : 'built file is OUT OF DATE: run without --check');
  if (!same) process.exit(2);
} else {
  writeFileSync(out, body);
  console.log(`wrote src/data/roads/${slug}.built.ts`);
}

// The cross-road gate: every brewery listed on more than one directory road must carry the same name, address, town,
// operating evidence and coordinates on each. A difference fails the build unless data/roads/shared-differences.json
// records it as intentional. The other roads are read from their built files, so when shared facts
// change, rebuild every road: the file is written first, and the run still fails until the roads agree.
{
  const others = [];
  for (const f of readdirSync(join(root, 'src/data/roads')).filter((x) => /\.built\.ts$/.test(x) && x !== `${slug}.built.ts`)) { const m = await import(join(root, 'src/data/roads', f)); const b = Object.values(m).find((v) => v && Array.isArray(v.stops)); if (b) others.push({ slug: b.slug, stops: b.stops, checkedNotListed: b.checkedNotListed }); }
  const allowedFile = join(root, 'data/roads/shared-differences.json');
  const diffs = crossRoadDifferences([...others, { slug, stops: road.stops, checkedNotListed: road.checkedNotListed }], existsSync(allowedFile) ? JSON.parse(readFileSync(allowedFile, 'utf8')).map((x) => x.allow) : []);
  console.log(`${sharedStopIds([...others, { slug, stops: road.stops }]).length} listings are on more than one road; ${diffs.length} differences between roads`);
  if (diffs.length) { for (const d of diffs) console.error(`  DIFFERS  ${d}`); console.error('The roads disagree about a shared brewery. Fix the data, rebuild the other road, or record the difference in data/roads/shared-differences.json.'); process.exit(2); }
}

