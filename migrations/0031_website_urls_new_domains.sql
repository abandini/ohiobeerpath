-- Website links for 35 listings whose listed domain now redirects to a different domain that is the same brewery.
-- Source: link sweep of 2026-11-22 (class CROSS-DOMAIN (SAME BREWERY), 42 rows). Each new address was fetched on 2026-11-22 with
-- User-Agent "BreweryTripBot/1.0 (+https://brewerytrip.com/about)". A row is accepted only when the brewery's name is in the title or
-- page text AND the directory row's city or street appears on the site; the evidence line below gives the page and a short excerpt.
-- The current website_url of every row was re-read from the database on 2026-11-22 (SELECT) and is pinned in each WHERE clause.
-- Rollback: each comment line gives the previous value; set website_url back to it (the WHERE of the reverse is id AND the new value).
-- Review notes: 896 is listed as "Alltech's Lexington Brewing"; its own site brands itself Lexington Brewing & Distilling Co.
-- (the same Alltech brewery in Lexington, not a successor). 612 Paw Paw and 896 print a street that differs from the directory:
-- only the link changes here; the addresses are separate review tasks. 1163 Oakbrook's location evidence is the page's map data,
-- not printed text. The coordinator re-fetched all 35 new addresses on 2026-11-22: the brewery name was on 34 pages (896 as noted).

-- 103 Endeavor Brewing Company (Columbus, OH). Previous: 'http://www.endeavorbrewingco.com'
--   Evidence (title: Endeavor Brewing and Spirits): https://www.endeavorbrewing.com/ :: "Endeavor is proud to be Columbus, Ohio’s first brewstillery."
UPDATE breweries SET website_url = 'https://www.endeavorbrewing.com/' WHERE id = 103 AND website_url = 'http://www.endeavorbrewingco.com';
-- 117 Findlay Brewing Company (Findlay, OH). Previous: 'http://www.findlaybrewingcompany.com'
--   Evidence (title: Findlay Brewing Co.): https://www.findlaybrewing.com/ :: "213 E. Crawford St. Findlay, Ohio 45840"
UPDATE breweries SET website_url = 'https://www.findlaybrewing.com/' WHERE id = 117 AND website_url = 'http://www.findlaybrewingcompany.com';
-- 139 Grove City Brewing Company (Grove City, OH). Previous: 'http://www.grovecitybrewingcompany.com'
--   Evidence (title: Grove City Brewing Company And Plum Run Winery): https://grovecitybrewery.com/ :: "3946 Broadway, Grove City, Ohio | 614.991.0338"
UPDATE breweries SET website_url = 'https://grovecitybrewery.com/' WHERE id = 139 AND website_url = 'http://www.grovecitybrewingcompany.com';
-- 175 Inside The Five Brewing (Perrysburg, OH). Previous: 'http://www.insidethefive.com'
--   Evidence (title: Inside the Five Brewing Co.; one site for all its taprooms): https://www.insidethefivebrewing.com/perrysburg :: "127 w. third Street, perrysburg, Oh 43551"
UPDATE breweries SET website_url = 'https://www.insidethefivebrewing.com/' WHERE id = 175 AND website_url = 'http://www.insidethefive.com';
-- 176 Inside The Five Brewing (Sylvania, OH). Previous: 'http://www.insidethefive.com'
--   Evidence (title: Inside the Five Brewing Co.; one site for all its taprooms): https://www.insidethefivebrewing.com/sylvania :: "5703 Main Street, Sylvania, Oh 43560"
UPDATE breweries SET website_url = 'https://www.insidethefivebrewing.com/' WHERE id = 176 AND website_url = 'http://www.insidethefive.com';
-- 201 MadTree Brewing Company (Cincinnati, OH). Previous: 'http://www.madtreebrewing.com'
--   Evidence (title: MadTree Brewing | Cincinnati Brewery, Taprooms, and Restaurants): https://madtree.com/about/contact-us/ :: "Oakley Taproom Address 3301 Madison Road Cincinnati, OH 45209"
UPDATE breweries SET website_url = 'https://madtree.com/' WHERE id = 201 AND website_url = 'http://www.madtreebrewing.com';
-- 226 Municipal Brew Works (Hamilton, OH). Previous: 'http://municipalbrewworks.com'
--   Evidence (title: Municipal Brew Works): https://www.municipal.beer/ :: "in the historic Fredrick Mueller building in downtown Hamilton, Ohio our taproom is open 7 days a week"
UPDATE breweries SET website_url = 'https://www.municipal.beer/' WHERE id = 226 AND website_url = 'http://municipalbrewworks.com';
-- 227 Muskellunge Brewing Company (Canton, OH). Previous: 'http://www.muskybrewco.com'
--   Evidence (title: Home » Muskellunge Brewing Company): https://muskellungebrewingcompany.com/ :: "Welcome to Muskellunge Brewing Company IN THE CANTON ARTS DISTRICT! 425 5th St. NW Canton, OH 44702"
UPDATE breweries SET website_url = 'https://muskellungebrewingcompany.com/' WHERE id = 227 AND website_url = 'http://www.muskybrewco.com';
-- 294 Sons of Toil Brewing (Mount Orab, OH). Previous: 'http://www.sonsoftoilllc.com/'
--   Evidence (page title and heading): https://www.sonsoftoilbrewing.com/ :: "Sons of Toil Brewing, Mount Orab, Ohio"
UPDATE breweries SET website_url = 'https://www.sonsoftoilbrewing.com/' WHERE id = 294 AND website_url = 'http://www.sonsoftoilllc.com/';
-- 312 Third Eye Brewing Company (Sharonville, OH). Previous: 'http://www.thirdeyebrewingcompany.com'
--   Evidence (title: Third Eye Brewing Company (nav lists a Sharonville taproom; no street text read)): https://thirdeyebrewingco.com/ :: "Taprooms Sharonville Hamilton"
UPDATE breweries SET website_url = 'https://thirdeyebrewingco.com/' WHERE id = 312 AND website_url = 'http://www.thirdeyebrewingcompany.com';
-- 414 Brewery Becker (Brighton, MI). Previous: 'http://www.brauereibecker.us'
--   Evidence (title: Brewery Becker): https://brewerybecker.com/ :: "CONTACT 500 W Main St, Brighton, MI 48116"
UPDATE breweries SET website_url = 'https://brewerybecker.com/' WHERE id = 414 AND website_url = 'http://www.brauereibecker.us';
-- 435 CJs Brewing Co (Commerce Township, MI). Previous: 'http://www.cjsbrewingcompany.com'
--   Evidence (page text: "CJ's Brewing Co"; page has no <title>): https://cjsbrewery.com/ :: "8115 Richardson Road, Commerce Twp., MI 48390"
UPDATE breweries SET website_url = 'https://cjsbrewery.com/' WHERE id = 435 AND website_url = 'http://www.cjsbrewingcompany.com';
-- 474 Fenton Winery & Brewery (Fenton, MI). Previous: 'http://www.fentonwinery.com'
--   Evidence (title: Fenton Winery & Brewery/Dream Machine Distillery): https://www.fentonbrewery.com/ :: "Fenton Winery & Brewery 1370 N Long Lake Rd Fenton Twp, MI 48430"
UPDATE breweries SET website_url = 'https://www.fentonbrewery.com/' WHERE id = 474 AND website_url = 'http://www.fentonwinery.com';
-- 487 Four Leaf Brewing (Clare, MI). Previous: 'http://www.fourleafcraftbeer.com'
--   Evidence (title: Four Leaf Brewing Craft Beer | Clare, MI): https://www.fourleafbrewing.com/ :: "412 N McEwan St Clare, MI 48617"
UPDATE breweries SET website_url = 'https://www.fourleafbrewing.com/' WHERE id = 487 AND website_url = 'http://www.fourleafcraftbeer.com';
-- 541 Keweenaw Brewing Co (Houghton, MI). Previous: 'http://www.keweenawbrewing.com'
--   Evidence (title: Keweenaw Brewing Company): https://kbc.beer/ :: "We’re located in the center of Downtown Houghton on the north side of Shelden Ave. (US-41)."
UPDATE breweries SET website_url = 'https://kbc.beer/' WHERE id = 541 AND website_url = 'http://www.keweenawbrewing.com';
-- 542 Keweenaw Brewing Co - Production Facility (Houghton, MI). Previous: 'http://www.keweenawbrewing.com'
--   Evidence (title: Keweenaw Brewing Company; same address as 541, production facility has no separate site): https://kbc.beer/ :: "We’re located in the center of Downtown Houghton on the north side of Shelden Ave. (US-41)."
UPDATE breweries SET website_url = 'https://kbc.beer/' WHERE id = 542 AND website_url = 'http://www.keweenawbrewing.com';
-- 588 North Peak Brewing Co (Traverse City, MI). Previous: 'http://www.northpeak.net'
--   Evidence (title: North Peak Brewing Company): https://www.northpeakbeer.com/home :: "VISIT 400 W Front Street, Traverse City, Michigan"
UPDATE breweries SET website_url = 'https://www.northpeakbeer.com/' WHERE id = 588 AND website_url = 'http://www.northpeak.net';
-- 612 Paw Paw Brewing Company (Paw Paw, MI). Previous: 'http://pawpawbrewery.com'
--   Evidence (ADDRESS DIFFERS from directory (929 E Michigan Ave); city matches. Possible move, left for a human): https://pawpawbrewing.com/ :: "Paw Paw Brewing Company 780 South Gremps Street, Paw Paw, Michigan 49079"
UPDATE breweries SET website_url = 'https://pawpawbrewing.com/' WHERE id = 612 AND website_url = 'http://pawpawbrewery.com';
-- 628 Redwood Brewing Co (Flint, MI). Previous: 'http://www.redwoodbrewingco.com'
--   Evidence (title: Brewery - Award-Winning Beer Since 1996 | Redwood; brewery page kept as the link path): https://redwoodflint.com/brewery :: "Visit 5304 Gateway Centre Drive Flint , MI 48507"
UPDATE breweries SET website_url = 'https://redwoodflint.com/brewery' WHERE id = 628 AND website_url = 'http://www.redwoodbrewingco.com';
-- 638 Round Barn Brewery / Round Barn Winery (Baroda, MI). Previous: 'http://www.roundbarnwinery.com'
--   Evidence (title: Round Barn | Winery, Brewery & Distillery): https://roundbarn.com/home :: "Round Barn Winery & Estate in Baroda is where it all began"
UPDATE breweries SET website_url = 'https://roundbarn.com/' WHERE id = 638 AND website_url = 'http://www.roundbarnwinery.com';
-- 643 Rustic Leaf Brewing Company (Waterford, MI). Previous: 'http://www.rusticleafbrewingcompany.com'
--   Evidence (title: Home - Rustic Leaf Brewing Company): https://rusticleafbrewing.com/contact-page/ :: "Rustic Leaf Brewing Company is located at 7200 Highland Road, Waterford, MI."
UPDATE breweries SET website_url = 'https://rusticleafbrewing.com/' WHERE id = 643 AND website_url = 'http://www.rusticleafbrewingcompany.com';
-- 661 St Ambrose Cellars (Beulah, MI). Previous: 'http://www.stambrose-mead-wine.com'
--   Evidence (page title (street not printed in text I could read)): https://www.stambrosecellars.com/ :: "St. Ambrose Cellars | Meadery & Brewery in Beulah, MI"
UPDATE breweries SET website_url = 'https://www.stambrosecellars.com/' WHERE id = 661 AND website_url = 'http://www.stambrose-mead-wine.com';
-- 818 Metazoa Brewing Co. (Indianapolis, IN). Previous: 'http://www.metazoa.beer'
--   Evidence (title: Metazoa Brewing Co. | Indianapolis Indiana): https://www.metazoabrewing.com/about-us :: "140 South College Ave. Indianapolis, IN 46202"
UPDATE breweries SET website_url = 'https://www.metazoabrewing.com/' WHERE id = 818 AND website_url = 'http://www.metazoa.beer';
-- 829 Oaken Barrel Brewing Co (Greenwood, IN). Previous: 'http://www.oakenbarrel.com'
--   Evidence (title: Oaken Barrel Brewing Co): https://oakenbarrelbrewing.com/ :: "50 AIRPORT PKWY, GREENWOOD, IN 46143"
UPDATE breweries SET website_url = 'https://oakenbarrelbrewing.com/' WHERE id = 829 AND website_url = 'http://www.oakenbarrel.com';
-- 862 The Guardian Brewing Company (Muncie, IN). Previous: 'http://www.theguardianbrewingco.com'
--   Evidence (title: Home | The Guardian Brewing Co.): https://guardian.beer/ :: "We are located in the MadJax MakerSpace at 514 E Jackson St., Muncie, IN."
UPDATE breweries SET website_url = 'https://guardian.beer/' WHERE id = 862 AND website_url = 'http://www.theguardianbrewingco.com';
-- 878 Upland Brewing Co - Bloomington Brewpub (Bloomington, IN). Previous: 'http://www.uplandbeer.com'
--   Evidence (title: Upland Brewing Co.): https://uplandbrewing.com/ :: "Bloomington Brewpub — 350 W 11th St, Bloomington, IN 47404"
UPDATE breweries SET website_url = 'https://uplandbrewing.com/' WHERE id = 878 AND website_url = 'http://www.uplandbeer.com';
-- 896 Alltech's Lexington Brewing (Lexington, KY). Previous: 'http://www.Kentuckyale.com'
--   Evidence (title: Lexington Brewing & Distilling Co. ADDRESS DIFFERS from directory (475 Angliana Ave); city matches, left for a human to check the street): https://lexingtonbrewingco.com/ :: "401 Cross Street, Lexington, KY 40508"
UPDATE breweries SET website_url = 'https://lexingtonbrewingco.com/' WHERE id = 896 AND website_url = 'http://www.Kentuckyale.com';
-- 987 Bonn Place Brewing (Bethlehem, PA). Previous: 'http://www.bonnbrewing.com'
--   Evidence (title: Bonn Place Brewing Company): https://bonnplace.com/ :: "Bonn Place Brewing 310 Taylor St Bethlehem, PA 18015"
UPDATE breweries SET website_url = 'https://bonnplace.com/' WHERE id = 987 AND website_url = 'http://www.bonnbrewing.com';
-- 1009 Center Square Brewing / Altland House (Abbottstown, PA). Previous: 'http://centersquarebrew.com'
--   Evidence (page title): https://www.centersquarebrewing.com/ :: "Center Square Brewing in Abbottstown top of page 1 Center Square | Abbottstown PA"
UPDATE breweries SET website_url = 'https://www.centersquarebrewing.com/' WHERE id = 1009 AND website_url = 'http://centersquarebrew.com';
-- 1086 Hitchhiker Brewing Co. (Pittsburgh, PA). Previous: 'http://www.hitchhikerbrewing.com'
--   Evidence (title: Hitchhiker Brewing Co. | HOME; home page shows a "Mt. Lebanon Tap Room" tab but no street in readable text; address read from the site's own events calendar feed): https://hitchhiker.beer/events/?ical=1 :: "LOCATION:Hitchhiker Mt. Lebanon, 190 Castle Shannon Blvd, Pittsburgh, PA, 15228"
UPDATE breweries SET website_url = 'https://hitchhiker.beer/' WHERE id = 1086 AND website_url = 'http://www.hitchhikerbrewing.com';
-- 1163 Oakbrook Brewing Company (Reading, PA). Previous: 'http://www.oakbrookbrew.com'
--   Evidence (title: Oakbrook Brewing | Craft Beer Bliss; address is in the map block, not printed text): https://oakbrookbrewing.com/ :: "628 Park Ave, Reading, PA 19611" (map address in the page data; Apple Maps link daddr=628+park+ave+reading+pa)
UPDATE breweries SET website_url = 'https://oakbrookbrewing.com/' WHERE id = 1163 AND website_url = 'http://www.oakbrookbrew.com';
-- 1230 Sterling Pig Brewery (Media, PA). Previous: 'http://www.sterlingpigbrewery.com'
--   Evidence (title: Welcome to the Sterling Pig Brewery!): https://sterlingpig.com/location/ :: "Sterling Pig Brewery Address 609 W State St Media, PA 19063"
UPDATE breweries SET website_url = 'https://sterlingpig.com/' WHERE id = 1230 AND website_url = 'http://www.sterlingpigbrewery.com';
-- 1313 Greenbrier Valley Brewing Co (Maxwelton, WV). Previous: 'http://www.gvbeer.com'
--   Evidence (title: Home - Greenbrier Valley Brewing Company): https://gvbc.beer/ :: "Our Location: 862 Industrial Park Rd A, Maxwelton, WV 24957"
UPDATE breweries SET website_url = 'https://gvbc.beer/' WHERE id = 1313 AND website_url = 'http://www.gvbeer.com';
-- 2382 MadTree Brewing (Cincinnati, OH). Previous: 'http://www.madtreebrewing.com'
--   Evidence (title: MadTree Brewing | Cincinnati Brewery, Taprooms, and Restaurants): https://madtree.com/about/contact-us/ :: "Oakley Taproom Address 3301 Madison Road Cincinnati, OH 45209"
UPDATE breweries SET website_url = 'https://madtree.com/' WHERE id = 2382 AND website_url = 'http://www.madtreebrewing.com';
-- 2460 Wiedemann Brewing Co, LLC (Cincinnati, OH). Previous: 'http://www.wiedemannbeer.com'
--   Evidence (title: Wiedemann's Brewery & Taproom): https://wiedemannsfinebeer.com/ :: "4811 Vine Street, Cincinnati, OH 45217"
UPDATE breweries SET website_url = 'https://wiedemannsfinebeer.com/' WHERE id = 2460 AND website_url = 'http://www.wiedemannbeer.com';

-- REJECTED (left unchanged; 7 rows):
--   91 Devil’s Kettle Brewing (Athens, OH), still 'http://www.devilskettlebrewing.com': devilskettlebrew.com page text was only "© 2016 Devil's Kettle Brewing, LLC"; no city or street, so nothing to match. Unchanged.
--   648 Schmohz Brewery (Grand Rapids, MI), still 'http://www.schmohz.com': The redirect lands on 11ebb54.netsolhost.com, a hosting-provider address, not the brewery's own domain. The page does print "2600 PATTERSON AVE SE GRAND RAPIDS MI" and is Schmohz, but the host is a temporary/shared address; schmohz.com still reaches it. Unchanged.
--   726 Workshop Brewing Co (Traverse City, MI), still 'http://www.traversecityworkshop.com': workshopbrewing.co returned only the words "Workshop Brewing Company"; no Traverse City or street readable. Unchanged.
--   1095 Intercourse Brewing Co (Collegeville, PA), still 'http://www.intercoursebrewingco.com': intercoursebrewingcompany.com ("Brewed in or around Intercourse, PA") never mentions Collegeville or 4166 Ironbridge Dr; the location is not shown to be this brewery. Unchanged.
--   1114 Koehler Brewing Co (Grove City, PA), still 'http://koehlerbrewingcompany.com': koehlerbeer.com (23 pages read) never mentions Grove City or 231 Park St; it is a brand site. Unchanged.
--   1193 Rock God Brewing Company (Danville, PA), still 'http://rockgodbeer.com': rockgodbeer.net returned only the words "Rock God Brewing Co. Website"; no Danville or street. Unchanged.
--   2383 MadTree Brewing 2.0 (Cincinnati, OH), still 'http://www.madtreebrewing.com': madtree.com lists Oakley Taproom, Alcove (OTR) and Parks & Rec; it does not mention 5164 Kennedy Ave or "2.0". Only the city matches, not enough for a separate facility. Unchanged.
-- No site refused an automated request (all returned HTTP 200 to the honest user agent).
-- Needs a human: 612 (Paw Paw) and 896 (Lexington) were accepted on name + city, but the site prints a different street than the directory.
