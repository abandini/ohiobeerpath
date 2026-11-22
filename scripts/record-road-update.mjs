#!/usr/bin/env node
// Records one dated update to a road page that is already public, once.
//
//   node scripts/record-road-update.mjs us-422 2026-11-22 "We revised how ..." [data/roads/us-422/listed-before-2026-11-22.json]
//
// It compares the list as it was with the list in src/data/roads/<slug>.built.ts as it is NOW, and appends the result
// (before, after, who left and why, who joined, what was re-measured) to src/data/roads/<slug>.updates.ts. The page
// renders its dated notice and entry from that record alone. The list "as it was" is the file named last, or, when a
// previous update is on record, that update's "after" list.
// While an update is still being prepared (not yet published) it may be recorded again with --replace; once the page
// carrying it is public, it is history: record a new dated update instead. Build the road first.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2).filter((a) => a !== '--replace'), replace = process.argv.includes('--replace');
const [slug, date, what, beforeFile] = args;
if (!slug || !/^[a-z0-9-]+$/.test(slug) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !what) { console.error('usage: node scripts/record-road-update.mjs <slug> <YYYY-MM-DD> "<what changed, one sentence>" [before.json] [--replace]'); process.exit(2); }
const { makeUpdateEvent } = await import(join(root, 'src/lib/road-trip.ts'));
const built = Object.values(await import(join(root, `src/data/roads/${slug}.built.ts`))).find((v) => v && Array.isArray(v.stops));
const out = join(root, `src/data/roads/${slug}.updates.ts`), name = slug.toUpperCase().replace(/-/g, '_') + '_UPDATES';
let events = existsSync(out) ? Object.values(await import(out)).find(Array.isArray) : [];
if (events.some((e) => e.date === date)) {
  if (!replace) { console.error(`an update dated ${date} is already on record for ${slug}. A recorded update is not rewritten: record a new dated one, or pass --replace only if this one has never been published.`); process.exit(2); }
  events = events.filter((e) => e.date !== date);
}
if (events.some((e) => e.date > date)) { console.error('a later update is already on record'); process.exit(2); }
const before = beforeFile ? JSON.parse(readFileSync(join(root, beforeFile), 'utf8')) : events.at(-1)?.after;
if (!Array.isArray(before)) { console.error('no list to compare with: name a before.json'); process.exit(2); }
const event = makeUpdateEvent(date, what, before, built.stops, built.notListed ?? []);
events = [...events, event];
writeFileSync(out, `// RECORDS, written once each by scripts/record-road-update.mjs. Each entry is a completed, dated update to a page that
// was already public: the list before and after, why each stop left or joined, and what was re-measured. The page
// renders its dated notice and entry from these alone. Do not edit an entry and do not regenerate one that has been
// published: a later change to the page gets a new dated entry.
import type { UpdateEvent } from '../../lib/road-trip';

export const ${name}: UpdateEvent[] = ${JSON.stringify(events, null, 1)};
`);
console.log(`recorded ${date} for ${slug}: ${event.before.length} to ${event.after.length} stops; ${event.removed.length} removed, ${event.added.length} added, ${event.measured.length} re-measured materially, ${event.slight} slightly, ${event.towns.length} town labels`);
