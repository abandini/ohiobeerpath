-- Corrected website links for listings that are operating but whose listed link was dead, parked or hijacked (tier D of the
-- status triangulation of 2026-11-22). A research agent proposed each address; the coordinator re-fetched every one the same day
-- and accepted it only when the page names the brewery AND its town, has no spam text, and differs from the current value.
-- Rollback: the previous value is in each WHERE clause (NULL where the hijacked link had already been removed).
-- Left out by eye: 549 Lake Superior Brewing (the proposed page was a tourism site, not the brewery's own).
-- 26 Biker Brewhouse (Austintown): was 'http://www.bikerbrewhouse.com'
UPDATE breweries SET website_url = 'https://www.bikerbrewhouse.net/' WHERE id = 26 AND website_url = 'http://www.bikerbrewhouse.com';
-- 86 Darkroom Brewing Company (Geneva): was 'https://www.darkroombrewing.com'
UPDATE breweries SET website_url = 'https://www.darkroombrewingco.com/' WHERE id = 86 AND website_url = 'https://www.darkroombrewing.com';
-- 112 Fifth Street Brewpub (Dayton): was 'http://Fifthstreetbrewpub.coop'
UPDATE breweries SET website_url = 'https://www.fifthstreetbrewpub.com/' WHERE id = 112 AND website_url = 'http://Fifthstreetbrewpub.coop';
-- 153 Hocking Hills Brewing Company (Logan): was 'https://hockinghillsbrewing.com'
UPDATE breweries SET website_url = 'https://www.hockinghillsbrewingco.com/' WHERE id = 153 AND website_url = 'https://hockinghillsbrewing.com';
-- 247 Old Dog Alehouse & Brewery (Delaware): was 'https://www.olddogalehouse.com/menu'
UPDATE breweries SET website_url = 'https://olddogalehouse.com/' WHERE id = 247 AND website_url = 'https://www.olddogalehouse.com/menu';
-- 265 Ramblin' Red's Brewing (Wauseon): was 'http://www.northriverbrewingco.com'
UPDATE breweries SET website_url = 'https://www.redramblercoffee.com/' WHERE id = 265 AND website_url = 'http://www.northriverbrewingco.com';
-- 336 Warped Wing Brewery & Smokery - Huber Heights (Huber Heights): was 'https://warpedwing.com/huber-heights'
UPDATE breweries SET website_url = 'https://warpedwing.com/huberheights/' WHERE id = 336 AND website_url = 'https://warpedwing.com/huber-heights';
-- 457 EagleMonk Pub and Brewery (Lansing): was 'https://eaglemonkpub.com'
UPDATE breweries SET website_url = 'https://www.eaglemonkbrewing.com/' WHERE id = 457 AND website_url = 'https://eaglemonkpub.com';
-- 545 Kuhnhenn Brewing Co (Warren): was 'http://www.kuhnhenn.beer'
UPDATE breweries SET website_url = 'https://www.kbrewery.com/' WHERE id = 545 AND website_url = 'http://www.kuhnhenn.beer';
-- 626 Red Jacket Brewing at Michigan House Cafe (Calumet): was 'http://www.michiganhousecafe.com/brewpub.html'
UPDATE breweries SET website_url = 'https://www.michiganhousecafe.com/' WHERE id = 626 AND website_url = 'http://www.michiganhousecafe.com/brewpub.html';
-- 627 Redline Brewing Company (Burton): was 'http://redlinebrewingcompany.com'
UPDATE breweries SET website_url = 'https://www.therealredline.com/' WHERE id = 627 AND website_url = 'http://redlinebrewingcompany.com';
-- 701 Transient Artisan Ales (Bridgman): was 'https://transientales.com'
UPDATE breweries SET website_url = 'https://transientartisanales.com/' WHERE id = 701 AND website_url = 'https://transientales.com';
-- 707 TwoGuys Brewing (Wyoming): was 'http://www.twoguysbrewing.beer'
UPDATE breweries SET website_url = 'https://twoguys-brewing.com/' WHERE id = 707 AND website_url = 'http://www.twoguysbrewing.beer';
-- 725 Woodward Avenue Brewers (Ferndale): was 'http://www.thewabsite.com'
UPDATE breweries SET website_url = 'http://www.thewabferndale.com/' WHERE id = 725 AND website_url = 'http://www.thewabsite.com';
-- 748 Bloomington Brewing Co (Bloomington): was 'http://www.bbcbloomington.com'
UPDATE breweries SET website_url = 'https://www.bloomingtonbrew.com/' WHERE id = 748 AND website_url = 'http://www.bbcbloomington.com';
-- 749 Bloomington Brewing Co - Production Facility (Bloomington): was 'http://www.bbcbloomington.com'
UPDATE breweries SET website_url = 'https://www.bloomingtonbrew.com/' WHERE id = 749 AND website_url = 'http://www.bbcbloomington.com';
-- 852 St. Joseph Brewery & Public House (Indianapolis): was 'http://www.saintjoseph.beer.com'
UPDATE breweries SET website_url = 'https://www.saintjoseph.beer/' WHERE id = 852 AND website_url = 'http://www.saintjoseph.beer.com';
-- 908 Darkness Brewing (Bellevue): was None
UPDATE breweries SET website_url = 'https://www.darknessbrewing.com/' WHERE id = 908 AND website_url IS NULL;
-- 932 Monnik Beer Company (Louisville): was 'https://monnikbeerco.com'
UPDATE breweries SET website_url = 'https://www.monnikbeer.com/' WHERE id = 932 AND website_url = 'https://monnikbeerco.com';
-- 970 Battlefield Brew Works (Gettysburg): was None
UPDATE breweries SET website_url = 'https://www.battlefieldbreworks.com/' WHERE id = 970 AND website_url IS NULL;
-- 981 Bloom Brew (West Newton): was 'http://www.bloombrew.com'
UPDATE breweries SET website_url = 'https://bloombrew.beer/' WHERE id = 981 AND website_url = 'http://www.bloombrew.com';
-- 1053 Elk Creek Cafe + Aleworks (Millheim): was 'http://www.elkcreekcafe.net'
UPDATE breweries SET website_url = 'https://elkcreekcafe.com/' WHERE id = 1053 AND website_url = 'http://www.elkcreekcafe.net';
-- 1159 Nimble Hill Brewing Co (Tunkhannock): was 'http://www.nimblehillbrewingcompany.com'
UPDATE breweries SET website_url = 'https://www.nimblehillbrewing.com/' WHERE id = 1159 AND website_url = 'http://www.nimblehillbrewingcompany.com';
-- 2419 Ramblin Reds Brewing Company (Wauseon): was 'http://www.northriverbrewingco.com'
UPDATE breweries SET website_url = 'https://www.redramblercoffee.com/' WHERE id = 2419 AND website_url = 'http://www.northriverbrewingco.com';
-- 2422 Rivals Sports Grille (Middleburg Heights): was 'http://www.rivalscleveland.com'
UPDATE breweries SET website_url = 'https://www.rivals-cleveland.com/' WHERE id = 2422 AND website_url = 'http://www.rivalscleveland.com';
