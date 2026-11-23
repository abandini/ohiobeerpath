# Opening hours from Google's Maps-grounded service

Since 2026-11-23 (the owner's decision that day) a road stop may show opening hours that are not quoted from a page of
the brewery's: the output of Google's Maps-grounded Gemini service, citing Google Maps. It began as a trial on one
stop, 44 BrewDog Cleveland Outpost (I-71 and US 422). Each further stop is a reviewed change of its own.

## When it may be used

All of these. `mapsEvidenceProblems` in `src/lib/road-trip.ts` enforces the ones a program can check (the mark, the
Google Maps link, the returned name, an address from the brewery's own site, a recorded note). It cannot check that a
person really saw hours on the brewery's page: that is the reviewer's and the recorder's responsibility, stated in the
decision's reason and note.

- The brewery has a site of its own, and the stop's **address is read from that site** by our script.
- That site's hours cannot be re-read by our checks, and a person has seen hours on it. The stop records this in its own
  words (`evidence.note` in the decision); nothing about it is assumed for the next stop.
- The service returned a place citation: the place name and a Google Maps link. Both are stored and shown.
- It is opening hours, never a notice, and never a reason to retire a listing. Closures need a published source.

It is recorded only as a decision in `data/roads/<road>/decisions.json` (`evidence.via: "google-maps"`), never in a
checker's file. The full grounded answer is kept in `data/roads/<road>/maps/<id>-<date>.json`.

## What the page must show (Google's requirements, read 2026-11-23)

"Attribute each source to Google Maps", "display the source name provided in the response", and "link to the source
using the url from the annotation". The words Google Maps are never altered, wrapped or translated (`translate="no"`).
The page says the hours were returned by the service, citing Google Maps, and does not put them in quotation marks.
This covers the requirements on that documentation page only; Google's wider terms have not been reviewed by us.

## Keeping it current

- **Who:** whoever reads the monthly re-check report (the site owner, or the session working for them). The monthly
  job lists every such stop under "could not observe" with the date it was last asked; the job itself never requests
  Google Maps.
- **By when:** within 45 days of the date shown under the stop (`BROWSER_CHECK_MAX_DAYS`). From day 46 the source
  verifier fails for that road, so nothing else on the road can be published until this is settled.
- **A successful re-check:** one new grounded request for the same name and address that returns status OPERATIONAL,
  the same place (same place id), and weekly hours. Then: save the new answer under `maps/`, put the hours as
  returned and the new date in the decision, rebuild, record a dated update entry if the hours changed, and publish
  through review. A re-check is a new observation with its own record, never a changed date alone.
- **If it is not re-checked, or the service no longer returns the place as operating with hours:** the stop comes off
  the list on every road that has it: remove its decision (the checker's row is unconfirmed, so it returns to the
  unresolved count), rebuild each road, and record a dated update entry on each. That is not a finding that it
  closed. The source verifier failing does not take a published stop off by itself: a person does this.
- **If the brewery's own page becomes readable by our script:** cite the page and drop the Maps evidence.

To see what will expire: `node scripts/verify-road-sources.mjs <road> --as-of <a later date>` (a later date only; it can make the
check stricter, never looser), and in a drill of the monthly job `--pretend-today <a later date>`.
