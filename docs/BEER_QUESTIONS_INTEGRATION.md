# Beer Questions → Brewery Trip integration

**Written 2026-09-26.** beerquestions.com is a small daily beer-trivia game whose only job is to send players
to brewerytrip.com. Design: `~/CascadeProjects/games/beer-questions/docs/superpowers/specs/2026-09-26-beer-questions-design.md`.
This note tells the brewerytrip codebase what the game relies on and what it sends.

## What the game reads from brewerytrip (keep these stable)
- `GET https://brewerytrip.com/api/breweries?limit=N` and `GET /api/breweries/{id}` — fields used: `id, name, city, state, state_province, region, description, website_url, amenities`. Regional trivia questions are generated from these plus the brewery's own website; each question stores `brewery_id` and links to the page below.
- Brewery page URL pattern: `https://brewerytrip.com/brewery/{id}` (confirmed live 2026-09-26).
- A nightly job in the game fetches `/api/breweries/{id}` for every regional question and retires the question if the brewery 404s.

## What the game sends to brewerytrip
- **Traffic:** links carry `?utm_source=beerquestions&utm_medium=game&utm_campaign=daily` (or `campaign=bonus`). Count them in Cloudflare Web Analytics / the marketing agent's metrics by `utm_source`.
- **Newsletter sign-ups:** the game's results screen POSTs to `https://brewerytrip.com/api/subscribe` (CORS is `*`, verified) with
  `{"email": "...", "preferences": {"source": "beerquestions", "campaign": "daily"}}`.
  Nothing on this side needs to change: `preferences` is already stored as JSON. To count them:
  `SELECT COUNT(*) FROM email_subscribers WHERE json_extract(preferences, '$.source') = 'beerquestions';`
  Success target for the game: ≥ 3% of daily completions become sign-ups.
- **Open question for this repo:** `/api/subscribe` sets `verified = 0` and returns "Check your email to verify", but it is not clear a verification email is actually sent. If it isn't, either send one or count unverified rows; the game's metric assumes *confirmed* subscriptions.

## Optional follow-ups on the brewerytrip side (not required for launch)
- A "Play today's beer question" link in the site footer / newsletter, pointing at https://beerquestions.com.
- `GET https://beerquestions.com/api/today` returns `{number, date, prompt, url}` for the marketing agent's daily post (see `brewerytrip-marketing-agent/docs/beer-questions.md`).
- If `/brewery/{id}` or `/api/subscribe` ever change shape, update the game (`games/beer-questions`) the same day; the game's E2E tests hit these URLs.

## Abuse note (2026-09-26)
`POST /api/subscribe` has no rate limit or challenge on this side, and CORS is `*`, so any page (not only the game) can submit sign-ups. The game rate-limits its own endpoints but cannot protect this one. Recommended here: a Cloudflare WAF rate-limiting rule on `/api/subscribe` (e.g. 5/min per IP) and confirming that verification emails are actually sent so unverified rows can be pruned. The OPTIONS preflight (204, `Allow-Methods: POST`, `Allow-Headers: Content-Type`) was verified working for cross-origin JSON posts.

## Status check-in (2026-09-28)
- The game is built and reviewed (`games/beer-questions`, branch `build-v1`), not yet deployed: beerquestions.com still serves the Netlify parking page; Bill removes those DNS records, then deploys. Remote D1 is empty; the question bank is generated after deploy.
- Contract confirmed live today: `GET /brewery/{id}` 200, `GET /api/breweries/{id}` 200 / 404 for a missing id, `OPTIONS /api/subscribe` 204 with CORS `*`. The game's nightly check now fetches `/api/breweries/{id}` with `redirect: "manual"`, ≤ 20 breweries a night, 5 s timeout; only a literal 404 retires a question, and a mass-404 night (> 20 %) retires nothing.
- `/api/subscribe` responses the game relies on: 200 `{success:true}`; 400 `{error:"Email already subscribed"}` (counted as a duplicate, not a sign-up); anything else → the game shows a link to `https://brewerytrip.com/?utm_source=beerquestions&utm_medium=game&utm_campaign=newsletter#subscribe`.
- `GET https://beerquestions.com/api/today` will return `{number, date, prompt, url}` with `url = https://beerquestions.com/?src=brewerytrip&utm_source=brewerytrip&utm_medium=social` (the game attributes by `?src=`).
- **Data issue found today:** commit `c1fa165` nulled 347 fabricated `website_url` values (`https://www.<name>brewing.com`) in `data/ohio-breweries-original.json` and put the real sites in `website2` — but the live API still serves the old values: 385 of 1,124 `website_url`s match the fabricated pattern, and `website2` is not exposed. The game's question generator reads `website_url` to fetch each brewery's homepage; fabricated domains may be parked or squatted, which yields junk or wrong facts. Game-side mitigation: the generator skips pages that don't mention the brewery's name. **Ask for this repo:** apply the fix to D1 (null the fabricated `website_url`s, or serve `website2` as `website_url`) so regional questions come from real sites.
