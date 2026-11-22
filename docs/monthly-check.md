# The monthly re-check

One command re-observes what the site claims and reports what changed:

```bash
node scripts/monthly-check.mjs            # all three checks
node scripts/monthly-check.mjs --confirm  # the confirming pass, at least 48 hours later
```

It runs unattended on the 1st of each month at 04:20 and again, as the confirming pass, on the 4th at 04:20
(`scripts/ops/monthly-check.sh`, started by `scripts/ops/com.brewerytrip.monthly-check.plist`). It can be run by hand
on any machine with Node 23.6 or later and this repository's `npm ci` done. It installs nothing.

The rule behind every choice in it: **valid data is required.** A failed observation is never a pass.

## What it checks

**A. Road stops.** For every published road (`/roads/<slug>`), each listed stop's cited pages are read again: the
page its operating evidence was read from, and the page its address was read from. Each stop is one of:

- **CONFIRMED**: the evidence text, and the address when the stop shows one, were found again.
- **GONE**: the cited page loaded normally (HTTP 200, with real content) and the evidence text is no longer on it;
  or the site's domain no longer exists; or its address now shows a parked or for-sale page.
- **COULD NOT OBSERVE**: anything else. A timeout, a 403, 404, 429 or 5xx, a challenge page, a page with almost no
  text (script-rendered), a stop whose page a person had to read in a browser, an address that is no longer on its
  page while the evidence still is. Nothing is concluded about these; they are listed for a person.

**B. Directory status.** Every open listing (`closed_at IS NULL`) is asked about through Gemini with Google Maps
grounding: OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY or NOT_FOUND. The answers are compared with the last
good status of each listing and only the changes are reported. **This is an internal lead.** Its detail (names,
answers, the last good statuses) is written only under `data/monthly/internal/`, which git ignores. The committed
report carries counts only. It is never shown or cited on the site.

**C. Website links.** Every open listing's `website_url` is fetched: does the domain resolve, is the page dead,
parked, taken over by gambling or adult content, or redirected to another site that does not name the brewery? New
problems against the last good observation are reported.

## The validity rules

1. **A failed observation is never a pass and never overwrites last-good state.** State is in
   `data/monthly/state/roads.json` (per stop: the day it was last re-confirmed, and any first sighting of GONE) and
   `data/monthly/state/links.json`; check B's state is `data/monthly/internal/directory-state.json`. A stop, listing
   or link that could not be observed keeps its old entry and date. A check that did not observe validly writes no
   state at all, and the run exits 2.
2. **Sanity floors.** If more than 15% of the stops on a road come back GONE in one run, the run for that road is
   treated as broken (network, an API change, our parser) and nothing is concluded. The same for the directory: more
   than 15% of listings newly closed against their last good status (on a first run: more than 15% closed), or more
   than 15% of answers that cannot be read. For links: more than 15% newly turned into problems, or more than 30%
   unobservable. A check also fails when our own site and a known-good name cannot be reached at the start or the
   end of it (a domain is only called non-existent while known-good names still resolve).
3. **It only reads.** It never retires a listing, never adds a stop, never edits an address, hours or a quote, and
   never writes to the D1 database (one `SELECT` is the only statement it sends).
4. **The only automatic change to the public site is suspending a road stop, on a repeated valid observation.** The
   stop must be GONE on one run and GONE again on a reading at least 48 hours later (first sighting on the 1st,
   confirming pass on the 4th; the state file records the first sighting). Then:
   - the stop is added to `data/roads/<road>/suspended.json` with the date and the reason in plain words;
   - the build leaves it off, and the page counts it under its own heading ("N suspended after a monthly re-check,
     pending review"), never as closed;
   - a dated update entry is recorded with `scripts/record-road-update.mjs`, so the page says what changed;
   - a stop on two roads is suspended on both from the one record, and the cross-road gate must still pass.
5. **Before anything is pushed** the job runs every road's build with `--check`, `tsc`, `vitest` and every road's
   source verifier. Any failure: no commit, no push, and the report says which check failed.
6. **Shown dates do not change.** A CONFIRMED stop gets its "last re-confirmed" date in the state file only. The
   "hours read on DATE" shown on a page is never touched by this job.
7. **Honest requests.** User agent `BreweryTripBot/1.0 (+https://brewerytrip.com/about)`, one request at a time per
   site, at most one retry, and a refusal is taken as a refusal.

## What it writes

- `data/monthly/reports/<date>.md` (`<date>-confirm.md` for the confirming pass): per check a status line, counts,
  the lists a person must act on, and the "could not observe" lists kept apart. For check B: counts only.
- `data/monthly/internal/<date>-directory.md` and `.jsonl`: the check B detail. Not committed. Internal.
- `data/monthly/proposed/<date>-suspension.patch`: a suspension that was not published (see below). Not committed.
- The last line of output is a one-sentence summary under 300 characters with counts only, fit for a text message.
- Exit code 0 only when every check observed validly; otherwise 2.

## Publishing: off by default

A suspension is pushed only when **all** of these hold: `MONTHLY_AUTOPUBLISH=1` is set, every pre-publish check
passed, the checkout is on `main`, and it is level with `origin/main`. Then one commit is made (the suspension, the
rebuilt pages, the update entry, the state and the report) and pushed to `origin main`; CI deploys it.

Without `MONTHLY_AUTOPUBLISH=1` the job writes the report and the proposed change as a patch under
`data/monthly/proposed/`, puts every file back as it was, and stops. A person can then review and apply it:

```bash
git apply data/monthly/proposed/<date>-suspension.patch
node scripts/build-road-trip.mjs <road> --check    # for every road
npx tsc --noEmit && npx vitest run
```

To turn publishing **on** for the scheduled job: add `MONTHLY_AUTOPUBLISH` = `1` under `EnvironmentVariables` in the
installed plist and reload it. To turn it **off**: remove that key and reload. By hand:
`MONTHLY_AUTOPUBLISH=1 node scripts/monthly-check.mjs --confirm`.

## Undoing a suspension

A suspension is a record, not a deletion. To put a stop back:

1. Remove its entry from `data/roads/<road>/suspended.json` on **every** road that has it (delete the file if it is
   then empty: `[]` also works).
2. Rebuild each of those roads, then check all of them: `node scripts/build-road-trip.mjs <road>` and
   `node scripts/build-road-trip.mjs <road> --check`.
3. Record the change so the page says so:
   `node scripts/record-road-update.mjs <road> <YYYY-MM-DD> "We re-read the page and its visiting hours are shown again." <before.json>`
   where `<before.json>` is the list as it stood (see `data/roads/<road>/listed-before-*.json` for the form).
4. If the page really changed (new hours, a new address), fix the checker's row or add a correction first, and run
   `node scripts/verify-road-sources.mjs <road>`.
5. Remove the stop's `goneFirst` and `goneConfirmed` from `data/monthly/state/roads.json`.

To undo a published suspension outright: `git revert <the suspension commit>` and push.

## Running by hand

```bash
node scripts/monthly-check.mjs --only a                          # roads only
node scripts/monthly-check.mjs --only c --sample-c 60            # a spread of 60 links
node scripts/monthly-check.mjs --only b --sample-b 25            # a spread of 25 listings
node scripts/monthly-check.mjs --data-dir /tmp/monthly-trial     # keep a trial's state and reports out of the repo
```

- `--data-dir DIR` puts state, reports and internal files somewhere else. Use it for trials, so that a sample run
  does not become the baseline.
- `--accept-baseline`: a first directory or link run that trips its floor (there is nothing to compare with yet)
  can be accepted by a person after reading the report. It has no effect once a baseline exists.
- `--listings-file FILE`: use a saved copy of the directory read instead of asking D1.
- A rehearsal of the suspension path: with a `--data-dir` of its own and autopublish off,
  `MONTHLY_DRILL_GONE="us-422/130"` makes that stop read as GONE. The report is marked DRILL. A drill cannot touch the
  real state or publish.

## What the machine needs (for whoever installs it)

- Node 23.6 or later, `git`, and this repository with `npm ci` done, at the path in the plist.
- For checks B and C: `npx wrangler` able to read the D1 database (a Cloudflare API token in the job's environment,
  or a logged-in wrangler). Without it, B and C report "could not read the directory" and exit 2.
- For check B: a key for the status service, read inside the program and never printed: `GEMINI_API_KEY` in the
  environment, else the macOS Keychain item `gemini-veo`. Each is tried with one small request and the first that is
  accepted is used. If none is, check B is "could not observe"; it is never a pass. A run is capped at 2,000
  requests (the free allowance is 5,000 a month; a full run is about 1,150) and will not start if the directory
  would need more. Requests to the status service go four at a time (about 15 seconds an answer, so a full run takes
  a little over an hour); requests to brewery sites go one at a time per site.
- For publishing: push access to `origin main` from that checkout. Not needed while autopublish is off.

## Things to know

- The first run of B and C is the baseline. B reports no changes on it. C lists every problem it finds as new.
- The first full run of B is likely to trip its floor: in a 25-listing trial on 2026-11-22, 4 came back closed (16%),
  because the directory still holds listings the status service calls closed. Read the internal report, then accept
  the baseline once with `--accept-baseline`. From then on the floor measures change, not level.
- State and reports are plain files in the checkout. They are committed only as part of a published suspension;
  otherwise they stay as local changes on the machine that runs the job.
- A stop seen GONE once is listed in the report straight away. A person can act on it before the confirming pass.
- The source verifier fails while any listed stop's evidence is missing. So a suspension cannot be published while
  another stop on any road is in its first GONE sighting: the report will say which check failed.
- Tests that name a particular stop will fail the pre-publish checks if that very stop is suspended. That blocks the
  push, which is the safe direction; a person then applies the proposed patch and updates the test.
