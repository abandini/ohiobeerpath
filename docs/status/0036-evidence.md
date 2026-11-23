# 0036 evidence: I-75 closures and links (prepared 2026-11-23, not applied)

Migration: `migrations/0036_i75_closures_and_links.sql`. Revert: `migrations/0036_i75_closures_and_links.revert.sql.txt` (run by hand).

Leads came from the I-75 road checks of 2026-11-22 (`data/roads/i-75/verified_*.json`, `decisions.json`). Names and addresses below are from a read-only `SELECT` against `ohio-beer-path-db` (remote) on 2026-11-23. Every source was re-fetched on 2026-11-23 with the command shown (`$UA` = `BreweryTripBot/1.0 (+https://brewerytrip.com/about)`). The page HTML was saved, tags were stripped, whitespace and curly quotes were normalized, and the quoted words were searched for. "Found" means that search matched in the page's own text. No proxies, archives, caches, other user agents or browsers were used.

Fetch command form: `curl -sL --max-time 30 -A "$UA" -o page.html -w "%{http_code} %{url_effective}\n" '<URL>'`

## Retired (closed)

### 2377 Lock 27 Brewing, 329 E 1st St, Dayton OH 45402-1705
- Decision: **retire**. Only the Dayton row. Row 2376 (Lock 27 Brewing, 1035 S Main St, Centerville) stays open, and the brand's own site lists only "CENTERVILLE BREWPUB 1035 South Main Street".
- Source: WHIO, 17 Oct 2023. https://www.whio.com/news/local/popular-local-brewery-closes-downtown-dayton-location/QOOONTAM4FHE3GGLQHRZUMLTR4/
- Quote (found): "A popular local brewery has closed its downtown Dayton location." and "Lock 27 Brewing, located at 329 E. First Street"
- `curl -sL --max-time 30 -A "$UA" -o whio.html -w "%{http_code} %{url_effective}\n" 'https://www.whio.com/news/local/popular-local-brewery-closes-downtown-dayton-location/QOOONTAM4FHE3GGLQHRZUMLTR4/'` returned 200.
- Link unchanged: lock27brewing.com is the brand's live site (its title still says "Downtown Dayton's Favorite Brewery").

### 483 Founders Brewing Co, 456 Charlotte St, Detroit MI 48201-2640
- Decision: **retire** (Detroit taproom only).
- Source: FOX 2 Detroit, 1 May 2023. https://www.fox2detroit.com/news/founders-closes-detroit-taproom-citing-impact-of-pandemics-shutdown
- Quote (found): "Founders Detroit Taproom announced it is permanently closing after six years." Address tie (found): "The popular location on Charlotte Street between Cass and 2nd Avenue"
- `curl -sL --max-time 30 -A "$UA" -o fox2founders.html -w "%{http_code} %{url_effective}\n" 'https://www.fox2detroit.com/news/founders-closes-detroit-taproom-citing-impact-of-pandemics-shutdown'` returned 200.
- Also: `https://foundersbrewing.com/detroit/` returned 404. Link unchanged: foundersbrewing.com is the live brand site.

### 633 Roak Brewing Co., 330 E Lincoln Ave, Royal Oak MI 48067-2700
- Decision: **retire**.
- Source: FOX 2 Detroit, 1 Feb 2021. https://www.fox2detroit.com/news/roak-brewing-in-royal-oak-announces-closing-of-taproom-feb-1
- Quote (found): "Roak Brewing Company, which has operated a taproom in the Oakland County city since 2015 announced online it wouldn't be reopening Feb. 1."
- `curl -sL --max-time 30 -A "$UA" -o fox2roak.html -w "%{http_code} %{url_effective}\n" 'https://www.fox2detroit.com/news/roak-brewing-in-royal-oak-announces-closing-of-taproom-feb-1'` returned 200.
- Replacement: FOX 2 Detroit, 5 May 2021. https://www.fox2detroit.com/news/eastern-market-brewing-to-expand-to-former-roak-space-in-royal-oak. Quote (found): "announced Wednesday that it will expand into the former Roak Brewing space in Royal Oak". `curl -sL --max-time 30 -A "$UA" -o fox2emb.html -w "%{http_code} %{url_effective}\n" 'https://www.fox2detroit.com/news/eastern-market-brewing-to-expand-to-former-roak-space-in-royal-oak'` returned 200.
- Neither FOX 2 page prints the street number. The tie to 330 E Lincoln is the town plus Roak having one Royal Oak taproom. Metro Times (`after-five-years-roak-brewing-to-close-in-royal-oak`) returned 403 and was not used. Link already NULL (0028).
- Lead, not done: search results say the space became the Lincoln Tap (Eastern Market Brewing / Ferndale Project). Not fetched.

### 397 Big Rock Chop House & Brewery, 245 S Eton St, Birmingham MI 48009-6577
- Decision: **retire** and **link removed**.
- Source: Downtown Newsmagazine (Lisa Brody), 10 Dec 2021. https://www.downtownpublications.com/single-post/big-rock-chophouse-closing-december-18
- Quote (found): "the owners of Birmingham's Big Rock Chophouse now stated the restaurant will be closing its doors for the last time on Saturday, December 18." Address tie (found): "Big Rock Chophouse is located at 245 S. Eton Street"
- `curl -sL --max-time 30 -A "$UA" -o bigrock.html -w "%{http_code} %{url_effective}\n" 'https://www.downtownpublications.com/single-post/big-rock-chophouse-closing-december-18'` returned 200.
- The source is a closing announcement dated 8 days ahead. 0033 accepted announcements of this kind.
- Successor (search results only, not fetched or cited): Big Rock Italian Chophouse, opened July 2025 by Cameron Mitchell Restaurants and partners. It is a restaurant, not a brewery, and has different owners. Metro Times' story on it returned 403.
- Link: previous `website_url` = `http://www.bigrockchophouse.com`. `curl -sI -A "$UA" http://www.bigrockchophouse.com` returned 301 to https. `openssl s_client -connect www.bigrockchophouse.com:443 -servername www.bigrockchophouse.com | openssl x509 -noout -subject` printed `subject=CN=375atthedistrict.com`. `curl -sLk --max-time 20 -A "$UA" -o brdomain.html -w "%{http_code} %{url_effective}\n" http://www.bigrockchophouse.com` returned 200 with a hosting company's default page. Quote (found): "You have reached the default application for IP address 192.241.150.108." Set to NULL.

### 564 Lumber Barons Brewery, 804 E Midland St, Bay City MI 48706-4953
- Decision: **retire**. The blog lead (Better On Draft) was not used. Two news outlets replace it.
- Source 1: WNEM, 13 Jun 2024. https://www.wnem.com/2024/06/13/businesses-breathing-life-into-bay-citys-midland-street/
  Quote (found): "The Lumber Barons and Stables on Bay City's Midland Street has been closed for nearly two years"
  `curl -sL --max-time 30 -A "$UA" -o wnem.html -w "%{http_code} %{url_effective}\n" 'https://www.wnem.com/2024/06/13/businesses-breathing-life-into-bay-citys-midland-street/'` returned 200.
- Source 2: Huron Daily Tribune (michigansthumb.com), Dominic Sevilla, 11 Aug 2023. https://www.michigansthumb.com/news/article/bay-city-lumber-barons-stables-sold-golden-glow-18287457.php
  Quote (found): "Currently, the now former Lumber Barons and Stables, which is located at 804 East Midland Street in Bay City, are closed"
  `curl -sL --max-time 30 -A "$UA" -o thumb.html -w "%{http_code} %{url_effective}\n" 'https://www.michigansthumb.com/news/article/bay-city-lumber-barons-stables-sold-golden-glow-18287457.php'` returned 200.
- Refused, not used: MLive returned 403 and ABC12 returned 429.
- Link: already NULL (0028). `curl -sL -A "$UA" http://lumberbaronsbrewery.com/` lands on `https://rtpslot828.com/`, an Indonesian slot-gambling page. Nothing to change.
- Lead, not done: W.H. Ales Brewpub at the same address (WNEM: "The W.H. Ales restaurant and brewpub").

## Retired (replaced by a listing already in the directory; no merge)

### 2436 Star City Brewing Company, 319 S 2nd St, Miamisburg OH 45342-2926
- Decision: **retire**. The successor is row 302 Peerless Mill Inn & Brewery at the same address, still open. 0012 had already renamed row 302 from Star City, so 2436 is a second Star City row.
- Source: own site. https://www.starcitybrewing.com/
- Quote (found): "Founded in November of 2025, Peerless Mill Inn & Brewery (formerly Star City Brewing Co)"
- `curl -sL --max-time 30 -A "$UA" -o starcity.html -w "%{http_code} %{url_effective}\n" 'https://www.starcitybrewing.com/'` returned 200.
- Link unchanged: the domain is live and is the successor's own site, not dead or unrelated. A person may want to NULL it so the retired row does not link the successor (0032 note).

### 2323 Bowling Green Beer Works, 322 N Grove St Ste C, Bowling Green OH 43402-2322
- Decision: **retire**. The successor is row 50 Brewing Green (new owners and a new name).
- Source: BG Falcon Media (Jake Pietrasz). No date is printed on the page. https://bgfalconmedia.com/97370/news/bgs-oldest-brewery-makes-new-changes/
- Quotes (found): "Bowling Green's oldest brewery, Bowling Green Beer Works, is making some big changes." and "Householder and Develvis wanted a fresh start for the business, including a new name, changing it from Bowling Green Brew Works to Brewing Green."
- `curl -sL --max-time 30 -A "$UA" -o bgfalcon.html -w "%{http_code} %{url_effective}\n" 'https://bgfalconmedia.com/97370/news/bgs-oldest-brewery-makes-new-changes/'` returned 200.
- The article prints no street address. The tie is the name and the town.
- Follow-up: row 50 has an empty street and postal code, and its operating status is UNCONFIRMED in the road check. Retiring 2323 leaves only row 50 on the map for this business.

## Held

### 50 Brewing Green, (no street), Bowling Green OH
- Decision: **held / no change**. It is the successor to 2323. It is not confirmed open, and it has no address. `brewinggreen.com` was reported by the checker to redirect to a domain-for-sale page, and website_url is already NULL.

### 302 Peerless Mill Inn & Brewery, 319 S. 2nd St., Miamisburg OH 45342
- Decision: **held / no change**. The successor to 2436. decisions.json says its site does not state that beer is brewed there.

### 656 Soo Brewing Company, 223 W Portage Ave, Sault Sainte Marie MI / 559 Lockside Brewery / 1668 Winery, 100 W Portage Ave
- Decision: **held**.
- Looked at: https://soobrew.com/ (`curl -sL --max-time 30 -A "$UA" -o soobrew.html -w "%{http_code} %{url_effective}\n" 'https://soobrew.com/'` returned 200). It prints "Soo Brewing Company and 1668 Winery" and "100 West Portage Avenue Sault Ste. Marie, MI 49783". "Lockside" and "223" do not appear in the page text.
- Why not enough: this looks like one business that moved, which 0032 defers rather than retires. No source says Soo Brewing closed at 223 W Portage or that Lockside was renamed. The absence of a name is not a quoted source. A person should decide which row carries the business and at which address.
- 559 link `http://1668winery.com/thebeers/`: `curl -sL --max-time 20 -A "$UA" -o 1668.html -w "%{http_code} %{url_effective}\n" http://1668winery.com/thebeers/` returned 403 Forbidden, and the root also returned 403. A refusal is not proof that the domain is dead, so the link was left unchanged.

### 896 Alltech's Lexington Brewing, 475 Angliana Ave, Lexington KY / 941 Town Branch Distillery, 401 Cross St
- Decision: **held**. A duplicate of the same company. The site has no merge feature, and 0032 has no pattern for two open rows of one business.
- Looked at: https://lexingtonbrewingco.com/ (`curl -sL --max-time 30 -A "$UA" -o lexbrew.html -w "%{http_code} %{url_effective}\n" 'https://lexingtonbrewingco.com/'` returned 200). It prints "401 Cross Street, Lexington, KY 40508". "Angliana" does not appear on the page.
- Why not enough: no source says the Angliana Ave site closed. decisions.json also marks 941 NOT A BREWERY TAPROOM (a visitor centre with tours).

### 2396 Nowhere In Particular Brewing Company, 6826 Loop Rd, Dayton OH
- Decision: **held**.
- Looked at: https://nipbrewco.com/ (`curl -sL --max-time 30 -A "$UA" -o nip.html -w "%{http_code} %{url_effective}\n" 'https://nipbrewco.com/'` returned 200). Quote (found): "Instead, he rents unused fermentation capacity at established breweries".
- Why not enough: the site says this is a contract brand with no taproom, but closed_at means closed, and no earlier migration retires a listing for not being a taproom. A person should decide whether to remove or retype it. The link is live, so it was not changed.

### 689 The Red Baron, 2495 S Center Rd, Burton MI
- Decision: **held**.
- Looked at: https://baronburger.com/about-us.html (`curl -sL --max-time 30 -A "$UA" -o baron.html -w "%{http_code} %{url_effective}\n" 'https://baronburger.com/about-us.html'` returned 200, landing on www). Quote (found): "We are dedicated to maintaining 56 pristine, rotating taps"
- Why not enough: the site describes a craft-beer sports bar, but it does not say it does not brew, and there is no retirement rule for "not a taproom". The link is live.

### 699 Traffic Jam and Snug, 4268 2nd Ave, Detroit MI
- Decision: **held**.
- Looked at: FOX 2 Detroit, 27 May 2022. https://www.fox2detroit.com/news/detroit-loses-midtown-landmark-as-blaze-destroys-traffic-jam-snug-brewpub (`curl -sL --max-time 30 -A "$UA" -o fox2tj.html -w "%{http_code} %{url_effective}\n" '<that URL>'` returned 200). Quote (found in the page's embedded article JSON, not in the visible text after tag stripping): "Once it cleared, it was obvious that Traffic Jam and Snug was a total loss."
- Also looked at: http://www.trafficjamdetroit.com/ returned 200 and still prints hours.
- Why not enough: a fire, not a closure. 0033 held fires. Search results (not fetched or cited) report the owner told Crain's he would rebuild. No source found that says it closed for good or that it reopened. The link is the business's own site, so it was not changed.

### 577 Motor City Brewing Works, 470 W Canfield St, Detroit MI
- Decision: **held**.
- Looked at: https://www.motorcitybeer.com/ (`curl -sL --max-time 30 -A "$UA" -o motorcity.html -w "%{http_code} %{url_effective}\n" 'https://www.motorcitybeer.com/'` returned 200). Quote (found): "After February 8, the taproom will pause while we figure out what comes next."
- Why not enough: "pause" is not a closure. 0033 held paused listings. The link is live.

## Website links checked and left alone
- 2377 and 2376 `lock27brewing.com`: live brand site.
- 483 `foundersbrewing.com`: live brand site.
- 2436 and 302 `starcitybrewing.com`: live successor site.
- 896 `lexingtonbrewingco.com`: live.
- 577, 699, 689, 2396: live own sites.
- 559 `1668winery.com`: 403, unconfirmed.
- 564 and 633: already NULL.
