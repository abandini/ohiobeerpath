# The monthly re-check

One command re-observes what the site claims and reports what changed:

```bash
node scripts/monthly-check.mjs            # all three checks
node scripts/monthly-check.mjs --confirm  # the confirming pass, at least 48 hours later
```

It runs unattended on the 1st of each month at 04:20 and again, as the confirming pass, on the 4th at 04:20
(`scripts/ops/monthly-check.sh`, started by `scripts/ops/com.brewerytrip.monthly-check.plist`).

**Version 1 publishes nothing.** It observes, keeps state, and writes a report. It never commits and never pushes.
When a road stop has been GONE on two valid observations at least 48 hours apart, it writes a **proposal**: a patch
that suspends the stop, with the evidence for it. A person reviews the proposal and applies it through the normal
reviewed process.

**What it does to its checkout, exactly.** The job needs a checkout of its own that nobody works in. Before a run,
the wrapper makes one change there: it fast-forwards `main` to `origin/main` (`git fetch origin main`, then
`git merge --ff-only origin/main`). The run itself never edits a file in the checkout. The wrapper stops with exit 2,
observing nothing, if the checkout is not on `main`, has any uncommitted or untracked change, cannot be fetched, or
cannot be fast-forwarded. It never falls back to observing whatever is there. The commit observed is recorded: the
report and any proposal carry its SHA, and a proposal is built from that same commit. Run without the wrapper, the
program still refuses a checkout that is not clean, and records the commit.

The rule behind every choice in it: **valid data is required.** A failed observation is never a pass.

## What it checks

**A. Road stops.** For every published road (`/roads/<slug>`), each listed stop's cited pages are read again: the
page its operating evidence was read from, and the page its address was read from. Each stop is one of:

- **CONFIRMED**: the evidence text, and the address when the stop shows one, were found again, each on a page that
  answered HTTP 200 and is not a shell (a challenge, a refusal, an error page, a consent or age gate, an outage
  notice). Matching text returned by a 404, a 500, a consent page or a challenge page confirms nothing. A shell is
  recognised by what it is, not by its length: a title that is a gate ("Age verification", "Just a moment...",
  "Access denied", "Site maintenance", "Cookie consent"), a short title that is only a notice ("Coming soon"), text
  that opens with a gate's question with little after it, or a thin page carrying a gate phrase. A cookie line on a
  real page is not a gate.
- **GONE**: one of three things.
  - The evidence is absent from a page that loaded normally with real content **and is still recognisably the page
    it was last found on**: same final host and path after redirects, a similar title, a length within half to
    double what it was, and at least one piece of the text that surrounded the evidence still there. The job keeps
    that fingerprint from each CONFIRMED reading. Without an earlier CONFIRMED reading there is nothing to compare
    with, and an absence concludes nothing.
  - DNS answers that the domain does not exist (NXDOMAIN), while known-good names still resolve. "No address on
    record" is not that claim and concludes nothing.
  - The address shows a domain seller's or parking page (positive markers only: "this domain is for sale", a
    registrar's parking page). A hosting outage, "account suspended", "coming soon" or a maintenance page is not
    parking and concludes nothing.
- **COULD NOT OBSERVE**: everything else. A timeout, a 403, 404, 429 or 5xx, a shell, a page with almost no text,
  a stop whose page a person had to read in a browser, a page that changed ("page changed; a person should look":
  a redirect elsewhere, a different title, a much shorter page, a changed layout), an address that is no longer on
  its page while the evidence still is. Nothing is concluded about these; they are listed for a person.

The words used for a GONE stop are the narrow fact: "the visiting-hours evidence we cited was not found on the cited
page". Never that the brewery closed, and never that its site shows no hours. The fetched text of every GONE reading
is kept beside the report.

**B. Directory status.** Every open listing (`closed_at IS NULL`) is asked about through Gemini with Google Maps
grounding: OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY or NOT_FOUND. A status is accepted only when the
response has the shape we expect, carries a Maps source (it is grounded), and names a place that is a reasonable
match for the listing's name. A Maps source is an `https` address, parsed, whose host and path are on a fixed list
(`maps.google.com`, `google.com/maps...`, `www.google.com/maps...`, `maps.app.goo.gl`, `goo.gl/maps...`); a Maps
address appearing inside some other address does not count. A different business at the address is recorded as
OTHER_BUSINESS_AT_ADDRESS with both names: a lead, not a status. Anything else is unobservable. Every answer that
gives no accepted status, leads included, counts toward the 15% not-accepted floor, and a run with no accepted status
at all fails. Every change between two validated statuses is reported
with both values. **This is an internal lead.** Its detail (names, answers, the name, address and source the service
returned, the last good statuses) is written only under `internal/` in the data directory. The report carries counts
only. It is never shown or cited on the site.

**C. Website links.** Every open listing's `website_url` is fetched. First, could the page be seen at all? A server
error (5xx), a refusal, a challenge, a gate or notice page, a timeout or a page too thin to judge is "could not
observe" and keeps the last good observation; that is settled before anything else is concluded. Then: DEAD (the
domain does not exist, or the page answers 404 or 410); PARKED (a domain seller's page); HIJACKED (gambling or adult
content **and** the brewery's name gone from the title and the body); OFF_DOMAIN (a redirect to another site that
does not name the brewery); MOVED (a redirect to another site whose page does); OK (the same site, naming the
brewery). Two leads for review, never counted as problems: "possible takeover: review" (gambling or adult words on a
page that still names the brewery) and "possibly moved: review" (a redirect to a host that carries the name, on a
page that does not).

"Names the brewery" means the distinctive name: the listing's name with generic words (brewing, brewery, company,
co, beer, taproom, the, and ...) removed, **every** remaining word present as a whole word. One word of several is
not the name, and a word inside another word is not that word. A page on the brewery's own domain that does not name
it in full is "could not observe", not OK.

## The validity rules

1. **A failed observation is never a pass and never overwrites last-good state.** A stop, listing or link that
   could not be observed keeps its old entry and its dates.
2. **Each check is all-or-nothing.** If check A is not valid for any one road, check A writes no state for any road
   and makes no proposal. The same for B and C. The run then exits 2.
3. **Sanity floors.** More than 15% of the stops on a road GONE in one run: the run is treated as broken (network,
   an API change, our parser). For the directory: more than 15% of listings with a last good status newly closed,
   or newly not found; and separately, among listings seen for the first time, more than 15% closed or not found
   (for fewer than ten such listings: more than two). For links: the same two tests over every problem class, where
   "seen for the first time" means the listing **and its URL**: a known listing with a new address is a new link.
   Also failing a check: more than 15% of answers not accepted (B), more than 30% of links unobservable (C), more
   than 15% of a road's stops unobservable (A, not counting stops with a current browser check), a directory read
   that returns under 80% of the listings the baseline saw, or our own site and a known-good name unreachable at
   the start or the end of the check (all three checks). A tripped floor preserves the prior state.
4. **It only reads.** It never retires a listing, never adds a stop, never edits an address, hours or a quote, and
   never writes to the D1 database (one `SELECT` is the only statement it sends). It writes only under its data
   directory.
5. **A proposal needs two distinct observations at least 48 hours apart.** Each observation carries the time that
   page was read (not the time the run began), and the 48 hours are measured between those times. A sighting is
   bound to the stop, the cited page and the cited text: if any of them changes, the stop's entry is wiped at once,
   whatever the new observation is, and earlier sightings can never count again.
   A stop that qualifies stays "eligible, proposed": each run re-reads it and proposes again for as long as it stays
   gone and nobody has acted. Found again, its sightings are cleared.
6. **Shown dates do not change.** A CONFIRMED stop gets its re-confirmation time in the state file only. The "hours
   read on DATE" shown on a page is never touched by this job.
7. **Honest requests.** User agent `BreweryTripBot/1.0 (+https://brewerytrip.com/about)`, one request at a time per
   site, at most one retry, and a refusal is taken as a refusal.

Three readings of the brief that the outside review left standing:

- A check "observed validly" when it ran to the end, tripped no floor and stayed under its unobservable share. Read
  literally ("any failed observation is exit 2") every run would exit 2, because some pages can only be read in a
  browser and some sites always refuse robots.
- Requests to the status service go four at a time (a metered API, about 15 seconds an answer). Requests to brewery
  sites go one at a time per site.
- A cited page that answers 404 is "could not observe", not GONE: GONE needs a page that loaded normally.

## Where it keeps its files

Everything is under the **data directory**, outside the checkout: `~/brewerytrip-monthly` by default, or
`MONTHLY_DATA_DIR`.

- `state/roads.json`: per stop, what its sighting is bound to, when it was last confirmed and what the page looked
  like then, and any GONE sightings. `state/links.json`: the last good observation of each link.
  `internal/directory-state.json`: the last good status of each listing.
- `state/INITIALISED.json`: which checks have state. If a check is listed there and its state file is missing or
  cannot be read, the run **stops** with a message. It never starts a new baseline silently. Restore from `backups/`.
- `backups/<time>/`: a copy of the state files, made at the start of every run. The newest 12 are kept.
- `reports/<date>.md` (`<date>-confirm.md` for the confirming pass; a second run on the same day gets the run's time
  in its name, so no report is overwritten): per check a status line, counts, the lists a
  person must act on, and the "could not observe" lists kept apart. For check B: counts only.
- `internal/<run time>-directory.md` and `.jsonl`: the check B detail. Internal. Never overwritten by a later run.
- `observations/<run time>-links.jsonl`: what check C saw. Never overwritten by a later run.
- `pages/<date>/`: the fetched text of every GONE reading.
- `proposals/<run time>/`: `suspension.patch`, `evidence.md`, `checks.log`.
- `lock/`: held while a run is going.

State is written to a temporary file and renamed, so a crash cannot leave half a file. One run at a time: the
wrapper takes the lock (`mkdir`) before it pulls and holds it to the end; run by hand, the program takes it. A lock
older than 12 hours is reported as stale and **not** removed: check that no run is going, then delete the `lock`
directory by hand. The wrapper judges the data and log paths before it creates anything: they must be absolute and,
in canonical form, outside the checkout.

The last line of output is a one-sentence summary under 300 characters with counts only, fit for a text message.
Exit code 0 only when every check observed validly; otherwise 2.

## Baselines for checks B and C

B and C report change against a baseline, and a baseline is something a person initialises, once, from observations
they have read.

1. The first run observes and writes its observations (`internal/<run time>-directory.jsonl`,
   `observations/<run time>-links.jsonl`) but writes no state. The report says so.
2. Read the report and the observations.
3. Initialise: `node scripts/monthly-check.mjs --init-baseline b --from <the directory observations file>` and
   `--init-baseline c --from <the links observations file>`.

`--init-baseline` is allowed only when the check has no state. It fetches nothing: the baseline is exactly the file
named, and its SHA-256 hash, the date, who ran it and the counts are recorded in the state. The file must be the
untouched output of a check that ran to its end: each observations file has a run record beside it
(`<file>.run.json`: its hash, the commit, how many listings the directory held and how many were looked at, and
whether the check completed, meaning both connectivity checks passed, the key was accepted and the request cap was
not reached). A file with no record, a record that says the run did not complete, or a hash that no longer matches
is refused. A production baseline must cover the whole directory. It sets aside **only**
the first-run prevalence floor (how many listings are closed, or links broken, with nothing to compare with). It
never accepts observations that failed for any other reason: unreadable answers, a short read, no grounding, an
empty file.

In a 25-listing trial on 2026-11-22, 4 came back closed: the directory still holds listings the status service
calls closed, so the first full run will trip the prevalence floor and need this step.

## Proposals, and applying one

When a stop is eligible, the job builds the suspension in a **disposable git worktree** (a separate copy with its
own files and index, made from the commit that was observed and removed afterwards) and writes to
`proposals/<run time>/`:

- `suspension.patch`: adds the stop to `data/roads/<road>/suspended.json`, the rebuilt road files, the list as it
  stood, and the dated update entry. A brewery listed on another road is included there only when that road cites
  the very same page and text (one piece of evidence; the evidence file says so) or is itself GONE on two
  observations of its own. If another road cites something else for the brewery and that is not gone too, nothing
  is proposed for the brewery: it is reported as an evidence conflict for a person.
- `evidence.md`: the stop, the cited page and text, and each GONE observation with its time and where its page text
  was kept.
- `checks.log`: builds with `--check`, `tsc` and `vitest`, run on the patched copy. The source verifiers are not run
  there.

To apply one, on a branch, as any reviewed change:

```bash
git apply ~/brewerytrip-monthly/proposals/<run time>/suspension.patch
node scripts/build-road-trip.mjs <road> --check     # every road
npx tsc --noEmit && npx vitest run
node scripts/verify-road-sources.mjs <road>         # every road
```

A suspended stop leaves the list; the page counts it under its own heading ("N suspended after a monthly re-check,
pending review"), never as closed, and carries a dated update entry. A stop on two roads must be suspended on both:
the cross-road gate fails otherwise. Read the cited page yourself first. If the hours simply changed, the better fix
is a corrected row, not a suspension.

Things to know when applying: a test that names that very stop will fail and needs updating with the change; and the
source verifier fails while any other listed stop's evidence is missing.

## Undoing a suspension

A suspension is a record, not a deletion. To put a stop back:

1. Remove its entry from `data/roads/<road>/suspended.json` on **every** road that has it.
2. Rebuild each of those roads, then check all of them.
3. Record the change so the page says so:
   `node scripts/record-road-update.mjs <road> <YYYY-MM-DD> "We re-read the page and its visiting hours are shown again." <before.json>`
   where `<before.json>` is the list as it stood (see `data/roads/<road>/listed-before-*.json` for the form).
4. If the page really changed (new hours, a new address), fix the checker's row or add a correction first, and run
   the source verifier.

Or revert the commit that applied the proposal.

## Trials: the drill entry point

```bash
node scripts/monthly-check-drill.mjs --data-dir /tmp/monthly-trial --sample-b 25 --sample-c 60
node scripts/monthly-check-drill.mjs --data-dir /tmp/monthly-trial --only a --pretend-gone us-422/130 --pretend-first-sighting 72
```

The drill runs the same checks by the same rules, kept away from production three ways:

- it must be given a data directory of its own, and refuses the production directory, anything inside or around
  it, and anything inside the checkout. Paths are compared in canonical form, so a symlink or a relative spelling
  does not pass;
- every state file it writes is stamped `"drill": true`, and the production run refuses to read such a file (and a
  drill refuses a state file without the stamp);
- samples (`--sample-b`, `--sample-c`) and pretended observations (`--pretend-gone`, `--pretend-first-sighting
  HOURS`) exist only here. The production run rejects those options, and `--data-dir`, outright.

## What the machine needs (for whoever installs it)

- Node 23.6 or later, `git`, and a checkout of this repository **used for nothing else**, on `main`, with `npm ci`
  done, at the path in the plist, able to fetch `origin`.
- For checks B and C: `npx wrangler` able to read the D1 database (a Cloudflare API token in the job's environment,
  or a logged-in wrangler). Without it, B and C report "could not read the directory" and exit 2.
- For check B: a key for the status service, read inside the program and never printed: `GEMINI_API_KEY` in the
  environment, else the macOS Keychain item `gemini-veo`. Each is tried with one small request and the first that is
  accepted is used. If none is, check B is "could not observe"; it is never a pass. A run is capped at 2,000
  requests (the free allowance is 5,000 a month; a full run is about 1,150) and will not start if the directory
  would need more.
- A data directory that survives: `~/brewerytrip-monthly`. It is the job's memory. Include it in the machine's
  backups.
