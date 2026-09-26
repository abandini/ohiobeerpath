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
