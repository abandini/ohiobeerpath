#!/usr/bin/env node
// The monthly re-check, production run. Read docs/monthly-check.md first.
//
//   node scripts/monthly-check.mjs                 all three checks
//   node scripts/monthly-check.mjs --confirm       the confirming pass, at least 48 hours later: re-reads only the road
//                                                  stops with a GONE sighting on record
//   node scripts/monthly-check.mjs --only a,b,c    some of the checks
//   node scripts/monthly-check.mjs --init-baseline b|c --from FILE
//                                                  once, by a person: make reviewed observations the baseline
//
// It observes, keeps state and writes a report, all under ~/brewerytrip-monthly (or MONTHLY_DATA_DIR), outside the
// checkout. It publishes nothing and changes no file in the checkout. When a road stop has been GONE on two valid
// observations at least 48 hours apart it writes a proposal (a patch and its evidence) for a person to review.
// Samples, other data directories and pretended observations are not options here: see scripts/monthly-check-drill.mjs.
// Exit 0 only when every check asked for observed validly; otherwise 2. The last line of output is a one-sentence summary.
// Needs Node 23.6 or later (it loads the TypeScript libraries directly). No packages beyond the repo's own.
import { main } from './lib/monthly-run.mjs';

await main({ drill: false });
