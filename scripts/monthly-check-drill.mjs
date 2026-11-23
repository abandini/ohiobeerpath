#!/usr/bin/env node
// The monthly re-check, as a drill: for trials, samples and rehearsals. Read docs/monthly-check.md first.
//
//   node scripts/monthly-check-drill.mjs --data-dir /tmp/monthly-trial [--only a,b,c] [--sample-b N] [--sample-c N]
//   node scripts/monthly-check-drill.mjs --data-dir DIR --only a --pretend-gone us-422/130 --pretend-first-sighting 72
//
// It runs the same checks by the same rules, with three differences that keep it away from production:
//  - it must be given a data directory of its own, and refuses the production directory (and anything inside or
//    around it, and anything inside the checkout), compared as canonical paths so a symlink cannot pass;
//  - every state file it writes is stamped "drill": true, and the production run refuses to read such a file;
//  - only here can a run be a sample (--sample-b, --sample-c) or pretend (--pretend-gone makes stops read as GONE,
//    --pretend-first-sighting HOURS gives them a first sighting that long ago, to rehearse a proposal).
// Like the production run, it publishes nothing and changes no file in the checkout.
import { main } from './lib/monthly-run.mjs';

await main({ drill: true });
