// Ohio Christmas ales guide (/blog/ohio-christmas-ales): ten Ohio holiday beers, each named and described on its
// brewery's own site. Every published fact is a verbatim quote with its URL and the date we checked it. A beer is
// tied to 2026 only through `release2026`, a quote that prints 2026 and names the beer; every other beer is shown
// as the brewery listed it when we checked. Never Facebook, Reddit, Nextdoor, Instagram, Untappd, BeerAdvocate, X
// or news roundups. Re-check with: node scripts/verify-christmas-ales.mjs
export interface Source { quote: string; url: string; checked: string }
export interface HolidayPick {
  brewery: string;
  breweryId?: number;    // brewerytrip.com/brewery/:id
  town: string;          // must appear (any case) in the `location` quote
  location: Source;      // an address or location line from the brewery's own site
  region: string;        // our grouping for the statewide list (the page says so)
  site: string;          // the brewery's own domain: every source for this beer must be on it
  beer: string;          // must appear (any case) in one of this beer's quotes
  abv?: number;          // must appear in the `specs` quote
  about: Source;         // what the beer is, in the brewery's words
  identity?: Source;     // a heading or title naming the beer, when `about` doesn't
  specs?: Source;        // style / ABV / IBU as the brewery prints them
  availability?: Source; // the brewery's own season or availability wording (no year)
  where?: Source;        // where to buy or drink it, in the brewery's words
  release2026?: Source;  // only a quote that prints 2026 and names this beer
}
const C = '2026-10-31';
export const CHRISTMAS_ALES = {
  slug: 'ohio-christmas-ales',
  title: 'Ohio Christmas Ales: 10 Holiday Beers to Look For (2026 Guide)',
  excerpt: 'Ten Ohio Christmas and holiday beers from Cleveland, Akron, Toledo, Columbus, Dayton, Cincinnati and Athens, each described in its brewery’s own words, with a link to the page we quoted.',
  datePublished: C,
  dateModified: C,
  checked: C,
  regions: ['Cleveland area', 'Akron', 'Toledo', 'Columbus', 'Dayton', 'Cincinnati', 'Athens'],
  picks: [
    { brewery: 'Great Lakes Brewing Co.', breweryId: 136, town: 'Cleveland', region: 'Cleveland area', site: 'greatlakesbrewing.com', beer: 'Christmas Ale', abv: 7.5,
      location: { quote: '2516 Market Ave. Cleveland Ohio 44113', url: 'https://www.greatlakesbrewing.com/christmas-ale/', checked: C },
      about: { quote: 'Do not open ‘til Christmas? Whoever coined that phrase obviously hasn’t tasted Christmas Ale’s fresh honey, cinnamon, and ginger flavors.', url: 'https://www.greatlakesbrewing.com/christmas-ale/', checked: C },
      specs: { quote: 'ABV 7.5% IBU 30', url: 'https://www.greatlakesbrewing.com/christmas-ale/', checked: C },
      availability: { quote: 'Seasonal X Release: October', url: 'https://www.greatlakesbrewing.com/christmas-ale/', checked: C },
      where: { quote: 'GLBC gifts Christmas Ale to all markets in draft, bottles, cans, and in the new Holiday Party Pack beginning October 19, following its Christmas Ale First Pour event on October 15 at the Ohio City brewpub.', url: 'https://www.greatlakesbrewing.com/news/winter-seasonals-2026/', checked: C },
      release2026: { quote: 'CLEVELAND, Sept. 23, 2026 – Great Lakes Brewing Co. (GLBC) announces its full holiday lineup anchored by bestselling Christmas Ale', url: 'https://www.greatlakesbrewing.com/news/winter-seasonals-2026/', checked: C } },
    { brewery: 'Fat Head’s Brewery', breweryId: 108, town: 'Middleburg Heights', region: 'Cleveland area', site: 'fatheads.com', beer: 'Holly Jolly Christmas Ale', abv: 7.5,
      location: { quote: 'Fat Head\'s Middleburg Heights 17450 Engle Lake Dr Middleburg Heights, OH 44130', url: 'https://fatheads.com/middleburg-heights/', checked: C },
      about: { quote: 'Inspired by the holidays, our festive spiced ale has all the aromas and flavors of Christmas Day.', url: 'https://fatheads.com/beer/holly-jolly/', checked: C },
      specs: { quote: 'Beer Details ABV 7.5% IBU 28', url: 'https://fatheads.com/beer/holly-jolly/', checked: C },
      availability: { quote: 'Holly Jolly Christmas Ale October – December', url: 'https://fatheads.com/beer/holly-jolly/', checked: C },
      where: { quote: 'Available in: Draft Half & sixth BBL 6 pack 12 oz. cans', url: 'https://fatheads.com/beer/holly-jolly/', checked: C } },
    { brewery: 'The Brew Kettle', breweryId: 2444, town: 'Strongsville', region: 'Cleveland area', site: 'thebrewkettle.com', beer: 'Winter Warmer',
      location: { quote: 'The Brew Kettle Strongsville 8377 Pearl Rd, Strongsville, OH 44136', url: 'https://thebrewkettle.com/brewpubs/strongsville/', checked: C },
      identity: { quote: 'Winter Warmer – Spiced Christmas Ale', url: 'https://thebrewkettle.com/beers/seasonal/winter-warmer/', checked: C },
      about: { quote: 'Get into the holiday spirit with Winter Warmer, The Brew Kettle’s festive spiced beer crafted to warm your soul on the coldest of nights.', url: 'https://thebrewkettle.com/beers/seasonal/winter-warmer/', checked: C },
      release2026: { quote: 'Winter Warmer arrives in The Brew Kettle pubs Friday, October 2, 2026.', url: 'https://thebrewkettle.com/winter-warmer-2026/', checked: C } },
    { brewery: 'Thirsty Dog Brewing Co.', breweryId: 314, town: 'Akron', region: 'Akron', site: 'thirstydog.com', beer: '12 Dogs of Christmas', abv: 8.0,
      location: { quote: 'The TapHouse 587 Grant Street Akron, Ohio 44311', url: 'https://thirstydog.com/portfolio-item/12-dogs-of-christmas/', checked: C },
      identity: { quote: '12 Dogs of Christmas | Thirsty Dog Brewing Co', url: 'https://thirstydog.com/portfolio-item/12-dogs-of-christmas/', checked: C },
      about: { quote: 'Spiced for the holidays with honey, cinnamon, ginger, nutmeg and Santa’s secret recipe.', url: 'https://thirstydog.com/portfolio-item/12-dogs-of-christmas/', checked: C },
      specs: { quote: '12 DOGS OF CHRISTMAS ALE OG = 18.5° P FG = 3.7° P ABV = 8.0% alc./vol. IBUs = 17', url: 'https://thirstydog.com/portfolio-item/12-dogs-of-christmas/', checked: C },
      availability: { quote: 'Available Oct 13 – Dec 31', url: 'https://thirstydog.com/portfolio-item/12-dogs-of-christmas/', checked: C },
      where: { quote: 'Available in 6-pack bottle, 12 oz. cans & draft', url: 'https://thirstydog.com/portfolio-item/12-dogs-of-christmas/', checked: C } },
    { brewery: 'Hoppin’ Frog Brewery', breweryId: 163, town: 'Akron', region: 'Akron', site: 'hoppinfrog.com', beer: 'Frosted Frog Christmas Ale', abv: 8.6,
      location: { quote: '1680 East Waterloo Rd. Akron, OH 44306', url: 'https://hoppinfrog.com/beer/frosted-frog-christmas-ale/', checked: C },
      identity: { quote: 'Frosted Frog Christmas Ale | Hoppin’ Frog', url: 'https://hoppinfrog.com/beer/frosted-frog-christmas-ale/', checked: C },
      about: { quote: 'Perfectly blended spices compliment Frosted Frog’s rich malt flavors, creating the ultimate Christmas experience.', url: 'https://hoppinfrog.com/beer/frosted-frog-christmas-ale/', checked: C },
      specs: { quote: 'Style Ale / Brown / Spiced Series Seasonal ABV 8.6%', url: 'https://hoppinfrog.com/beer/frosted-frog-christmas-ale/', checked: C },
      availability: { quote: 'Availability Seasonal', url: 'https://hoppinfrog.com/beer/frosted-frog-christmas-ale/', checked: C } },
    { brewery: 'Maumee Bay Brewing Co.', breweryId: 209, town: 'Toledo', region: 'Toledo', site: 'mbaybrew.com', beer: 'Blitzen', abv: 7.7,
      location: { quote: 'Location 27 Broadway Street Toledo, OH 43604', url: 'https://mbaybrew.com/about-our-beer/whats-on-tap/', checked: C },
      about: { quote: 'Blitzen – Winter Ale Each year we craft this tasty ale to celebrate the festive holiday season. Spiced with just the right amount of cinnamon and orange peel', url: 'https://mbaybrew.com/about-our-beer/whats-on-tap/', checked: C },
      specs: { quote: 'For a limited time only! 7.7% ABV | 20 IBU', url: 'https://mbaybrew.com/about-our-beer/whats-on-tap/', checked: C },
      release2026: { quote: 'Blitzen Release Party When October 8, 2026 6:00 pm - 9:00 pm', url: 'https://mbaybrew.com/events/blitzen-release-party-3/', checked: C } },
    { brewery: 'Columbus Brewing Co.', breweryId: 2338, town: 'Columbus', region: 'Columbus', site: 'columbusbrewing.com', beer: 'Tracksuit Santa', abv: 7.8,
      location: { quote: 'Columbus Brewing Company 2555 Harrison Rd. Columbus, OH 43204', url: 'https://columbusbrewing.com/beer/tracksuit-santa/', checked: C },
      specs: { quote: 'Tracksuit Santa Spiced Holiday Ale ABV 7.8% IBU 34', url: 'https://columbusbrewing.com/beer/tracksuit-santa/', checked: C },
      about: { quote: 'A lightly-spiced holiday ale brewed with Indonesian cinnamon, ginger and orange peel.', url: 'https://columbusbrewing.com/beer/tracksuit-santa/', checked: C },
      availability: { quote: 'Availability Seasonal (Oct – Dec)', url: 'https://columbusbrewing.com/beer/tracksuit-santa/', checked: C },
      where: { quote: 'This instant holiday classic is available for a limited time through the holidays in 6-packs.', url: 'https://columbusbrewing.com/beer/tracksuit-santa/', checked: C } },
    { brewery: 'Warped Wing Brewing Co.', breweryId: 337, town: 'Dayton', region: 'Dayton', site: 'warpedwing.com', beer: 'Holiday Special', abv: 5.5,
      location: { quote: '26 WYANDOT STREET – DAYTON, OHIO 45402', url: 'https://warpedwing.com/dayton/', checked: C },
      specs: { quote: 'Holiday Special HOLIDAY LAGER | 5.5% ABV | 18 IBU', url: 'https://warpedwing.com/beer/holiday-special/', checked: C },
      about: { quote: 'A well-balanced lager with aromas of ginger, lemon peel, and nutmeg. Made with honey to help bring out a mildly sweet taste.', url: 'https://warpedwing.com/beer/holiday-special/', checked: C },
      availability: { quote: 'Availability: Fall/Winter Draft | 6pk cans', url: 'https://warpedwing.com/beer/holiday-special/', checked: C } },
    { brewery: 'Rhinegeist', breweryId: 269, town: 'Cincinnati', region: 'Cincinnati', site: 'rhinegeist.com', beer: 'Holiday Bubbles', abv: 6.2,
      location: { quote: 'Rhinegeist Brewery 1910 Elm Street Cincinnati, OH 45202', url: 'https://rhinegeist.com/beer/holiday-bubbles/', checked: C },
      specs: { quote: 'Blend 6.2% ABV Holiday Bubbles', url: 'https://rhinegeist.com/beer/holiday-bubbles/', checked: C },
      about: { quote: 'Cranberry melds with cinnamon and ginger to create a festive, holiday pastry aroma.', url: 'https://rhinegeist.com/beer/holiday-bubbles/', checked: C },
      availability: { quote: 'Availability Limited Category Fruited Ale Style Blend Now Pouring No', url: 'https://rhinegeist.com/beer/holiday-bubbles/', checked: C },
      },
    { brewery: 'Jackie O’s Pub & Brewery', breweryId: 2366, town: 'Athens', region: 'Athens', site: 'jackieos.com', beer: 'Christmas Ale', abv: 6.5,
      location: { quote: 'Public House Restaurant 22 W. Union St. Athens, OH 45701', url: 'https://jackieos.com/beer/christmas-ale/', checked: C },
      identity: { quote: 'Christmas Ale | Jackie O’s Pub & Brewery', url: 'https://jackieos.com/beer/christmas-ale/', checked: C },
      about: { quote: 'Our Chomolungma Brown Ale conditioned on honey and holiday spices and brewed with 7 malts and 2 hops to create an Ale with exceptional character.', url: 'https://jackieos.com/beer/christmas-ale/', checked: C },
      specs: { quote: 'Style Brown Ale / Honey Nut Brown Ale Flavor Profile Chocolate / Spiced ABV 6.5%', url: 'https://jackieos.com/beer/christmas-ale/', checked: C },
      availability: { quote: 'Availability Limited Release', url: 'https://jackieos.com/beer/christmas-ale/', checked: C } },
  ] as HolidayPick[],
};
export const sourcesOf = (p: HolidayPick): Source[] =>
  [p.identity, p.about, p.specs, p.availability, p.where, p.release2026, p.location].filter(Boolean) as Source[];
// Tied to 2026 only when the release quote itself prints 2026 and names the beer.
export const confirmed2026 = (p: HolidayPick): boolean =>
  !!p.release2026 && /\b2026\b/.test(p.release2026.quote) && p.release2026.quote.toLowerCase().includes(p.beer.toLowerCase());
