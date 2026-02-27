# BreweryTrip.com Marketing Plan & Revenue Strategy

**Date:** February 27, 2026
**Status:** Approved
**Author:** Claude Code (competitive research + financial modeling)

---

## Executive Summary

BreweryTrip.com is positioned to become the definitive brewery discovery and trip planning platform, starting with Ohio (442 breweries, $1.29B economic impact, 6th largest craft beer state) and expanding state-by-state via subdomain infrastructure already in place. The market is fragmented across siloed city passports, dated guild apps, and overpriced national platforms. Our competitive advantage: the only platform combining discovery + AI trip planning + gamification + multi-state expansion in a PWA with zero app-store friction.

**Projected Year 1 ARR:** $15,790 (conservative/80% confidence) to $214,150 (optimistic/25% confidence), with a base case of **$67,662 at 55% confidence**.

**Projected Year 3 ARR:** $120,000 (conservative) to $1,600,000 (optimistic), with a base case of **$516,000**.

---

## 1. Competitive Landscape

### 1.1 Direct Competitors (Ohio-Focused)

#### Ohio On Tap (Ohio Craft Brewers Association)
- **Users:** 42,000-60,000 (largest state brewery passport app nationally)
- **Model:** Free app funded by OCBA membership dues
- **Breweries:** 330 taproom locations (180 OCBA members only)
- **Strengths:** RUBY Award winner, built-in guild distribution, badge system
- **Weaknesses:** Limited to OCBA members (not all 442 OH breweries), dated UI, no trip planning, no deals, no social features, no AI
- **Source:** [Ohio Craft Brewers Association](https://ohiocraftbeer.org/app/), [The Brewer Magazine](https://thebrewermagazine.com/ohio-tap-app-users-go-another-round/)

#### Columbus Ale Trail
- **Model:** Free physical passports via Experience Columbus
- **Breweries:** 50+ (Columbus metro only)
- **Weaknesses:** Physical-only, no digital, limited to one metro
- **Source:** [Columbus Ale Trail](http://www.cbusaletrail.com/)

#### Cleveland Brewery Passport
- **Users:** ~4,900 (2024), 12% from outside Ohio
- **Breweries:** 46 (2025, Cleveland metro only)
- **Model:** Digital passport via Destination Cleveland
- **Weaknesses:** Single metro, no trip planning, no statewide coverage
- **Source:** [WKYC Cleveland](https://www.wkyc.com/article/news/local/cleveland/cleveland-brewery-passport-2025-46-breweries-prizes/95-75245ff7-5c26-4483-a9a6-c344a417097d)

### 1.2 National Platforms

#### Untappd (Next Glass)
- **Users:** ~12 million registered, <2M MAU (per former employee disclosure)
- **Business subscribers:** ~20,000 venues globally
- **Pricing:** Insiders $5.99/mo consumer; UTFB $899-$1,199/yr B2B
- **Revenue estimate:** $20-50M ARR (UTFB + Insiders + data licensing)
- **Strengths:** Largest beer social network, 1B+ check-ins, massive data moat, DoorDash partnership (Aug 2025)
- **Weaknesses:** Aggressive price increases alienating small breweries, no trail/passport features, no trip planning, no regional curation, sales culture dysfunction (21% quota attainment per RepVue), expanding beyond beer dilutes core identity
- **Sources:** [Untappd Wikipedia](https://en.wikipedia.org/wiki/Untappd), [Next Glass/PSG](https://psgequity.com/portfolio/next-glass), [BeerMenus UTFB Guide](https://www.beermenus.com/blog/260-untappd-for-business), [Good Beer Hunting](https://www.goodbeerhunting.com/sightlines/2021/2/23/how-untappd-ratings-became-craft-beers-most-fickle-prize), [Untappd Recappd 2025](https://www.nextglass.co/news/untappd-recappd-2025/)

#### BeerMenus
- **Pricing:** $49-$99/mo ($499-$599/yr annual)
- **Database:** 250,000+ beers
- **Model:** B2B SaaS menu management + free consumer beer finder
- **Strengths:** Never raised prices, cheaper than Untappd, strong beer search
- **Weaknesses:** No social features, no trails, no gamification, no tourism focus
- **Source:** [BeerMenus Pricing](https://www.beermenus.com/pricing)

#### Evergreen (formerly TapHunter)
- **Pricing:** $49-$177/mo
- **Database:** 300,000+ beers/wines/spirits
- **Strengths:** Inventory management, POS integration, broader beverage scope
- **Weaknesses:** Rebrand confusion, limited consumer traction, no trails
- **Source:** [Evergreen](https://www.evergreenhq.com/story/)

#### Taplist.io
- **Pricing:** $400-$700/yr per location
- **Strengths:** Half the price of Untappd, stronger brand customization
- **Weaknesses:** Menu-focused only, no consumer discovery
- **Source:** [Taplist.io vs Untappd](https://taplist.io/compare/untappd-for-business-alternative)

### 1.3 Multi-State Trail Platforms

| Platform | Model | Pricing | Coverage | Users |
|----------|-------|---------|----------|-------|
| Hop Passport | Paid coupon passport | $40-45/state | 10+ states | 10K+ |
| TagaBrew | Physical copper tags + app | $5-6/tag | 585 breweries, 20 states | Unknown |
| PubPass | Deal subscription | Annual sub | 4 cities | Unknown |
| LoyalBrew | White-label B2B platform | Custom | Regional trails | Varies |

**Sources:** [Hop Passport](https://www.hoppassport.com/), [TagaBrew](https://tagabrew.com/), [PubPass](https://getpubpass.com/), [LoyalBrew](https://www.loyalbrew.com/)

### 1.4 Key Market Gaps

1. **No unified Ohio platform.** Ohio On Tap covers only OCBA members. City passports are siloed. Nobody covers all 442 breweries.
2. **Nobody combines discovery + deals + gamification + AI trip planning.** Each competitor has 1-2 of these. We have all 4.
3. **Untappd pricing pushes small breweries out.** At $899-$1,199/yr, many Ohio craft breweries can't justify it.
4. **No PWA-first brewery platform.** Ohio On Tap requires native app download. LoyalBrew is web-based but white-label only. We're PWA-first with offline support.
5. **No AI-powered route optimization in any competitor.** Our Llama 3 integration for itinerary planning is unique.

---

## 2. Market Size

### Beer Tourism
- **U.S. beer tourism market (2024):** $4.37 billion
- **Projected (2030):** $8.18 billion (11.3% CAGR)
- **Source:** [Grand View Research](https://www.grandviewresearch.com/horizon/outlook/beer-tourism-market/united-states)

### Ohio Craft Beer Industry (2024)
- **Economic impact:** $1.29 billion
- **Breweries:** 442 (46 new in 2024, 53 in planning)
- **Production:** 1.15 million barrels (6th nationally)
- **Jobs:** 12,255
- **Taxes generated:** $227.7 million (state/local + federal)
- **Source:** [Craft Brewing Business](https://www.craftbrewingbusiness.com/featured/ohios-craft-beer-industry-delivers-1-29-billion-economic-impact-in-2024/), [Ohio Capital Journal](https://ohiocapitaljournal.com/briefs/ohios-442-craft-breweries-had-a-1-29-billion-economic-impact-in-2024/)

### U.S. Craft Beer Industry (2024)
- **Total craft breweries:** 9,796
- **Retail value:** $28.8 billion
- **Market share:** 13.3% by volume
- **Employment:** 197,112 jobs
- **Source:** [Brewers Association](https://www.brewersassociation.org/association-news/brewers-association-reports-2024-u-s-craft-brewing-industry-figures/)

### Consumer Demographics
- Age 21-35: 48.6% of craft beer market
- Age 40-54: Fastest growing segment (6.8% CAGR)
- Male: 69.4% (female growing at 12.75% CAGR)
- 65% of millennials willing to pay premium for craft experiences
- 84% of craft drinkers interested in subscription/club models
- Average taproom tab: $51.33 per visit (~2 guests)
- **Source:** [IMARC Group](https://www.imarcgroup.com/craft-beer-market), [Secret Hopper](https://www.secrethopper.com/secret-blogger/food-2025)

---

## 3. Strategic Position

### Our Competitive Advantages
1. **All 442 Ohio breweries** (not just guild members) -- most comprehensive database
2. **AI-powered trip planning** (Llama 3 route optimization) -- nobody else has this
3. **PWA with offline support** -- no app store friction, installable
4. **Multi-state infrastructure ready** (24 subdomains configured)
5. **Zero marginal cost per brewery** (Cloudflare Workers, D1, R2 -- serverless)
6. **Untappd OAuth integration** -- bridge existing beer community
7. **SEO advantage** -- 2,328 indexed URLs, dynamic sitemap, schema.org structured data

### Positioning Statement
> BreweryTrip.com is the free, AI-powered brewery discovery and trip planning platform for craft beer enthusiasts exploring Ohio and beyond. Unlike Untappd (social-only, no trips), Ohio On Tap (guild-members-only, dated), or city passports (siloed), BreweryTrip covers every brewery, plans optimal routes, and gamifies the journey -- all in a fast PWA with no download required.

---

## 4. Revenue Model

### Stream 1: Brewery Enhanced Listings (B2B SaaS) - PRIMARY

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Basic listing: name, address, hours, region, type |
| **Claimed** | $0 | Brewery claims listing: photo uploads, event posting, basic analytics, respond to reviews |
| **Pro** | $49/mo or $499/yr | Featured placement, promoted events, analytics dashboard, "Verified" badge, special offer creation, email lead capture, priority in search/nearby results |
| **Premium** | $99/mo or $899/yr | All Pro + AI-powered "Why Visit" recommendations, competitor benchmarking, sponsored trail placement, newsletter feature, monthly performance report |

**Pricing rationale:** Undercuts Untappd by 45% at Pro tier. Matches BeerMenus at Pro level while offering trail/tourism features they don't have. Premium matches Untappd Essentials but includes analytics and recommendations.

### Stream 2: Consumer Premium ("Brewery Trip+")

| Plan | Price |
|------|-------|
| Monthly | $4.99/mo |
| Annual | $39.99/yr |

**Features:** Offline trail maps, advanced badge/achievement system, trip history export, exclusive deals at participating breweries, ad-free experience, priority event access, detailed personal stats, unlimited itinerary saves.

**Rationale:** 17-27% cheaper than Untappd Insiders ($5.99/mo, $54.99/yr). Targets 3-5% freemium conversion (industry average per First Page Sage).

### Stream 3: Newsletter Sponsorships
- Weekly "Ohio Beer Trail" newsletter
- CPM: $35-50 (food/beverage niche benchmark)
- Revenue per recipient in F&B: $0.16 (highest of any e-commerce sector)
- **Source:** [beehiiv](https://www.beehiiv.com/blog/newsletter-sponsorship-cost), [Revenews](https://www.revenews.co/p/howtopricenewslettersponsorships)

### Stream 4: Affiliate Revenue
- Beer subscription boxes: 5-15% commission (Beer Drop 10%, Craft Beer Club 5%)
- Brewery merch/gear: 3-15%
- Hotel/lodging near brewery trails: 3-8%
- Homebrewing equipment: 6-15%
- **Source:** [UpPromote](https://uppromote.com/affiliate-programs/beer/), [Authority Hacker](https://www.authorityhacker.com/beer-affiliate-programs/)

### Stream 5: Event Ticketing Commission
- 5-10% on tickets sold through platform
- Average brewery event ticket: $25-$75
- Benchmark: Eventbrite charges ~11% effective rate
- **Source:** [Eventbrite Pricing](https://www.eventcube.io/blog/eventbrite-fees-pricing-explained)

### Stream 6: Sponsored Content
- "Brewery Spotlight" features: $99-$299/feature
- Blog + newsletter + social media bundle
- 12-24 features/year

---

## 5. Go-to-Market Strategy

### Phase 1: Foundation (Months 1-3) - $0 budget
**Goal:** 5,000 monthly visitors, 500 registered users, 25 claimed breweries

| Channel | Tactic | Expected Result |
|---------|--------|----------------|
| SEO | 2,328 URLs indexed. Target: "best breweries [city] Ohio", "Ohio brewery trail", "breweries near me Ohio" | 3,000 organic visitors/mo by M3 |
| Brewery Outreach | Direct email to 442 OH breweries: "Claim your free listing + analytics" | 25 claimed listings |
| Content | Weekly blog: regional guides, seasonal picks, trail recommendations | 8-12 SEO posts |
| Social | Instagram + TikTok brewery visit content, tag breweries, UGC from ratings | 500 followers |
| Partnerships | Approach OCBA, Experience Columbus, Destination Cleveland for cross-promotion | 1-2 partnerships |

### Phase 2: Growth (Months 4-8) - ~$500/mo budget
**Goal:** 25,000 monthly visitors, 5,000 users, 100 claimed breweries, 25 paying Pro breweries

| Channel | Tactic | Budget |
|---------|--------|--------|
| Paid Search | Google Ads: "Ohio breweries", "brewery trip Ohio", "Columbus brewery tour" | $300/mo |
| Newsletter | Launch weekly "Ohio Beer Trail" newsletter, target 2,500 subscribers | $0 (use existing email infra) |
| Ambassador Program | Free Pro tier (3 months) for first 20 breweries who promote platform | $0 (deferred revenue) |
| Local PR | Pitch Columbus Dispatch, Cleveland Plain Dealer, Cincinnati Enquirer, Ohio Magazine | $0 |
| Events | Table at Ohio Craft Brewers Conference, Great Lakes Brewing News events | $200/mo |

### Phase 3: Scale (Months 9-18) - ~$2,000/mo budget
**Goal:** 75,000 monthly visitors, 25,000 users, 200 claimed breweries, 75 paying breweries, launch 2nd state

| Channel | Tactic | Budget |
|---------|--------|--------|
| Consumer Premium | Launch Brewery Trip+ subscription | $0 |
| Multi-State | Expand to Michigan, Indiana, Kentucky (subdomain infra ready) | $500/mo outreach |
| Paid Social | Instagram/Facebook ads targeting craft beer enthusiasts in OH, MI, IN | $1,000/mo |
| Affiliate | Launch beer subscription, merch, lodging affiliate links | $0 |
| Event Ticketing | Integrate ticket sales for brewery events | $0 |
| Tourism Boards | Official partnerships with Ohio Tourism, regional CVBs | $500/mo (sponsorship) |

---

## 6. ARR Projections

### Key Assumptions

| Variable | Conservative | Base | Optimistic |
|----------|-------------|------|-----------|
| Ohio breweries claiming listings (Y1) | 80 | 150 | 250 |
| Pro conversion rate (of claimed) | 10% | 20% | 30% |
| Pro ARPU | $499/yr | $549/yr | $649/yr |
| Premium conversion rate (of claimed) | 2% | 5% | 10% |
| Premium ARPU | $899/yr | $899/yr | $899/yr |
| Registered users (Y1) | 5,000 | 15,000 | 35,000 |
| Consumer premium conversion | 2% | 4% | 7% |
| Consumer premium ARPU | $40/yr | $40/yr | $40/yr |
| Newsletter subscribers (Y1) | 3,000 | 8,000 | 15,000 |
| States active (Y1) | 1 (OH) | 1 (OH) | 2 (OH+MI) |

### Year 1 ARR

| Revenue Stream | Conservative | Base | Optimistic |
|----------------|-------------|------|-----------|
| Brewery Pro | 8 x $499 = $3,992 | 30 x $549 = $16,470 | 75 x $649 = $48,675 |
| Brewery Premium | 2 x $899 = $1,798 | 8 x $899 = $7,192 | 25 x $899 = $22,475 |
| Consumer Premium | 100 x $40 = $4,000 | 600 x $40 = $24,000 | 2,450 x $40 = $98,000 |
| Newsletter sponsorships | $3,600 | $12,000 | $27,000 |
| Affiliate + events + sponsored | $2,400 | $8,000 | $18,000 |
| **TOTAL Y1 ARR** | **$15,790** | **$67,662** | **$214,150** |
| **Confidence** | **80%** | **55%** | **25%** |

### Year 2 ARR (Multi-State Expansion)

| Revenue Stream | Conservative | Base | Optimistic |
|----------------|-------------|------|-----------|
| Brewery subscriptions (Pro+Premium) | $18,000 | $72,000 | $210,000 |
| Consumer Premium | $16,000 | $80,000 | $320,000 |
| Newsletter + affiliate + events | $12,000 | $42,000 | $96,000 |
| **TOTAL Y2 ARR** | **$46,000** | **$194,000** | **$626,000** |
| **Confidence** | **75%** | **45%** | **20%** |

### Year 3 ARR (5+ States, Product-Market Fit)

| Revenue Stream | Conservative | Base | Optimistic |
|----------------|-------------|------|-----------|
| Brewery subscriptions | $48,000 | $192,000 | $540,000 |
| Consumer Premium | $48,000 | $240,000 | $840,000 |
| Newsletter + affiliate + events | $24,000 | $84,000 | $220,000 |
| **TOTAL Y3 ARR** | **$120,000** | **$516,000** | **$1,600,000** |
| **Confidence** | **70%** | **35%** | **15%** |

### ARR Summary Table

| Year | Conservative (80%/75%/70%) | Base (55%/45%/35%) | Optimistic (25%/20%/15%) |
|------|---------------------------|--------------------|--------------------------|
| Y1 | $15,790 | $67,662 | $214,150 |
| Y2 | $46,000 | $194,000 | $626,000 |
| Y3 | $120,000 | $516,000 | $1,600,000 |

### Expected Value (Probability-Weighted)

| Year | EV Calculation | Expected ARR |
|------|---------------|-------------|
| Y1 | ($15,790 x 0.80) + ($67,662 x 0.55) + ($214,150 x 0.25) / 1.60 | **$67,117** |
| Y2 | ($46,000 x 0.75) + ($194,000 x 0.45) + ($626,000 x 0.20) / 1.40 | **$176,071** |
| Y3 | ($120,000 x 0.70) + ($516,000 x 0.35) + ($1,600,000 x 0.15) / 1.20 | **$420,000** |

---

## 7. Risk Factors & Confidence Adjusters

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| Ohio On Tap competes aggressively | -15% ARR | Medium | Differentiate on AI, all-breweries coverage, modern UX; pursue partnership instead |
| Ohio On Tap partners with us | +20% ARR | Low-Medium | Instant 42-60K user distribution; offer white-label trail features |
| Craft beer market contraction | -10% ARR | Medium | Ohio bucking national trend (+46 openings in 2024); diversify to wine/spirits tourism |
| Untappd adds trail features | -5% ARR | Low | Untappd historically slow to innovate regionally; our local focus is defensible |
| Multi-state execution risk | -15% Y2/Y3 ARR | Medium-High | Each state needs fresh brewery outreach; hire regional ambassadors |
| PWA adoption advantage | +10% ARR | High | No app store friction vs. competitors requiring native downloads |
| Tourism board partnerships | +15% ARR | Medium | Official endorsement accelerates trust and distribution |
| Viral brewery selfie/badge sharing | +20% ARR | Low-Medium | Instagram/TikTok shareable badges could drive organic growth |

---

## 8. Cost Structure

### Year 1 Operating Costs

| Cost | Monthly | Annual | Notes |
|------|---------|--------|-------|
| Cloudflare Workers (compute) | $5 | $60 | Workers Paid plan |
| Cloudflare D1 (database) | $5 | $60 | Included in Workers plan |
| Cloudflare R2 (storage) | $5 | $60 | 10GB free, $0.015/GB after |
| Cloudflare Workers AI | $0-20 | $0-240 | Free tier generous; pay per inference after |
| Domain (brewerytrip.com) | $1 | $12 | Already owned |
| Google Ads | $300 | $3,600 | Phase 2+ |
| Event/conference presence | $200 | $2,400 | Phase 2+ |
| Email service (newsletter) | $0-50 | $0-600 | Free tier to start |
| **Total Y1 costs** | **~$536** | **~$7,032** | |

### Margin Analysis

| Scenario | Y1 ARR | Y1 Costs | Gross Margin |
|----------|--------|----------|-------------|
| Conservative | $15,790 | $7,032 | 55% ($8,758 profit) |
| Base | $67,662 | $7,032 | 90% ($60,630 profit) |
| Optimistic | $214,150 | $7,032 | 97% ($207,118 profit) |

Infrastructure costs are near-zero thanks to Cloudflare's serverless model. The business is capital-efficient from day one.

---

## 9. Key Metrics to Track

### North Star Metrics
- **Monthly Active Users (MAU)** - primary growth metric
- **Brewery claim rate** (claimed / total listed) - B2B traction
- **Pro/Premium conversion rate** (paying / claimed) - monetization health

### Leading Indicators
| Metric | M3 Target | M6 Target | M12 Target |
|--------|-----------|-----------|------------|
| Monthly visitors | 5,000 | 15,000 | 50,000 |
| Registered users | 500 | 3,000 | 15,000 |
| Claimed breweries | 25 | 75 | 150 |
| Paying breweries | 0 | 15 | 38 |
| Newsletter subscribers | 500 | 2,000 | 8,000 |
| Ratings submitted | 200 | 1,500 | 8,000 |
| Itineraries created | 100 | 800 | 5,000 |
| PWA installs | 50 | 500 | 3,000 |

### Engagement Metrics
- Sessions per user per month
- Breweries visited per user (check-ins)
- Itinerary completion rate (% who visit all stops)
- Rating-to-visit ratio
- Newsletter open rate (target: 35%+)
- Newsletter click rate (target: 5%+)

---

## 10. Competitive Intelligence Sources

All data in this document was sourced from:

- [Brewers Association 2024 Industry Figures](https://www.brewersassociation.org/association-news/brewers-association-reports-2024-u-s-craft-brewing-industry-figures/)
- [Ohio Craft Beer $1.29B Impact](https://www.craftbrewingbusiness.com/featured/ohios-craft-beer-industry-delivers-1-29-billion-economic-impact-in-2024/)
- [U.S. Beer Tourism Market - Grand View Research](https://www.grandviewresearch.com/horizon/outlook/beer-tourism-market/united-states)
- [Untappd Wikipedia](https://en.wikipedia.org/wiki/Untappd)
- [Untappd Recappd 2025](https://www.nextglass.co/news/untappd-recappd-2025/)
- [Next Glass / PSG Portfolio](https://psgequity.com/portfolio/next-glass)
- [UTFB Price Increase Analysis](https://www.beermenus.com/blog/312-untappd-for-business-price-increase)
- [BeerMenus Pricing](https://www.beermenus.com/pricing)
- [Evergreen/TapHunter](https://www.evergreenhq.com/story/)
- [Taplist.io vs Untappd](https://taplist.io/compare/untappd-for-business-alternative)
- [Ohio On Tap App](https://ohiocraftbeer.org/app/)
- [Cleveland Brewery Passport 2025](https://www.wkyc.com/article/news/local/cleveland/cleveland-brewery-passport-2025-46-breweries-prizes/95-75245ff7-5c26-4483-a9a6-c344a417097d)
- [Hop Passport](https://www.hoppassport.com/)
- [LoyalBrew](https://www.loyalbrew.com/)
- [Yelp 2024 Results](https://www.yelp-ir.com/news/press-releases/news-release-details/2025/Growth-in-Services-Drove-Yelps-2024-Results/)
- [Eventbrite Pricing](https://www.eventcube.io/blog/eventbrite-fees-pricing-explained)
- [SaaS Freemium Conversion Rates](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/)
- [Newsletter Sponsorship Costs](https://www.beehiiv.com/blog/newsletter-sponsorship-cost)
- [Beer Affiliate Programs](https://uppromote.com/affiliate-programs/beer/)
- [PWA Statistics 2024](https://magenest.com/en/pwa-statistics/)
- [Craft Beer & Brewing Media Kit](https://mediakit.beerandbrewing.com/)
- [Taproom Spending Trends](https://www.secrethopper.com/secret-blogger/food-2025)
