-- 195 listings retired after a three-signal check on 2026-11-22. For each: (1) Google Maps place status read through the
-- Gemini API (an internal check; nothing from Google Maps is published), (2) the listed website's state in a sweep of every
-- link the same day, (3) a published source whose quoted words the coordinator's own fetch found on the page that day.
-- Rule: Maps says permanently closed and the source reports or announces the closing or the replacement; or Maps has no
-- listing, the source says it closed, and the brewery has no working site of its own. Ambiguous cases (paused, sold,
-- moved, one location of several without a location-specific source) are NOT here; 67 are held (42 by the coordinator's
-- reading, 25 more named by the outside reviewer: a directory label with no Maps listing, former-occupancy wording, sales,
-- fires, indefinite shutdowns) in
-- research_notes/brewerytrip status triangulation 2026-11-22/tierA_final.json in the domain-hub folder.
-- closed_at is the review date, as in 0021/0029: the real dates are in the sources. The page stays, with a closed notice.
-- Rollback for the whole file: UPDATE breweries SET closed_at = NULL WHERE closed_at = '2026-11-22' AND id IN (<the ids below>);
-- Line format: id name (town, state) | Maps: status | website: class | source URL :: quote
-- 18 Bad Tom Smith Brewing (Cincinnati, OH) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://whatnow.com/news/restaurants/well-known-cincinnati-brewery-to-close-after-more-than-a-decade-in-the-community :: "Bad Tom Smith Brewery will be closing the Madisonville location effective midnight, January 31st"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 18 AND name = 'Bad Tom Smith Brewing' AND closed_at IS NULL;
-- 29 Black Frog Brewery (Holland, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.clevescene.com/food-drink/black-frog-brewery-in-midtown-has-closed-pearls-kitchen-taking-over/ :: "Black Frog owner Chris Harris closed the 10-year-old Holland brewery as well."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 29 AND name = 'Black Frog Brewery' AND closed_at IS NULL;
-- 42 Brew Kettle - Mentor (Mentor, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://mentorlocalbuzz.com/mentor-ohio-news/brew-kettle-mentor-closes-el-palenque-planned :: "The Brew Kettle Tavern has closed its Mentor location at 7850 Mentor Avenue, next to Great Lakes Mall."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 42 AND name = 'Brew Kettle - Mentor' AND closed_at IS NULL;
-- 43 BrewDog Cincinnati (Cincinnati, OH) | Maps: NOT_FOUND | website: NOWEB | https://www.yahoo.com/news/brewdogs-cincinnati-location-closing-heres-041017598.html :: "BrewDog Cincinnati shared that it's permanently closed in a social media post Monday"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 43 AND name = 'BrewDog Cincinnati' AND closed_at IS NULL;
-- 45 BrewDog Franklinton (Columbus, OH) | Maps: NOT_FOUND | website: NOWEB | https://myfox28columbus.com/news/local/brewdog-closes-two-columbus-locations :: "In simultaneous Facebook announcements, the locations in Franklinton and the Short North said they were closing."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 45 AND name = 'BrewDog Franklinton' AND closed_at IS NULL;
-- 67 Catawba Island Brewing Company (Port Clinton, OH) | Maps: NOT_FOUND | website: REFUSED | https://ohiocraftbeer.org/new-life-for-an-old-fave/ :: "the brewery abruptly shut their doors a few months ago"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 67 AND name = 'Catawba Island Brewing Company' AND closed_at IS NULL;
-- 104 Entropy Brewing Co (Miamisburg, OH) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://www.whio.com/news/local/local-family-friendly-brew-pub-announces-closure/B7BMAYYAIRHF3JENKFW7TSGXPE :: "Entropy Brewing Co., located on South Main Street in Miamisburg, shared on social media that it will be closing its doors on Dec. 27."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 104 AND name = 'Entropy Brewing Co' AND closed_at IS NULL;
-- 149 Hi-Wire Brewing (Cincinnati, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://mmamckinney.com/cincinnati-breweries/closed-cincinnati-breweries/hi-wire-brewing-cincinnati :: "The Hi-Wire Cincinnati space closed in June 2025 and was taken over by Braxton Brewing Company"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 149 AND name = 'Hi-Wire Brewing' AND closed_at IS NULL;
-- 166 Hoster Brewing (Columbus, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://614now.com/2026/food-drink/historical-columbus-brewery-announces-closure :: "Hoster Brewing Company announced on September 23 that its brewery, located at 653 N. James Rd., will cease operations after October 31"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 166 AND name = 'Hoster Brewing' AND closed_at IS NULL;
-- 167 Humble Monk Brewing Co (Cincinnati, OH) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://www.wlwt.com/article/northside-brewery-humble-monk-closing-down/63805670 :: "A Northside brewery says that it will be going out of business."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 167 AND name = 'Humble Monk Brewing Co' AND closed_at IS NULL;
-- 193 Listermann Brewing Company (Cincinnati, OH) | Maps: NOT_FOUND | website: REFUSED | https://www.wlwt.com/article/listermann-brewing-company-announces-closure/65796778 :: "Tomorrow, Saturday, August 16th, will be our final day of operations"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 193 AND name = 'Listermann Brewing Company' AND closed_at IS NULL;
-- 252 Outerbelt Brewing (Carroll, OH) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://614now.com/2026/food-drink/after-seven-years-central-ohio-brewery-announces-closure :: "Outerbelt Brewing announced that it plans to close its doors for good in early October"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 252 AND name = 'Outerbelt Brewing' AND closed_at IS NULL;
-- 276 Royal Docks Brewing Co. Tied House (Cleveland, OH) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://www.yahoo.com/news/articles/once-booming-royal-docks-brewing-232123271.html :: "The Cleveland location closed in May 2025 after only about six months in operation."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 276 AND name = 'Royal Docks Brewing Co. Tied House' AND closed_at IS NULL;
-- 277 Royal Docks Brewing Co. (Canton, OH) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://www.yahoo.com/news/articles/once-booming-royal-docks-brewing-232123271.html :: "Then in June, both the original Royal Docks location at 7162 Fulton Drive NW and the Oakwood Square location closed."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 277 AND name = 'Royal Docks Brewing Co.' AND closed_at IS NULL;
-- 306 Taft’s Brewpourium Taproom & Apizza (Cincinnati, OH) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://www.wlwt.com/article/taft-brewporium-cincinnati-closes/63301439 :: "Taft's Brewing Company closed down its Cincinnati Brewporium on Sunday, the last pub still being operated by the company."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 306 AND name = 'Taft’s Brewpourium Taproom & Apizza' AND closed_at IS NULL;
-- 307 Tailspin Brewing Company (Coldwater, OH) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://www.limaohio.com/top-stories/2025/03/19/local-breweries-face-challenges-issues-range-from-rising-costs-to-effects-of-a-1974-state-law :: "Tailspin Brewing Co., announced via its Facebook page Monday, March 3 that operations are expected to shut down around May 2025"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 307 AND name = 'Tailspin Brewing Company' AND closed_at IS NULL;
-- 320 Trek Brewing Company (Newark, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://614now.com/2026/food-drink/columbus-area-craft-brewery-closing-after-8-years :: "Trek Brewing is closing its doors on July 12"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 320 AND name = 'Trek Brewing Company' AND closed_at IS NULL;
-- 323 Two Bandits Brewing Company (Hicksville, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.twobanditsbrewing.com/brewpub-closing-nov-26/ :: "Wednesday, November 26 will be the final day of service at our Hicksville brewpub."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 323 AND name = 'Two Bandits Brewing Company' AND closed_at IS NULL;
-- 344 Woodburn Brewing (Cincinnati, OH) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://3cre.com/media/new-tenant-former-woodburn-space/ :: "Woodburn never reopened, and the building was listed for sale in June 2025."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 344 AND name = 'Woodburn Brewing' AND closed_at IS NULL;
-- 346 Working Class Brewery (Cleveland, OH) | Maps: NOT_FOUND | website: UNSURE | https://www.clevescene.com/food-drink/working-class-brewery-in-kamms-corners-has-closed/ :: "Working Class Brewery in Kamm’s Corners Has Closed"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 346 AND name = 'Working Class Brewery' AND closed_at IS NULL;
-- 365 Arcadia Brewing Co (Kalamazoo, MI) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://www.brewbound.com/news/arcadia-brewing-ceases-operations-at-kalamazoo-production-facility/ :: "Arcadia Brewing Ceases Operations at Kalamazoo Production Facility"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 365 AND name = 'Arcadia Brewing Co' AND closed_at IS NULL;
-- 368 Ascension Brewing Company (Novi, MI) | Maps: CLOSED_PERMANENTLY | website: PARKED | https://www.clickondetroit.com/news/local/2024/10/04/popular-metro-detroit-brewery-to-close-after-9-years :: "Ascension Brewing, which has been open in Novi for nearly a decade, says Oct. 6 will be its last day in business."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 368 AND name = 'Ascension Brewing Company' AND closed_at IS NULL;
-- 370 Atwater Grand Rapids (Grand Rapids, MI) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://attractionsgrandrapids.com/news/which-grand-rapids-breweries-have-closed :: "Atwater's Grand Rapids taproom closed in July 2026, when the brand was sold without that location."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 370 AND name = 'Atwater Grand Rapids' AND closed_at IS NULL;
-- 373 Axle Brewing Company (Ferndale, MI) | Maps: NOT_FOUND | website: HIJACKED | https://ferndaleradio.com/axle-brewing-closing-taproom-on-june-30/ :: "Axle Brewing Closing Taproom on June 30"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 373 AND name = 'Axle Brewing Company' AND closed_at IS NULL;
-- 378 Barn Brewers (Lawton, MI) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://longshipbrewingcompany.com/ :: "Upon the decision of Barn Brewers to close in August of 2022, Longship Brewing Company purchased the brewery building and equipment at 114 N Main St"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 378 AND name = 'Barn Brewers' AND closed_at IS NULL;
-- 380 Bastone Brewery (Royal Oak, MI) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://patch.com/michigan/royaloak/well-know-royal-oak-brewery-closes-new-restaurant-opening-space :: "Jolly Pumpkin, which opened in August 2017 in the former Bastone Brewery and Vinotecca Wine Bar, announced Sunday it was closing for good"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 380 AND name = 'Bastone Brewery' AND closed_at IS NULL;
-- 392 Big Boiler Brewing (Lowell, MI) | Maps: CLOSED_PERMANENTLY | website: PARKED | https://lowellsfirstlook.com/big-boiler-to-close-reopen-as-hop-hog/ :: "Sunday, June 23, is expected to be the final day for Big Boiler Brewing"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 392 AND name = 'Big Boiler Brewing' AND closed_at IS NULL;
-- 393 Big Cat Brewing Company (Cedar, MI) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://www.9and10news.com/2020/05/13/big-cat-brewing-company-in-cedar-not-reopening/ :: "Big Cat Brewing Company in Cedar has announced that after 14 years in business it will not reopen"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 393 AND name = 'Big Cat Brewing Company' AND closed_at IS NULL;
-- 401 Black Lotus Brewing Co (Clawson, MI) | Maps: NOT_FOUND | website: DEAD | https://www.clickondetroit.com/news/2019/10/31/black-lotus-brewing-co-in-clawson-closing-after-13-years/ :: "Black Lotus Brewing Co. in Clawson closing after 13 years"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 401 AND name = 'Black Lotus Brewing Co' AND closed_at IS NULL;
-- 407 Blue Tractor Brewing Co (Ann Arbor, MI) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://www.wxyz.com/news/slows-bbq-to-open-location-in-ann-arbor-very-soon :: "It's in the former home of Blue Tractor BBQ, which recently announced it was closing."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 407 AND name = 'Blue Tractor Brewing Co' AND closed_at IS NULL;
-- 408 Boatyard Brewing Co (Kalamazoo, MI) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://wkfr.com/boatyard-brewing-to-close-august-31st/ :: "Boatyard Brewing announced today it will be ending operations on East Patterson Street, and closing on August 31st."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 408 AND name = 'Boatyard Brewing Co' AND closed_at IS NULL;
-- 410 Bravo! Restaurant & Cafe (Portage, MI) | Maps: NOT_FOUND | website: REFUSED | https://wkzo.com/2020/05/05/bravo-restaurant-and-cafe-permanently-closing-down-in-portage/1014687/ :: "we have come to the difficult decision to permanently close Bravo! Restaurant and Cafe"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 410 AND name = 'Bravo! Restaurant & Cafe' AND closed_at IS NULL;
-- 411 Brew Detroit (Detroit, MI) | Maps: CLOSED_PERMANENTLY | website: OK | https://fox2detroit.com/news/brew-detroit-closing-taproom-shifting-focus-production-distribution :: "According to the business, the last day will be Jan. 31, and Brew Detroit is planning a party that day."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 411 AND name = 'Brew Detroit' AND closed_at IS NULL;
-- 416 Brewery Ferment (Traverse City, MI) | Maps: NOT_FOUND | website: DEAD | https://www.traverseticker.com/news/new-restaurant-from-georginas-owner-tuscan-bistro-for-sale-edson-farms-expanding/ :: "CraftHouse TC – previously known as Brewery Ferment until a rebrand last year – has closed its doors at 511 Union Street."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 416 AND name = 'Brewery Ferment' AND closed_at IS NULL;
-- 420 Brickside Brewery (Copper Harbor, MI) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://skidaup.com/best-breweries-near-up-ski-resorts/ :: "Unfortunately, Brickside Brewery has closed as of September 2025"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 420 AND name = 'Brickside Brewery' AND closed_at IS NULL;
-- 421 Brite Eyes Brewing Co (Kalamazoo, MI) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://wkfr.com/ixp/690/p/former-bright-eyes-brewery-in-kalamazoo-being-bought-leveled-by-the-city :: "A Facebook post was made announcing the closure of Brite Eyes Brewing Co."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 421 AND name = 'Brite Eyes Brewing Co' AND closed_at IS NULL;
-- 429 Cellar Brewing Co (Sparta, MI) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://grbreweries.com/cellar-brewing-co :: "Cellar Brewing Co *CLOSED formerly Michigan Beer Cellar is a microbrewery, small winery, and artisan distillery located in Sparta, MI."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 429 AND name = 'Cellar Brewing Co' AND closed_at IS NULL;
-- 430 Cellarmen's Meadery, Microbrewery and Cidery (Hazel Park, MI) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://detroit.eater.com/2019/7/10/20689159/cellarmens-closing-hazel-park-beer-cider-mead :: "will serve its last pint on Saturday, July 27"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 430 AND name = 'Cellarmen''s Meadery, Microbrewery and Cidery' AND closed_at IS NULL;
-- 432 Chelsea Alehouse Brewery (Chelsea, MI) | Maps: NOT_FOUND | website: DEAD | https://www.fox2detroit.com/news/chelsea-alehouse-brewery-closing-after-11-years :: "The Chelsea Alehouse Brewery plans to close its doors next month."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 432 AND name = 'Chelsea Alehouse Brewery' AND closed_at IS NULL;
-- 447 Creston Brewery (Grand Rapids, MI) | Maps: CLOSED_PERMANENTLY | website: UNSURE | https://www.wgvunews.org/news/2025-03-04/saugatuck-brewing-company-closes-grand-rapids-and-kalamazoo-taprooms :: "Saugatuck Brewing Company announced the closure of its Creston Brewery effective immediately."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 447 AND name = 'Creston Brewery' AND closed_at IS NULL;
-- 456 Draught Horse Brewery (New Hudson, MI) | Maps: CLOSED_PERMANENTLY | website: OK | https://kissfmdetroit.com/2025/09/08/oakland-countys-draught-horse-brewery-closing-down-september-13-new-owner-taking-over-with-restaurant-brewery-plans/ :: "Oakland County’s Draught Horse Brewery Closing Down September 13, New Owner Taking Over With Restaurant-Brewery Plans"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 456 AND name = 'Draught Horse Brewery' AND closed_at IS NULL;
-- 460 East West Brewing Co (Grand Rapids, MI) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://grbreweries.com/east-west-brewing :: "East West Brewing CLOSED is located in Eastown at 1400 Lake Dr. SE"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 460 AND name = 'East West Brewing Co' AND closed_at IS NULL;
-- 465 Elk Brewing Co (Comstock Park, MI) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://www.fox2detroit.com/news/elk-brewing-announces-closure-of-comstock-park-taproom-beer-specials-available-for-last-week :: "Elk Brewing Co. announced that its Comstock Park taproom is permanently closing after this week."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 465 AND name = 'Elk Brewing Co' AND closed_at IS NULL;
-- 469 Eternity Brewing Co (Howell, MI) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://patch.com/michigan/brighton/southeast-mi-brewery-closing-down-month :: "Eternity Brewing Company, located along Grand River Avenue in Howell, will shut down for good after June."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 469 AND name = 'Eternity Brewing Co' AND closed_at IS NULL;
-- 470 Exferimentation Brewing Company (Pontiac, MI) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://www.metrotimes.com/food-drink/pontiacs-exferimentation-brewing-co-closes-after-5-years-of-unconventional-craft-beer-28895958 :: "Exferimentation Brewing Co. in Pontiac announced they are closing for good in a Facebook post this week."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 470 AND name = 'Exferimentation Brewing Company' AND closed_at IS NULL;
-- 480 Final Gravity Brewing Company (Kalamazoo, MI) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.fox2detroit.com/news/final-gravity-brewing-announces-closure-of-kalamazoo-taproom :: "Final Gravity Brewing Co. said it is closing its Kalamazoo Taproom"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 480 AND name = 'Final Gravity Brewing Company' AND closed_at IS NULL;
-- 482 Fort Street Brewery (Lincoln Park, MI) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.americancraftbeer.com/michigans-fort-street-brewery-to-close/ :: "Lincoln Park’s Fort Street Brewery will be shutting its doors at the end of the month"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 482 AND name = 'Fort Street Brewery' AND closed_at IS NULL;
-- 489 Gallery Brewery (Portland, MI) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://www.brewbound.com/news/distressed-breweries-close-used-equipment-heads-auction/ :: "The Gallery Brewery in Portland, Michigan, and Portner Brewhouse in Alexandria, Virginia. Both small beer companies closed over the summer."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 489 AND name = 'Gallery Brewery' AND closed_at IS NULL;
-- 495 Grand Rapids Brewing Company (Grand Rapids, MI) | Maps: NOT_FOUND | website: OK | https://www.fox17online.com/news/local-news/kent/grand-rapids-brewing-company-to-permanently-close-after-11-years :: "Grand Rapids Brewing Company has announced it’s permanently closing its doors after 11 years."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 495 AND name = 'Grand Rapids Brewing Company' AND closed_at IS NULL;
-- 496 Grand River Brewery (Jackson, MI) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://wrkr.com/grand-river-brewing-closing-jackson/ :: "Grand River Brewing in Jackson will be closing for good."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 496 AND name = 'Grand River Brewery' AND closed_at IS NULL;
-- 499 Granite City Food & Brewery (Detroit, MI) | Maps: NOT_FOUND | website: NOWEB | https://www.wxyz.com/news/granite-city-closes-detroit-location-at-renaissance-center :: "Granite City Food & Brewery inside the Renaissance Center in downtown Detroit has closed."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 499 AND name = 'Granite City Food & Brewery' AND closed_at IS NULL;
-- 506 Greenbush Annex (Sawyer, MI) | Maps: NOT_FOUND | website: NOWEB | https://www.greenbushbrewing.com/new-page-2 :: "Is the Annex next to the Taproom open for business? Unfortunately, nope. That was another death due to the pandemic."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 506 AND name = 'Greenbush Annex' AND closed_at IS NULL;
-- 513 Harmony Brewing Company - Harmony Hall (Grand Rapids, MI) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://www.fox17online.com/news/local-news/grand-rapids/harmony-brewing-company-closes-doors-of-harmony-hall :: "Harmony Hall, the hub of the brewing company's business, is about to close its doors after seven years of service on Bridge Street"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 513 AND name = 'Harmony Brewing Company - Harmony Hall' AND closed_at IS NULL;
-- 519 Hereford and Hops Steakhouse and Brewpub (Escanaba, MI) | Maps: CLOSED_PERMANENTLY | website: OK | https://herefordandhops.com/ :: "Hereford and Hops is permanently closed as of Saturday, October 3rd, 2026."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 519 AND name = 'Hereford and Hops Steakhouse and Brewpub' AND closed_at IS NULL;
-- 520 Hideout Brewing Co (Grand Rapids, MI) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://wgrd.com/grand-rapids-hideout-brewing-company-to-close/ :: "After 13 years in business, a brewery in Northeast Grand Rapids is closing after St. Patrick's Day."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 520 AND name = 'Hideout Brewing Co' AND closed_at IS NULL;
-- 534 Jamex Brewing Co (Saint Clair Shores, MI) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://www.clickondetroit.com/news/local/2024/08/14/macomb-county-brewery-to-close-at-the-end-of-august/ :: "Jamex Brewing Co. announced the closure on social media on Aug."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 534 AND name = 'Jamex Brewing Co' AND closed_at IS NULL;
-- 548 Lake Charlevoix Brewing Company (Charlevoix, MI) | Maps: NOT_FOUND | website: DEAD | https://www.record-eagle.com/news/business/lake-charlevoix-brewing-closing/article_75130756-4827-11ea-b1c5-1fa3879885f4.html :: "The craft brewery and restaurant located at 111 Bridge Park Drive in Charlevoix is closing Feb. 8."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 548 AND name = 'Lake Charlevoix Brewing Company' AND closed_at IS NULL;
-- 554 Lexington Brewing Co (Lexington, MI) | Maps: CLOSED_PERMANENTLY | website: PARKED | https://thekeelph.com/3-north-lexington/ :: "In September 2021, they opened 3 North Lexington Taphouse & Eatery which was formerly Lexington Brewing Company and Wine House."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 554 AND name = 'Lexington Brewing Co' AND closed_at IS NULL;
-- 556 Liberty Street Brewing Production Facility (Livonia, MI) | Maps: NOT_FOUND | website: NOWEB | https://www.betterondraft.com/blogs/brewery-reviews/throwback-thursday-liberty-street-brewing :: "In 2019 the decision was made to close down the production facility and go back to just serving beer out of the taproom."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 556 AND name = 'Liberty Street Brewing Production Facility' AND closed_at IS NULL;
-- 571 MI Brewery / Kayla Rae Cellars (Rockford, MI) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://distillery.news/places/united-states/michigan/sparta/wineries/michigan-wine-cellar/ :: "Kayla Rae Cellars closed Closed Wineries 11.91 km No Reviews Address: 31 Courtland St Rockford Michigan 49341"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 571 AND name = 'MI Brewery / Kayla Rae Cellars' AND closed_at IS NULL;
-- 586 North Center Brewing Co. (Northville, MI) | Maps: CLOSED_PERMANENTLY | website: PARKED | https://www.beverage-world.com/en/newsdetail/usa-mi-north-center-brewing-co-announces-closure :: "USA, MI: North Center Brewing Co. announces closure"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 586 AND name = 'North Center Brewing Co.' AND closed_at IS NULL;
-- 590 Northern Oak Brewery (Holly, MI) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://oaklandcounty115.com/2022/09/05/reporter-food-battle-alley-brewing-company-in-holly/ :: "Battle Alley Brewing Company recently took over the space that was formerly Northern Oak Brewery"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 590 AND name = 'Northern Oak Brewery' AND closed_at IS NULL;
-- 594 Old Boys Brewhouse (Spring Lake, MI) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://andreacrossmangroup.com/blog/fall-weekends-on-spring-lake-the-2026-residents-read :: "Rolf's Barbeque at 971, which opened inside the old brewhouse footprint"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 594 AND name = 'Old Boys Brewhouse' AND closed_at IS NULL;
-- 598 Olde Peninsula Brewpub and Restaurant (Kalamazoo, MI) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://nowkalamazoo.org/2021/07/olde-peninsula-brewpub-and-restaurant-closing-after-25-years/ :: "Olde Peninsula Brewpub and Restaurant announced on its Facebook page on Thursday that after 25 years of operation it would be shutting down."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 598 AND name = 'Olde Peninsula Brewpub and Restaurant' AND closed_at IS NULL;
-- 621 Pointless Brewery (Ann Arbor, MI) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://annarborobserver.com/pointless-brewery-theatre-closes/ :: "Pointless Brewery & Theatre on Packard closed in September."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 621 AND name = 'Pointless Brewery' AND closed_at IS NULL;
-- 631 River Rouge Brewing Company (Royal Oak, MI) | Maps: NOT_FOUND | website: CROSS-DOMAIN (PARENT/OTHER) | https://www.betterondraft.com/shows/unexpected-craft-brewing-company-eddie-stencel-michiganbeer :: "Since we last spoke, River Rouge Brewing has closed and he has since opened up Unexpected Craft Brewing Company."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 631 AND name = 'River Rouge Brewing Company' AND closed_at IS NULL;
-- 635 Rochester Mills Production Brewery (Auburn Hills, MI) | Maps: CLOSED_PERMANENTLY | website: OK | https://beerme.com/brewery.php?13889= :: "Rochester Mills Production Brewery (Closed) 3275 Lapeer Road West Auburn Hills MI 48326"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 635 AND name = 'Rochester Mills Production Brewery' AND closed_at IS NULL;
-- 642 Rupert's Brew House (Kalamazoo, MI) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.americancraftbeer.com/closed-michigan-brew-house-may-reopen-as-cannabis-club/ :: "Mark Rupert, owner of the just closed Rupert’s Brew House, is hoping to open a cannabis lounge in in Kalamazoo, Michigan"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 642 AND name = 'Rupert''s Brew House' AND closed_at IS NULL;
-- 650 Shipwreck Brewing Company (Saint Clair Shores, MI) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://detroit.eater.com/2019/12/17/21005964/detroit-beer-michigan-brewery-news-2019-trends-closings-openings-lawsuits-mergers :: "In December, Dragonmead replaced short-lived taproom Shipwreck Brewing Company with Dragon’s Landing in St. Clair Shores"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 650 AND name = 'Shipwreck Brewing Company' AND closed_at IS NULL;
-- 668 Sugarfoot Saloon (Cedar, MI) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://www.leelanauticker.com/news/sugarfoot-saloon-long-loved-local-hangout-in-cedar-has-sold/ :: "since first announcing the closure of the iconic Mexican American eatery, bar and brew pub back in December 2018"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 668 AND name = 'Sugarfoot Saloon' AND closed_at IS NULL;
-- 669 Superior Coast Brewery / Karls Cuisine Winery and Brewery (Sault Sainte Marie, MI) | Maps: CLOSED_PERMANENTLY | website: PARKED | https://www.betterondraft.com/blogs/brewery-reviews/remembering-carls-cuisine-winery-and-brewery :: "Karl’s managed to last an impressive 20 years before they finally shut the business down"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 669 AND name = 'Superior Coast Brewery / Karls Cuisine Winery and Brewery' AND closed_at IS NULL;
-- 673 Tecumseh Brewing Company (Tecumseh, MI) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://patch.com/michigan/across-mi/popular-southeast-mi-brewery-closing-down-weekend :: "Tecumseh Brewing Company announced Thursday it will close Sunday after 10 years in business"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 673 AND name = 'Tecumseh Brewing Company' AND closed_at IS NULL;
-- 695 Tibbs Brewing Co (Kalamazoo, MI) | Maps: NOT_FOUND | website: HIJACKED | https://wkzo.com/2020/09/16/tibbs-brewing-company-announces-permanent-closure :: "Tibbs Brewing Company announces permanent closure"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 695 AND name = 'Tibbs Brewing Co' AND closed_at IS NULL;
-- 722 Wiltse's Brew Pub and Family Restaurant (Oscoda, MI) | Maps: NOT_FOUND | website: HIJACKED | https://www.betterondraft.com/articles/wiltses-brewpub-family-restaurant-closes-permanently :: "Oscoda’s longtime brewpub has decided to close permanently."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 722 AND name = 'Wiltse''s Brew Pub and Family Restaurant' AND closed_at IS NULL;
-- 724 Wolverine State Brewing Co (Ann Arbor, MI) | Maps: CLOSED_PERMANENTLY | website: OK | https://annarborobserver.com/in-the-works-marketplace-changes-feb-2026/ :: "The successor to Wolverine State Brewing Co., which closed last year as CEO Matt Roy headed toward retirement, has been announced."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 724 AND name = 'Wolverine State Brewing Co' AND closed_at IS NULL;
-- 738 Barley Island Brewing Co (Noblesville, IN) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://www.yahoo.com/news/barley-island-noblesville-one-indianas-162338601.html :: "The bar and restaurant at 639 Conner St. announced in a Facebook post its last day would be July 23 when its lease nears expiration."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 738 AND name = 'Barley Island Brewing Co' AND closed_at IS NULL;
-- 744 Black Acre Brewing Co (Indianapolis, IN) | Maps: NOT_FOUND | website: HIJACKED | https://www.ibj.com/articles/black-acre-brewing-co-to-close-all-locations :: "Black Acre Brewing Co., a beer maker closely identified with the Irvington neighborhood during the past decade, is going out of business."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 744 AND name = 'Black Acre Brewing Co' AND closed_at IS NULL;
-- 746 Black Swan Brewpub (Plainfield, IN) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://indianaontap.com/the-time-for-a-new-brewpub-in-plainfield-is-nigh/ :: "Nigh Brewpub will come to fruition on the spot of the old Black Swan Brewpub, where DJ McAlister had served his food and beer for the past decade."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 746 AND name = 'Black Swan Brewpub' AND closed_at IS NULL;
-- 754 Brugge Brasserie (Indianapolis, IN) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.ibj.com/articles/broad-ripples-brugge-restaurant-shuts-down-permanently :: "Co-owner Ted Miller initially posted on Facebook that the restaurant at 1011 E. Westfield Blvd. would close as of Friday"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 754 AND name = 'Brugge Brasserie' AND closed_at IS NULL;
-- 760 Carson's Brewery (Evansville, IN) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://www.brewbound.com/breweries/carsons-brewery :: "Carson's Brewery Evansville · IN · Production - Micro Out of business"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 760 AND name = 'Carson''s Brewery' AND closed_at IS NULL;
-- 782 Figure Eight Brewing Co (Valparaiso, IN) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://www.brewbound.com/breweries/figure-eight-brewing-co :: "Figure Eight Brewing Company Valparaiso · IN Out of business"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 782 AND name = 'Figure Eight Brewing Co' AND closed_at IS NULL;
-- 788 Four Fathers Brewing (Valparaiso, IN) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://somuchbeersolittletime.food.blog/ :: "Four Fathers in Valparaiso closed their doors the same weekend as Dark Lord Day"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 788 AND name = 'Four Fathers Brewing' AND closed_at IS NULL;
-- 794 Granite City Food & Brewery (Indianapolis, IN) | Maps: NOT_FOUND | website: NOWEB | https://www.ibj.com/articles/granite-city-closes-carmel-location :: "has closed its last remaining Indianapolis-area location, at 150 W. 96 th St. in Carmel."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 794 AND name = 'Granite City Food & Brewery' AND closed_at IS NULL;
-- 796 Granite City Food & Brewery (#26) (Mishawaka, IN) | Maps: NOT_FOUND | website: REFUSED | https://www.abc57.com/news/sign-on-door-says-mishawaka-s-granite-city-brewery-has-permanently-closed :: "Sign on door says Mishawaka’s Granite City Brewery has permanently closed"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 796 AND name = 'Granite City Food & Brewery (#26)' AND closed_at IS NULL;
-- 798 Great Crescent Brewery (Aurora, IN) | Maps: CLOSED_PERMANENTLY | website: UNSURE | https://www.eaglecountryonline.com/news/local-news/holtkamp-winery-owners-purchase-great-crescent-brewery :: "Great Crescent Brewery permanently closed their doors in Aurora."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 798 AND name = 'Great Crescent Brewery' AND closed_at IS NULL;
-- 807 Indiana City Brewing (Indianapolis, IN) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://www.ibj.com/articles/indiana-city-brewing-co-announces-final-business-day-for-tap-room :: "Saturday is planned to be the final day for business at Indiana City Brewing Co."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 807 AND name = 'Indiana City Brewing' AND closed_at IS NULL;
-- 809 Junk Ditch Brewing Company (Fort Wayne, IN) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://www.21alivenews.com/2024/10/29/junk-ditch-brewing-company-cease-operations-november/ :: "Leaders say its final day of operations will be Saturday, Nov. 23"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 809 AND name = 'Junk Ditch Brewing Company' AND closed_at IS NULL;
-- 810 Lafayette Brewing Co (Lafayette, IN) | Maps: CLOSED_PERMANENTLY | website: UNSURE | http://lafbrew.com/ :: "Lafayette Brewing Co will be closing our doors at the end of business on Saturday, December 20, 2025."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 810 AND name = 'Lafayette Brewing Co' AND closed_at IS NULL;
-- 822 New Albanian Bank Street Brewhouse (New Albany, IN) | Maps: NOT_FOUND | website: OK | https://www.insideindianabusiness.com/articles/brewery-plans-to-leave-downtown-new-albany :: "The New Albanian Brewing Co. is leaving downtown New Albany. The location’s last day of operation will be May 25."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 822 AND name = 'New Albanian Bank Street Brewhouse' AND closed_at IS NULL;
-- 838 Quaff On Brewing (Nashville, IN) | Maps: CLOSED_PERMANENTLY | website: OK | https://quaffon.com/blog/qon-sk-pressrelease-june2026 :: "Quaff ON!’s Nashville production brewery is winding down operations."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 838 AND name = 'Quaff On Brewing' AND closed_at IS NULL;
-- 842 Redemption Alewerks (Indianapolis, IN) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://www.ibj.com/articles/fishers-brewpub-joins-surge-in-eateries-permanently-closing-doors :: "The owners of Fishers-based Redemption Alewerks have decided to permanently close the 6-year-old brewpub."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 842 AND name = 'Redemption Alewerks' AND closed_at IS NULL;
-- 850 St John Malt Brothers Brewing (Saint John, IN) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://www.beeronaut.com/2024/07/24/this-weekend-with-beer/ :: "Malt Brothers Brewing in Saint John, IN have closed their doors, making a terse announcement on their socials"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 850 AND name = 'St John Malt Brothers Brewing' AND closed_at IS NULL;
-- 854 Summit City Brwerks (Fort Wayne, IN) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://wowo.com/night-drive-brewing-company-brings-retro-futuristic-atmosphere-to-fort-wayne/ :: "Night Drive Brewing Company is opening in the former Summit City Brewerks building, which closed in August 2024."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 854 AND name = 'Summit City Brwerks' AND closed_at IS NULL;
-- 858 Switchyard Brewing Company (Bloomington, IN) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://www.idsnews.com/article/2024/01/switchyard-pizza-kitchen-brewing-closes-sunday :: "Switchyard Pizza Kitchen and Brewing closes Sunday, Jan. 14 after over five years of business."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 858 AND name = 'Switchyard Brewing Company' AND closed_at IS NULL;
-- 866 Thr3e Wise Men Brewing Co (Indianapolis, IN) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://www.ibj.com/articles/sun-king-brewery-to-open-broad-ripple-taproom-at-former-thr3e-wise-men-site :: "The Thr3e Wise Men location, part of the fading Scotty’s Brewhouse chain, shut down June 9"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 866 AND name = 'Thr3e Wise Men Brewing Co' AND closed_at IS NULL;
-- 869 Tin Man Brewing Company (Evansville, IN) | Maps: CLOSED_PERMANENTLY | website: UNSURE | https://townepost.com/indiana/kokomo/sun-king-kokomo/ :: "the company closed down its Evansville operations in 2018"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 869 AND name = 'Tin Man Brewing Company' AND closed_at IS NULL;
-- 873 Trubble Brewing (Fort Wayne, IN) | Maps: NOT_FOUND | website: OK | https://www.thelocalfw.com/feb-6-2024-free/ :: "owner Chad Hankee has officially decided not to re-open"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 873 AND name = 'Trubble Brewing' AND closed_at IS NULL;
-- 879 Wabash Brewing (Indianapolis, IN) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://www.ibj.com/articles/wabash-brewing-to-end-8-year-run-as-beer-maker :: "Small-batch beer maker Wabash Brewing LLC announced Tuesday its plans to close permanently"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 879 AND name = 'Wabash Brewing' AND closed_at IS NULL;
-- 885 Windmill Brewing (Dyer, IN) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://www.audacy.com/wbbm780/news/local/windmill-brewing-in-indiana-home-of-luther-the-cat-closing :: "The owners of Windmill Brewing in Dyer have decided to close their tap room on June 29"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 885 AND name = 'Windmill Brewing' AND closed_at IS NULL;
-- 898 Beer Engine (Danville, KY) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://beerme.com/brewery.php?12092= :: "Beer Engine (Closed) 107 Larrimore Lane Danville KY 40422-1674 [Update] Notes Opened: 2011 Closed: 2019"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 898 AND name = 'Beer Engine' AND closed_at IS NULL;
-- 901 Bluegrass Brewing Co - Brewpub (Louisville, KY) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://foodanddine.com/the-hits-just-keep-coming-bluegrass-brewing-co-expires-after-32-years :: "Bluegrass Brewing Co. has shut its doors, with a sign on the door at 300 W. Main St."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 901 AND name = 'Bluegrass Brewing Co - Brewpub' AND closed_at IS NULL;
-- 903 Braxton Labs (Bellevue, KY) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://linknky.com/business/2022/01/14/party-source-announces-new-house-bourbon-bar/ :: "Braxton Labs announced that is closing its Newport taproom"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 903 AND name = 'Braxton Labs' AND closed_at IS NULL;
-- 907 Cumberland Brewery (Louisville, KY) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.wlky.com/article/longtime-highlands-brewery-closing-but-another-familiar-name-is-swooping-in/29355121 :: "Cumberland Brewery, located at 1527 Bardstown Road, is shutting down on Oct. 5."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 907 AND name = 'Cumberland Brewery' AND closed_at IS NULL;
-- 915 Goodwood Brewing Co (Louisville, KY) | Maps: NOT_FOUND | website: REFUSED | https://www.yahoo.com/news/articles/troubled-ky-brewpub-gone-taken-124156391.html :: "The Whiskey Row and NuLu operations were closed."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 915 AND name = 'Goodwood Brewing Co' AND closed_at IS NULL;
-- 916 Gordon Biersch Brewery Restaurant - Louisville (Louisville, KY) | Maps: NOT_FOUND | website: DEAD | https://leoweekly.com/issue-archives/jun-20-jul-3-2025/ :: "Gordon Biersch Brewery Restaurant at Fourth Street Live! has closed permanently after 13 years."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 916 AND name = 'Gordon Biersch Brewery Restaurant - Louisville' AND closed_at IS NULL;
-- 925 Jarfly Brewing Co (Somerset, KY) | Maps: CLOSED_PERMANENTLY | website: UNSURE | https://www.yahoo.com/news/stroud-reflects-jarflys-legacy-announcement-035900625.html :: "following an announcement made on Facebook that the craft beer microbrewery would be closing at month"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 925 AND name = 'Jarfly Brewing Co' AND closed_at IS NULL;
-- 927 Life Brewpub (Lexington, KY) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://closeddownrestaurants.com/lexington-kentucky-restaurant-closures-and-closed-restaurants/ :: "Life Brewpub – Lexington – 2628 Richmond Rd 2628 Richmond Rd Lexington, KY 40517 Status: Closed Permanently"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 927 AND name = 'Life Brewpub' AND closed_at IS NULL;
-- 935 Pivot Brewing Company (Lexington, KY) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://www.lex18.com/news/covering-kentucky/pivot-brewing-company-announces-its-closing-on-aug-31-in-lexington-and-louisville :: "Pivot Brewing Company announces its closing on Aug. 31 in Lexington and Louisville"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 935 AND name = 'Pivot Brewing Company' AND closed_at IS NULL;
-- 938 St Arnulf Alery (Cadiz, KY) | Maps: NOT_FOUND | website: NOWEB | https://www.pastemagazine.com/drink/craft-beer/the-unbelievable-story-of-stephen-foster-craft-bee :: "to open a brewery named St. Arnulf Alery, which is now (unsurprisingly) defunct."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 938 AND name = 'St Arnulf Alery' AND closed_at IS NULL;
-- 951 412 Brews (Mc Kees Rocks, PA) | Maps: CLOSED_PERMANENTLY | website: UNSURE | https://breweriesinpa.com/late-addition-brewing-blending-to-take-over-former-412-brewing-location/ :: "Late Addition Brewing & Blending is taking over the former 412 Brewing location."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 951 AND name = '412 Brews' AND closed_at IS NULL;
-- 960 Appalachian Brewing Co - Harrisburg (Harrisburg, PA) | Maps: CLOSED_PERMANENTLY | website: OK | https://abcbrew.com/harrisburg :: "The Appalachian Brewing Company's original Harrisburg brewpub at 50 N. Cameron St. closed permanently in July 2025"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 960 AND name = 'Appalachian Brewing Co - Harrisburg' AND closed_at IS NULL;
-- 964 Aston Abbey Brewing Co (Aston, PA) | Maps: CLOSED_PERMANENTLY | website: PARKED | https://breweriesinpa.com/aston-abbey-brewing-company-is-closing/ :: "Aston Abbey Brewing Company (Aston, PA) is closing on December 29th, 2019"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 964 AND name = 'Aston Abbey Brewing Co' AND closed_at IS NULL;
-- 966 Aurochs Brewing Company (Pittsburgh, PA) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://thebeerthrillers.com/2024/11/01/aurochs-brewing-company-will-cease-operations-by-end-of-2024/ :: "Aurochs Brewing Company located at 8321 Ohio River Blvd, Emsworth, PA 15202 will be ceasing operations by the end of 2024"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 966 AND name = 'Aurochs Brewing Company' AND closed_at IS NULL;
-- 979 Black Forest Brewery (Ephrata, PA) | Maps: CLOSED_PERMANENTLY | website: OK | https://lancasteronline.com/business/whats_in_store/new-owners-to-take-over-ephrata-s-black-forest-brewery-rebrand-as-blue-ball-brewing/article_58e978fe-3a55-4f47-907e-d1a60bf6e09e.html :: "Blue Ball Brewing Co. will open in Ephrata at the former home of Black Forest Brewery."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 979 AND name = 'Black Forest Brewery' AND closed_at IS NULL;
-- 982 Blue Canoe Brewery (Titusville, PA) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://breweriesinpa.com/blue-canoe-brewing-to-close-in-june/ :: "Blue Canoe closes its doors in Titusville this June."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 982 AND name = 'Blue Canoe Brewery' AND closed_at IS NULL;
-- 983 Blueprint Brewing Co. (Harleysville, PA) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://thebeerthrillers.com/2023/02/01/blueprint-brewing-company-announces-their-closing-on-march-31st/ :: "our doors will close for the last time to the public on 3/31/23"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 983 AND name = 'Blueprint Brewing Co.' AND closed_at IS NULL;
-- 988 Boom City Brewing (Williamsport, PA) | Maps: CLOSED_PERMANENTLY | website: UNSURE | https://www.northcentralpa.com/business/boom-city-s-owners-split-new-location-opening-down-the-street/article_756d0836-b8c6-11ef-b195-a7980ec0f9a2.html :: "announcing its final day of business would be Dec. 28"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 988 AND name = 'Boom City Brewing' AND closed_at IS NULL;
-- 989 Boxcar Brewing Co LLC (West Chester, PA) | Maps: NOT_FOUND | website: UNSURE | https://breweriesinpa.com/boxcar-brewing-company-west-chester-pa-has-closed/ :: "Boxcar Brewing Company (West Chester, PA) Has Closed"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 989 AND name = 'Boxcar Brewing Co LLC' AND closed_at IS NULL;
-- 996 Brewtus Brewing Co (Sharon, PA) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://breweriesinpa.com/brewtus-brewing-company-sharon-pa-has-closed/ :: "Brewtus Brewing Company (Sharon, PA) Has Closed"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 996 AND name = 'Brewtus Brewing Co' AND closed_at IS NULL;
-- 1007 Cave Brewing Co (Bethlehem, PA) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://breweriesinpa.com/cave-brewing-has-permanently-closed-its-bethlehem-taproom/ :: "We have PERMANENTLY CLOSED our taproom at 521 Main St in Bethlehem PA."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1007 AND name = 'Cave Brewing Co' AND closed_at IS NULL;
-- 1008 Cellar Works Brewing Co. (Sarver, PA) | Maps: CLOSED_PERMANENTLY | website: UNSURE | https://www.cbsnews.com/pittsburgh/news/cellar-works-brewing-co-in-buffalo-township-closing-with-final-service-on-saturday :: "Cellar Works Brewing Co. in Buffalo Township has announced that it will be closing and their final day of service will be on Saturday."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1008 AND name = 'Cellar Works Brewing Co.' AND closed_at IS NULL;
-- 1010 Chatty Monks Brewing Company (West Reading, PA) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.wfmz.com/news/area/berks/longtime-west-reading-brewpub-to-close-its-doors-later-this-month/article_a2a6e3b0-e410-11ef-8b67-d76c8dbd62da.html :: "The last day for Chatty Monks Pub on Penn Avenue will be February 23rd."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1010 AND name = 'Chatty Monks Brewing Company' AND closed_at IS NULL;
-- 1023 Copper Kettle Brewing Co (Pittsburgh, PA) | Maps: NOT_FOUND | website: PARKED | https://patch.com/pennsylvania/pittsburgh/last-call-popular-pittsburgh-brewpub :: "When the Copper Kettle ceased operations, the space became a location for pop-up bars"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1023 AND name = 'Copper Kettle Brewing Co' AND closed_at IS NULL;
-- 1025 Couch Brewery (Pittsburgh, PA) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://patch.com/pennsylvania/pittsburgh/popular-pittsburgh-brewpub-closing :: "Couch Brewery on Washington Boulevard in Larimer is in its last days."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1025 AND name = 'Couch Brewery' AND closed_at IS NULL;
-- 1028 Crime & Punishment Brewing Company (Philadelphia, PA) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://www.phillyvoice.com/human-robot-brewery-girard-avenue-crime-and-punishment-closed/ :: "Crime & Punishment Brewing Co., which shut down this month after a decade on Girard Avenue in Brewerytown"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1028 AND name = 'Crime & Punishment Brewing Company' AND closed_at IS NULL;
-- 1032 Crystal Ball Brewing (York, PA) | Maps: NOT_FOUND | website: DEAD | https://thebeerthrillers.com/2020/01/28/crystal-ball-closing/ :: "Crystal Ball Brewing Co. out of York, PA has shut down. Completely. Both locations."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1032 AND name = 'Crystal Ball Brewing' AND closed_at IS NULL;
-- 1048 Earth Bread + Brewery (Philadelphia, PA) | Maps: CLOSED_PERMANENTLY | website: UNSURE | https://breweriesinpa.com/earth-bread-brewery-to-close-after-13-years-in-business/ :: "the brewery will close Its doors permanently on July 1st, 2022"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1048 AND name = 'Earth Bread + Brewery' AND closed_at IS NULL;
-- 1061 Fetish Brewing Co (Lancaster, PA) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://breweriesinpa.com/fetish-brewing-to-close-cartel-brewing-expands-with-3rd-location-extended-play :: "Fetish Brewing will soon be closing its brewery and taproom"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1061 AND name = 'Fetish Brewing Co' AND closed_at IS NULL;
-- 1062 Fishtown Brewing Co (Philadelphia, PA) | Maps: NOT_FOUND | website: DEAD | https://breweriesinpa.com/details-source-brewings-fishtown-location-to-open-summer-2021/ :: "Many craft beer fans will recognize this as the old Fishtown Brewpub, which closed in November 2020"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1062 AND name = 'Fishtown Brewing Co' AND closed_at IS NULL;
-- 1068 Fury Brewing Company (Irwin, PA) | Maps: NOT_FOUND | website: DEAD | https://breweriesinpa.com/fury-brewing-company-announces-closure-citing-covid-restrictions/ :: "it breaks our hearts to announce that our last day of service will be October 31, 2021."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1068 AND name = 'Fury Brewing Company' AND closed_at IS NULL;
-- 1072 Goose Island Philadelphia (Philadelphia, PA) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://breweriesinpa.com/goose-island-closes-brewpub-in-philadelphia/ :: "Goose Island has closed their brewpub in the Fishtown neighborhood of Philadelphia."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1072 AND name = 'Goose Island Philadelphia' AND closed_at IS NULL;
-- 1074 Great Barn Brewery (New Hope, PA) | Maps: CLOSED_PERMANENTLY | website: UNSURE | https://www.newhopefreepress.com/2025/08/13/brewery-opens-new-hope-taproom :: "previously housed the Great Barn Brewery, which did not reopen after a small fire in October 2024"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1074 AND name = 'Great Barn Brewery' AND closed_at IS NULL;
-- 1078 Harty Brewing Company (Mechanicsburg, PA) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://thebeerthrillers.com/2023/10/11/high-road-brewing-company-announces-grand-opening-celebration-at-high-road-taproom-in-mechanicsburg/ :: "Harty Brewing used to be in this area, but went out of business in 2019"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1078 AND name = 'Harty Brewing Company' AND closed_at IS NULL;
-- 1088 Hollow Earth Brewing Co (Oxford, PA) | Maps: NOT_FOUND | website: DEAD | https://breweriesinpa.com/hollow-earth-to-close-oxford-brew-pub/ :: "Hollow Earth To Close Oxford Brewcafé"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1088 AND name = 'Hollow Earth Brewing Co' AND closed_at IS NULL;
-- 1091 Hop Hill Brewing Company (Bethlehem, PA) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://sauconsource.com/2025/03/30/lower-saucon-brewery-plans-to-relocate/ :: "Hop Hill Brewing announced that it will soon close earlier this month."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1091 AND name = 'Hop Hill Brewing Company' AND closed_at IS NULL;
-- 1094 Insurrection Aleworks (Heidelberg, PA) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://hikesandhops.org/2022/03/ :: "As of May 2024 Insurrection Aleworks has closed. Check out Headley’s Brewing just up the street"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1094 AND name = 'Insurrection Aleworks' AND closed_at IS NULL;
-- 1097 Iron Hill Brewery & Restaurant - Chestnut Hill (Philadelphia, PA) | Maps: NOT_FOUND | website: OK | https://www.chestnuthilllocal.com/stories/iron-hill-brewery-abruptly-closes-chestnut-hill-restaurant-location,37979? :: "Chestnut Hill residents were surprised Wednesday morning, Sept. 10, to find Iron Hill Brewery & Restaurant permanently closed."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1097 AND name = 'Iron Hill Brewery & Restaurant - Chestnut Hill' AND closed_at IS NULL;
-- 1104 Iron Hill Brewery & Restaurant (Ardmore) (Ardmore, PA) | Maps: NOT_FOUND | website: OK | https://patch.com/pennsylvania/ardmore/iron-hill-location-ardmore-closes :: "The Greenfield Avenue outpost of the popular brewpub chain has closed its doors to the public."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1104 AND name = 'Iron Hill Brewery & Restaurant (Ardmore)' AND closed_at IS NULL;
-- 1108 JoBoy's Brew Pub (Lititz, PA) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://www.beeradvocate.com/beer/profile/22459/ :: "JoBoy's Brew Pub Closed Beer Scores"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1108 AND name = 'JoBoy''s Brew Pub' AND closed_at IS NULL;
-- 1110 Kegg Brewing Company (Champion, PA) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://www.post-gazette.com/life/drinks/2020/11/12/helltown-brewing-taproom-1700-penn-ave-strip-district-fir-junction-garfield-pittsburgh/stories/202011040121 :: "Kegg Brewing Co., which opened in the fall of 2016 near Champion in the Laurel Highlands , announced that it has closed for good after it sells its remaining beer this month."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1110 AND name = 'Kegg Brewing Company' AND closed_at IS NULL;
-- 1111 Kennett Brewing Company (Kennett Square, PA) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://thebeerthrillers.com/2024/04/16/kennett-brewing-company-is-closing/ :: "It is with heavy hearts that we announce the closing of KBC just shy of our 9th birthday."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1111 AND name = 'Kennett Brewing Company' AND closed_at IS NULL;
-- 1134 Mad Princes Brewing (Buckingham, PA) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://thebeerthrillers.com/2024/07/08/mad-princes-brewing-announces-upcoming-closure/ :: "After over 8 1/2 years, Mad Princes Brewing will be ceasing operations."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1134 AND name = 'Mad Princes Brewing' AND closed_at IS NULL;
-- 1135 Mad-K Brewery (Howard, PA) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://distillery.news/places/united-states/pennsylvania/lock-haven/wineries/schaefers-winery-llc/ :: "MAD-K Brewery closed Breweries Closed 19.83 km No Reviews Address: 298 Mountain Top Rd Howard"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1135 AND name = 'Mad-K Brewery' AND closed_at IS NULL;
-- 1140 McKenzie Brew House (Glen Mills, PA) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://savvymainline.com/2024/11/26/dapper-delightful-the-jockey-tavern-giddyaps-into-malvern/ :: "The Crown Tavern in Glen Mills. All three are total makeovers of former McKenzies"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1140 AND name = 'McKenzie Brew House' AND closed_at IS NULL;
-- 1141 McKenzie Brew House (#2) (Malvern, PA) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://bucksco.today/2025/10/the-jockey-tavern/ :: "The space was previously McKenzie Brew House before its transformation into The Jockey Tavern"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1141 AND name = 'McKenzie Brew House (#2)' AND closed_at IS NULL;
-- 1146 Mindful Brewing Company (Castle Shannon, PA) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.newsbreak.com/castle-shannon-pa/3437442586369-mindful-brewing-set-to-reopen-under-new-ownership-as-chimera-brewing :: "Mindful Brewing along Library Road in Castle Shannon closed its doors in November, but new owners are set to reopen the brewery under a new name soon!"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1146 AND name = 'Mindful Brewing Company' AND closed_at IS NULL;
-- 1147 Miscreation Brewing Company (Hanover, PA) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://breweriesinpa.com/miscreation-brewing-company-announces-closure-citing-covid-restrictions/ :: "Miscreation Brewing Company (Hanover, PA) recently announced they would be closing their business in 2021"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1147 AND name = 'Miscreation Brewing Company' AND closed_at IS NULL;
-- 1152 Moss Mill Brewing (Huntingdon Valley, PA) | Maps: CLOSED_PERMANENTLY | website: UNSURE | https://breweriesinpa.com/moss-mill-brewing-closing-its-doors-in-huntingdon-valley/ :: "Moss Mill Brewing will be closing its doors in Huntingdon Valley, after serving the community for the past 5+ years. The closing date is set for Sunday, December 31st."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1152 AND name = 'Moss Mill Brewing' AND closed_at IS NULL;
-- 1170 Perkiomen Valley Brewery (Green Lane, PA) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://www.geyerauctions.com/auctions/detail/bw166948 :: "The Perkiomen Valley Brewery is closing its doors, and everything will be sold to the highest bidders in this complete business liquidation."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1170 AND name = 'Perkiomen Valley Brewery' AND closed_at IS NULL;
-- 1180 Race Street Brew Works (Clearfield, PA) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://breweriesinpa.com/race-street-brew-works-is-closing/ :: "Race Street Brew Works (Clearfield, PA) is closing on December 21st, 2019"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1180 AND name = 'Race Street Brew Works' AND closed_at IS NULL;
-- 1188 River Bend Hop Farm And Brewery (Newport, PA) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://breweriesinpa.com/river-bend-hop-farm-and-brewery-to-permanently-sighting-covid-restrictions/ :: "River Bend Hop Farm and Brewery have announced they are closing, in large part, due to COVID restrictions."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1188 AND name = 'River Bend Hop Farm And Brewery' AND closed_at IS NULL;
-- 1201 Roy Pitz Brewing Co (Chambersburg, PA) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://breweriesinpa.com/after-15-years-liquid-art-closes-brewery/ :: "The brewery formerly known as Roy Pitz Brewing announced on social media that after 15 years in business they would be calling it quits, officially closing October 8th."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1201 AND name = 'Roy Pitz Brewing Co' AND closed_at IS NULL;
-- 1205 Saint Benjamin Brewing Co (Philadelphia, PA) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://www.phillymag.com/restaurants/2019/04/15/st-benjamin-brewing-closing-kensington-philadelphia/ :: "We’re closing up shop May 4th."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1205 AND name = 'Saint Benjamin Brewing Co' AND closed_at IS NULL;
-- 1220 Something Wicked Brewing Company (Hanover, PA) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://mybeerbuzz.com/something-wicked-brewing-announces-closure-in-hanover-pa-after-10-years/ :: "Something Wicked Brewing Closing In Hanover, PA After 10 Years"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1220 AND name = 'Something Wicked Brewing Company' AND closed_at IS NULL;
-- 1234 Stone Church Pizza & Brewpub (Hermitage, PA) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://breweriesinpa.com/stone-church-pizza-house-and-brewpub-hermitage-pa-is-closing/ :: "Stone Church Pizza House and Brewpub is closing on September 3rd"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1234 AND name = 'Stone Church Pizza & Brewpub' AND closed_at IS NULL;
-- 1235 Stoudts Brewing Co (Adamstown, PA) | Maps: CLOSED_PERMANENTLY | website: UNSURE | https://www.inquirer.com/food/stoudts-beer-evil-genius-20220729.html :: "the property in Adamstown — once a popular stop for Philadelphia-area beer aficionados — became a wedding venue and complex of shops called the IronSpire Complex"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1235 AND name = 'Stoudts Brewing Co' AND closed_at IS NULL;
-- 1243 Tattered Flag Brewery (Middletown, PA) | Maps: NOT_FOUND | website: OK | https://thebeerthrillers.com/2024/10/28/tattered-flag-brewery-still-works-sold-to-california-based-tower-investments/ :: "Tattered Flag Brewery and Distillery announced their closure"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1243 AND name = 'Tattered Flag Brewery' AND closed_at IS NULL;
-- 1253 The Vegetable Hunter (Harrisburg, PA) | Maps: CLOSED_PERMANENTLY | website: PARKED | https://thebeerthrillers.com/2025/11/28/the-vegetable-hunter-is-closing-their-doors/ :: "Their final day will be on November 29th, 2025. Their Harrisburg location is at 614 N 2nd St, Harrisburg, PA 17101"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1253 AND name = 'The Vegetable Hunter' AND closed_at IS NULL;
-- 1260 Triumph Brewing Co of New Hope (New Hope, PA) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://www.triumphbrewing.com/new-hope/ :: "Triumph Brewing Company of New Hope closed permanently on March 9, 2026."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1260 AND name = 'Triumph Brewing Co of New Hope' AND closed_at IS NULL;
-- 1266 Two Rivers Brewing Co (Easton, PA) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://breweriesinpa.com/two-rivers-brewing-closing-in-easton/ :: "is closing its Easton location, with August 17th, 2025, being its last day of operation"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1266 AND name = 'Two Rivers Brewing Co' AND closed_at IS NULL;
-- 1298 Berkeley Springs Brewing Co (Berkeley Springs, WV) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.berkeleyspringsbrewingcompany.com/ :: "Final day of business May 30, 2026"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1298 AND name = 'Berkeley Springs Brewing Co' AND closed_at IS NULL;
-- 1326 Sophisticated Hound Brewing Company (Princeton, WV) | Maps: CLOSED_PERMANENTLY | website: SOCIAL | https://brilliantstream.com/2024/10/boc-hord-brewery-has-big-plans/ :: "purchased the former Sophisticated Hound Brewing location late this summer"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 1326 AND name = 'Sophisticated Hound Brewing Company' AND closed_at IS NULL;
-- 2312 16 Lots Brewing (Mason, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.wlwt.com/article/16-lots-brewing-company-mason-newport-closing/62987762 :: "16 Lots Brewing Company announced Thursday they are permanently closed."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2312 AND name = '16 Lots Brewing' AND closed_at IS NULL;
-- 2316 Bardwell Winery and Brewery (Mount Orab, OH) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://thegnarlygnome.com/bardwell/ :: "7/9/2021 – Bardwell quietly announces on their social media that they would be retiring and closing the business for good."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2316 AND name = 'Bardwell Winery and Brewery' AND closed_at IS NULL;
-- 2319 Black Cloister Brewing Co (Toledo, OH) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://nbc24.com/news/local/black-cloister-closes-doors-for-good-monday-night :: "Black Cloister ended its business on Monday night at 11 p.m."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2319 AND name = 'Black Cloister Brewing Co' AND closed_at IS NULL;
-- 2329 Brim Kitchen and Brewery (Willoughby, OH) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://www.clevescene.com/food-drink/brim-brewery-in-willoughby-to-close-this-weekend-hola-tacos-and-barroco-arepa-bar-to-open-in-space-in-early-fall-33640395/ :: "Brim’s last day of service will be Sunday, August 16."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2329 AND name = 'Brim Kitchen and Brewery' AND closed_at IS NULL;
-- 2341 DogBerry Brewing LLC (West Chester, OH) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://local12.com/news/local/craft-brewery-plans-second-location-cincinnati-alexandria-brewing-dogberry-west-chester-beer :: "Alexandria Brewing Co. is opening its second location in the former DogBerry Brewing space, at 9964 Crescent"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2341 AND name = 'DogBerry Brewing LLC' AND closed_at IS NULL;
-- 2347 Father John's Microbrewery (Bryan, OH) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://www.fox19.com/2026/02/18/father-johns-restaurant-bryan-shuts-down-abruptly-staff-discovers-closure-social-media/ :: "Father John’s Restaurant and Microbrewery has permanently closed, with the owners announcing the closure on Facebook."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2347 AND name = 'Father John''s Microbrewery' AND closed_at IS NULL;
-- 2349 Four String Brewing Company (Columbus, OH) | Maps: NOT_FOUND | website: UNSURE | https://614now.com/2019/food-drink/wolfs-ridge-tying-knot-on-former-four-string-facility :: "Four String closed suddenly last fall."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2349 AND name = 'Four String Brewing Company' AND closed_at IS NULL;
-- 2350 Four String Brewing Company - West Side Production Facility (Columbus, OH) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://patspints.com/2022/12/28/the-end-of-an-era-north-high-brewing-ends-a-10-year-run-in-the-short-north/ :: "Four String first expanded into a large production brewery and then closed abruptly in 2018. Their production facility on Hague Avenue is now operated by Wolf’s Ridge."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2350 AND name = 'Four String Brewing Company - West Side Production Facility' AND closed_at IS NULL;
-- 2363 Hoof Hearted Brewing - Brewery and Kitchen (Columbus, OH) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://breakfastwithnick.com/2024/08/23/hoof-hearted-three-bites-little-cat/ :: "Last week Hoof Hearted Brewery & Kitchen in Italian Village closed its doors."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2363 AND name = 'Hoof Hearted Brewing - Brewery and Kitchen' AND closed_at IS NULL;
-- 2365 Hoster Brewing Co (Columbus, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://614now.com/2026/food-drink/historical-columbus-brewery-announces-closure :: "Hoster Brewing Company announced on September 23 that its brewery, located at 653 N. James Rd., will cease operations after October 31"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2365 AND name = 'Hoster Brewing Co' AND closed_at IS NULL;
-- 2375 Lineage Brewing (Columbus, OH) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://614now.com/2022/food-drink/lineage-brewing-to-permanently-close-another-columbus-brewery-to-take-over-space :: "Combustion Brewery will open a second location in the former Lineage space."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2375 AND name = 'Lineage Brewing' AND closed_at IS NULL;
-- 2384 Magic City Brewing Company (Barberton, OH) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://www.cleveland19.com/2026/02/04/magic-city-brewing-company-akron-is-closing/ :: "Magic City Brewing Company in Akron announced Tuesday they are closing their doors for good on Valentine’s Day."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2384 AND name = 'Magic City Brewing Company' AND closed_at IS NULL;
-- 2398 Off Track Brewing Company (Cincinnati, OH) | Maps: CLOSED_PERMANENTLY | website: DEAD | https://mmamckinney.com/cincinnati-breweries/closed-cincinnati-breweries/off-track-brewing-co :: "Off Track Brewing Co (closed) Off Track Brewing Co 227 Stark St, OTR"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2398 AND name = 'Off Track Brewing Company' AND closed_at IS NULL;
-- 2399 Old Firehouse Brewery (Williamsburg, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://thegnarlygnome.com/historic-breweries/theoldfirehouse/ :: "September 29, 2019 – The brewery ceases operations."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2399 AND name = 'Old Firehouse Brewery' AND closed_at IS NULL;
-- 2409 Platform Beer Co Taproom (Columbus, OH) | Maps: NOT_FOUND | website: DEAD | https://www.goodbeerhunting.com/sightlines/2022/12/14/platform-beer-struggles-for-local-relevance-as-sales-plummet-in-ohio :: "Platform Beer Co. has closed its Ohio brewery and taprooms"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2409 AND name = 'Platform Beer Co Taproom' AND closed_at IS NULL;
-- 2410 Platform Cincinnati (Cincinnati, OH) | Maps: NOT_FOUND | website: NOWEB | https://www.brewbound.com/news/report-a-b-owned-platform-beer-ceases-operations-in-ohio-brand-will-live-on-as-3-ipas/ :: "The second, located in Cincinnati closed in early 2022, Good Beer Hunting reported"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2410 AND name = 'Platform Cincinnati' AND closed_at IS NULL;
-- 2412 Pretentious Barrel House (Columbus, OH) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://614now.com/2024/food-drink/after-seven-years-award-winning-columbus-craft-brewery-closing-for-good :: "Pretentious Barrel House will be closing its doors permanently next month."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2412 AND name = 'Pretentious Barrel House' AND closed_at IS NULL;
-- 2416 Queen City Brewery of Cincinnati (Cincinnati, OH) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://www.wcpo.com/entertainment/local-a-e/queen-city-brewery-in-blue-ash-retiring-its-craft-beer-crown-in-september :: "The brewery’s owners also stated they plan to officially close by the end of September, if not sooner."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2416 AND name = 'Queen City Brewery of Cincinnati' AND closed_at IS NULL;
-- 2417 R.Shea Brewing (Akron, OH) | Maps: NOT_FOUND | website: HIJACKED | https://www.news5cleveland.com/news/local-news/r-shea-brewing-announces-it-will-close-both-locations-in-akron :: "both locations, the taproom in Merriman Valley and the large Canal Place location Downtown, will shut their doors"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2417 AND name = 'R.Shea Brewing' AND closed_at IS NULL;
-- 2420 Random Precision Brewing Company (Columbus, OH) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://614now.com/2024/food-drink/columbus-craft-brewery-announces-surprise-closure :: "will close for good on Jan. 28 at 7 p.m."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2420 AND name = 'Random Precision Brewing Company' AND closed_at IS NULL;
-- 2423 Rivertown Brewing Co - Monroe Barrel House (Monroe, OH) | Maps: NOT_FOUND | website: DEAD | https://local12.com/news/local/one-of-the-tri-states-original-craft-breweries-permanently-closes-cincinnati-rivertown-brewing-barrel-house-business-courier :: "Rivertown Brewing Co., with its brewery and barrel house at 6550 Hamilton Lebanon Road in Monroe, has permanently closed"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2423 AND name = 'Rivertown Brewing Co - Monroe Barrel House' AND closed_at IS NULL;
-- 2424 Rock Bottom Brewery - Cincinnati (Cincinnati, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.wcpo.com/news/local-news/downtowns-rock-bottom-brewery-closes-amid-bankruptcy-pandemic :: "Rock Bottom Restaurant and Brewery will not reopen in Fountain Square."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2424 AND name = 'Rock Bottom Brewery - Cincinnati' AND closed_at IS NULL;
-- 2425 Rolling Mill Brewing Company (Middletown, OH) | Maps: CLOSED_PERMANENTLY | website: UNSURE | https://thegnarlygnome.com/rolling-mill/ :: "2023 – Gravel Road Brewing opens up in the former Rolling Mill Space."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2425 AND name = 'Rolling Mill Brewing Company' AND closed_at IS NULL;
-- 2426 Roobrew (Akron, OH) | Maps: NOT_FOUND | website: PARKED | https://cooperalumni.org/2024/01/barry-rosenbaum-che63/ :: "the business model was flawed and RooBrew only lasted a few years"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2426 AND name = 'Roobrew' AND closed_at IS NULL;
-- 2432 Sideswipe Brewing (Columbus, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://614now.com/2023/food-drink/after-ten-years-columbus-brewing-announces-unexpected-closure-will-be-replaced-by-new-brewery :: "Sideswipe Brewing will close its sole taproom and brewery"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2432 AND name = 'Sideswipe Brewing' AND closed_at IS NULL;
-- 2433 Smokehouse Brewing (Columbus, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://www.smokehousebrewing.com/ :: "Today is our last day. Ever. We are humbled by your messages online and in person about what we've meant to you."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2433 AND name = 'Smokehouse Brewing' AND closed_at IS NULL;
-- 2438 Taft's Ale House (Cincinnati, OH) | Maps: CLOSED_PERMANENTLY | website: NOWEB | https://www.wcpo.com/entertainment/local-a-e/new-brewpub-to-replace-former-tafts-ale-house-site-in-otr :: "Taft's closed in late 2023 after occupying the space for more than eight years."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2438 AND name = 'Taft''s Ale House' AND closed_at IS NULL;
-- 2439 Taft's Brewing Co (Cincinnati, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://thegnarlygnome.com/2024/12/tafts-sells-brand/ :: "the Cincinnati taproom (The Brewpourium) was not only closing for good – but the Taft’s Brand was sold"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2439 AND name = 'Taft''s Brewing Co' AND closed_at IS NULL;
-- 2440 Tap and Screw Brewery (Cincinnati, OH) | Maps: NOT_FOUND | website: REFUSED | https://www.wcpo.com/news/insider/status-of-tap-screw-brewery-in-madisonville-unclear :: "Tap & Screw Brewery is now closed. Thank you for your years of support."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2440 AND name = 'Tap and Screw Brewery' AND closed_at IS NULL;
-- 2450 The Woodburn Brewery (Cincinnati, OH) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://www.fox19.com/2025/07/01/hello-goodbye-these-tri-state-restaurants-bars :: "Woodburn Brewing East Walnut Hills said goodbye to its local brewery, Woodburn Brewing, following March First Brands’ spirits expansion"
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2450 AND name = 'The Woodburn Brewery' AND closed_at IS NULL;
-- 2452 Trek Brewing (Newark, OH) | Maps: CLOSED_PERMANENTLY | website: OK | https://614now.com/2026/food-drink/columbus-area-craft-brewery-closing-after-8-years :: "Trek Brewing is closing its doors on July 12. The brewery is located at 1486 Granville Rd. in Newark."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2452 AND name = 'Trek Brewing' AND closed_at IS NULL;
-- 2454 Two Monks Brewing Company (Akron, OH) | Maps: CLOSED_PERMANENTLY | website: HIJACKED | https://www.news5cleveland.com/news/local-news/akronym-brewing-marks-third-akron-brewery-to-close-in-less-than-a-year :: "Two Monks Brewing Company on Massillon Road closed at the end of 2023."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2454 AND name = 'Two Monks Brewing Company' AND closed_at IS NULL;
-- 2462 Willoughby Brewing Co (Willoughby, OH) | Maps: CLOSED_PERMANENTLY | website: REFUSED | https://www.news5cleveland.com/news/local-news/oh-lake/worth-the-wait-tricky-tortoise-brewing-company-officially-opens-at-old-willoughby-brewing-company-location :: "Years after abruptly shutting down, the former Willoughby Brewing Company finally has a new tenant."
UPDATE breweries SET closed_at = '2026-11-22' WHERE id = 2462 AND name = 'Willoughby Brewing Co' AND closed_at IS NULL;
