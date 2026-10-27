// Ohio IPA guide (/blog/ohio-ipa-breweries): ten Ohio IPAs, each named and described on its brewery's own site.
// Every published fact is a verbatim quote with its URL and the date we checked it. No beer is called a 2026 release
// unless its quote prints 2026 (none here do); otherwise the page says the brewery listed it when we checked.
// "Flagship", "year-round" and award tags appear only when a quote on the card says so. Never Facebook, Reddit,
// Nextdoor, Untappd or other social posts. Re-check with: node scripts/verify-ipa-guide.mjs
// Replaces the 2024 post 'best-ohio-ipa-breweries-2024' (301 to this slug), which had no sources.
export interface Source { quote: string; url: string; checked: string }
export interface IpaPick {
  brewery: string;
  breweryId?: number;    // brewerytrip.com/brewery/:id
  town: string;          // must appear (any case) in the `location` quote
  location: Source;      // an address or location line from the brewery's own site
  region: string;        // our grouping for the statewide list (the page says so)
  site: string;          // the brewery's own domain: every source for this beer must be on it
  beer: string;          // must appear (any case) in one of this beer's quotes
  abv?: number;          // must appear in the `specs` quote (or in `about` when it carries the ABV)
  about: Source;         // what the beer is, in the brewery's words
  identity?: Source;     // a heading or title naming the beer, when `about` doesn't
  specs?: Source;        // ABV / IBU as the brewery prints them
  availability?: Source; // the brewery's own availability wording
  award?: Source;        // an award the brewery lists on the beer's own page
  flagship?: Source;     // only when the brewery itself calls it a flagship
}
const C = '2026-10-27';
export const IPA_GUIDE = {
  slug: 'ohio-ipa-breweries',
  oldSlug: 'best-ohio-ipa-breweries-2024',
  title: 'Ohio IPA Breweries: 10 IPAs Worth the Drive (2026 Guide)',
  excerpt: 'Ten Ohio IPAs from Cleveland to Cincinnati, each described in its brewery’s own words, with a link to the page we quoted.',
  datePublished: '2026-06-05',
  dateModified: C,
  checked: C,
  regions: ['Cleveland area', 'Akron', 'Toledo area', 'Columbus', 'Dayton', 'Cincinnati'],
  picks: [
    { brewery: 'Great Lakes Brewing Co.', breweryId: 136, town: 'Cleveland', region: 'Cleveland area', site: 'greatlakesbrewing.com', beer: 'Commodore Perry® IPA', abv: 7.7,
      location: { quote: '2516 Market Ave. Cleveland Ohio 44113', url: 'https://www.greatlakesbrewing.com/commodore-perry/', checked: C },
      about: { quote: 'A British-style IPA named after the man who defeated His Majesty’s Royal Navy in the War of 1812? Consider this a bold, hoppy (and mildly ironic) plunder of war.', url: 'https://www.greatlakesbrewing.com/commodore-perry/', checked: C },
      specs: { quote: 'ABV 7.7% IBU 70', url: 'https://www.greatlakesbrewing.com/commodore-perry/', checked: C },
      availability: { quote: 'Commodore Perry® IPA Year Round', url: 'https://www.greatlakesbrewing.com/commodore-perry/', checked: C } },
    { brewery: 'Fat Head’s Brewery', breweryId: 108, town: 'Middleburg Heights', region: 'Cleveland area', site: 'fatheads.com', beer: 'Head Hunter', abv: 7.5,
      location: { quote: 'Fat Head\'s Middleburg Heights 17450 Engle Lake Dr Middleburg Heights, OH 44130', url: 'https://fatheads.com/middleburg-heights/', checked: C },
      about: { quote: 'Head Hunter is an award-winning, aggressively dry-hopped, American-Style IPA with a huge hop display of pine, grapefruit, citrus, and pineapple.', url: 'https://fatheads.com/beer/head-hunter/', checked: C },
      specs: { quote: 'Head Hunter India Pale Ale Beer Details ABV 7.5% IBU 75', url: 'https://fatheads.com/beer/head-hunter/', checked: C },
      award: { quote: 'Gold Award World Beer Cup 2023 Gold Medal Great American Beer Festival 2023', url: 'https://fatheads.com/beer/head-hunter/', checked: C } },
    { brewery: 'Market Garden Brewery', breweryId: 207, town: 'Cleveland', region: 'Cleveland area', site: 'marketgardenbrewery.com', beer: 'Citramax IPA', abv: 7.4,
      location: { quote: '1947 West 25th Street Cleveland, OH. 44113', url: 'https://www.marketgardenbrewery.com/beer', checked: C },
      about: { quote: 'CITRAMAX IPA 7.4% ABV Description West Coast style IPA dry-hopped with citra hops to impart intense tropical and citrus fruit aromas.', url: 'https://www.marketgardenbrewery.com/beer', checked: C } },
    { brewery: 'Hoppin’ Frog Brewery', breweryId: 163, town: 'Akron', region: 'Akron', site: 'hoppinfrog.com', beer: 'Gangster Frog IPA', abv: 7.5,
      location: { quote: '1680 East Waterloo Rd. Akron, OH 44306', url: 'https://hoppinfrog.com/beer/gangster-frog-ipa/', checked: C },
      identity: { quote: 'Gangster Frog IPA | Hoppin’ Frog', url: 'https://hoppinfrog.com/beer/gangster-frog-ipa/', checked: C },
      about: { quote: 'Crisp and satisfying American I.P.A. with a skillfully assertive American hop aroma and flavor.', url: 'https://hoppinfrog.com/beer/gangster-frog-ipa/', checked: C },
      specs: { quote: 'ABV 7.5%', url: 'https://hoppinfrog.com/beer/gangster-frog-ipa/', checked: C },
      availability: { quote: 'Availability Seasonal', url: 'https://hoppinfrog.com/beer/gangster-frog-ipa/', checked: C } },
    { brewery: 'Inside The Five Brewing', breweryId: 175, town: 'Perrysburg', region: 'Toledo area', site: 'insidethefivebrewing.com', beer: 'The Devil Wears Hoodies', abv: 6.6,
      location: { quote: 'visit itf perrysburg 127 w. third Street, perrysburg, Oh 43551', url: 'https://www.insidethefivebrewing.com/perrysburg', checked: C },
      flagship: { quote: 'it5 flagship beers The Devil Wears Hoodies New England Style IPA', url: 'https://www.insidethefivebrewing.com/our-beers', checked: C },
      about: { quote: 'This IPA is intentionally cloudy, mysterious, and just a little shady. Extreme juicy hop flavor and aroma will take over your senses with very little bitterness.', url: 'https://www.insidethefivebrewing.com/our-beers', checked: C },
      specs: { quote: 'The Devil Wears Hoodies New England Style IPA ( India Pale Ale) JUICY | TROPICAL | HAZY 6.6% ALC/VOL 32 IBUs', url: 'https://www.insidethefivebrewing.com/our-beers', checked: C },
      award: { quote: 'we must have squeezed all the hops flat... 2022 OHIO BREWERS CUP GOLD MEDAL WINNER', url: 'https://www.insidethefivebrewing.com/our-beers', checked: C } },
    { brewery: 'Columbus Brewing Co.', breweryId: 2338, town: 'Columbus', region: 'Columbus', site: 'columbusbrewing.com', beer: 'Bodhi', abv: 8.3,
      location: { quote: '2555 Harrison Rd. Columbus, OH 43204', url: 'https://columbusbrewing.com/beer/bodhi/', checked: C },
      about: { quote: 'Big, bold tropical aromas abound with notes of mango, grapefruit, pineapple and citrus.', url: 'https://columbusbrewing.com/beer/bodhi/', checked: C },
      specs: { quote: 'Bodhi Double IPA ABV 8.3% IBU 65', url: 'https://columbusbrewing.com/beer/bodhi/', checked: C },
      availability: { quote: 'Availability Year-round', url: 'https://columbusbrewing.com/beer/bodhi/', checked: C },
      award: { quote: '2014 Bronze Medal Winner - GABF.', url: 'https://columbusbrewing.com/beer/bodhi/', checked: C } },
    { brewery: 'Land-Grant Brewing Co.', breweryId: 188, town: 'Columbus', region: 'Columbus', site: 'landgrantbrewing.com', beer: 'Something Hoppy', abv: 7.2,
      location: { quote: '424 W. Town Street Columbus, Ohio 43215', url: 'https://landgrantbrewing.com/project/something-hoppy/', checked: C },
      identity: { quote: 'SOMETHING HOPPY WEST COAST IPA', url: 'https://landgrantbrewing.com/project/something-hoppy/', checked: C },
      about: { quote: 'This Hoppy Something is brewed with Strata®, Simcoe®, Mosaic, and Chinook delivering all the citrus, pineapple, and cannabis notes you crave.', url: 'https://landgrantbrewing.com/project/something-hoppy/', checked: C },
      specs: { quote: 'ABV: 7.2', url: 'https://landgrantbrewing.com/project/something-hoppy/', checked: C },
      availability: { quote: 'Availability: Year-Round', url: 'https://landgrantbrewing.com/project/something-hoppy/', checked: C } },
    { brewery: 'Warped Wing Brewing Co.', breweryId: 337, town: 'Dayton', region: 'Dayton', site: 'warpedwing.com', beer: 'Gamma Juice', abv: 6.5,
      location: { quote: '26 WYANDOT STREET – DAYTON, OHIO 45402', url: 'https://warpedwing.com/dayton/', checked: C },
      about: { quote: 'A radiant IPA exploding with notes of tropical fruit & a blast of flavor in every sip.', url: 'https://warpedwing.com/beer/gamma-juice/', checked: C },
      specs: { quote: 'Gamma Juice HAZY JUICY IPA | 6.5% ABV | 20 IBU', url: 'https://warpedwing.com/beer/gamma-juice/', checked: C },
      availability: { quote: 'Availability: Year-round', url: 'https://warpedwing.com/beer/gamma-juice/', checked: C } },
    { brewery: 'MadTree Brewing', breweryId: 201, town: 'Cincinnati', region: 'Cincinnati', site: 'madtree.com', beer: 'PsycHOPathy', abv: 6.9,
      location: { quote: '3301 Madison Road Cincinnati, OH 45209', url: 'https://madtree.com/locations/oakley-taproom/', checked: C },
      about: { quote: "PsycHOPathy is beer that started it all, MadTree's fan-favorite American IPA.", url: 'https://madtree.com/products/psychopathy/', checked: C },
      flagship: { quote: "The flagship IPA holds a special place in Ohio's brewing history as Ohio's first craft beer to be canned.", url: 'https://madtree.com/products/psychopathy/', checked: C },
      specs: { quote: 'ABV 6.9%', url: 'https://madtree.com/products/psychopathy/', checked: C } },
    { brewery: 'Taft’s Brewing Co.', breweryId: 2439, town: 'Cincinnati', region: 'Cincinnati', site: 'taftsbeer.com', beer: 'Gavel Banger',
      location: { quote: 'pouring fresh, flavorful brews in Cincinnati, Ohio since 2015', url: 'https://taftsbeer.com/', checked: C },
      about: { quote: 'Gavel Banger is an American India Pale Ale brewed & dry hopped with heaps of Citra & Mosaic hops.', url: 'https://taftsbeer.com/2026-release-calendar', checked: C },
      availability: { quote: 'CURRENT BEER SELECTION Gavel Banger', url: 'https://taftsbeer.com/2026-release-calendar', checked: C } },
  ] as IpaPick[],
};
export const sourcesOf = (p: IpaPick): Source[] =>
  [p.identity, p.about, p.flagship, p.specs, p.availability, p.award, p.location].filter(Boolean) as Source[];
