// Cleveland Beer of the Month: one seasonal tradition at a time, with the Northeast Ohio beers that carry it.
// Every published fact is a verbatim quote from the brewery's own site (or, for the tradition, local news), with
// its URL and the date we checked it. A beer is "2026" only when its quote prints the 2026 date; otherwise the page
// says the brewery lists it with no year. Never Facebook, Reddit, Nextdoor or social posts.
// Re-check with: node scripts/verify-beer-of-the-month.mjs
export interface Source { quote: string; url: string; checked: string; publisher?: string }
export interface Pour {
  brewery: string;
  breweryId?: number;   // brewerytrip.com/brewery/:id
  town: string;         // from our brewery directory (the page says so)
  site: string;         // the brewery's own domain: every source for this beer must be on it
  beer: string;         // must appear (any case) in one of this beer's quotes
  identity?: Source;    // the page heading or title naming the beer, when the other quotes don't
  confirmed2026: boolean; // true only when `when` prints 2026 and names this beer
  about: Source;        // what the beer is, in the brewery's words
  when?: Source;        // the 2026 release or announcement, or the season the brewery lists
  whenLabel?: string;   // how the page introduces `when` (default: Release / Season the brewery lists)
}
const C = '2026-10-26';
export const BEER_OF_THE_MONTH = {
  slug: 'cleveland-beer-of-the-month',
  title: 'Cleveland Beer of the Month: Christmas Ale Season',
  feature: 'Christmas Ale season',
  covers: 'November and December 2026',
  intro: 'Holiday beers from Northeast Ohio breweries, starting with Great Lakes Christmas Ale: each one named on the brewery’s own site and described in its own words.',
  tradition: [
    { quote: 'Great Lakes Brewing Company had the "unofficial kickoff" to the holiday season with the first pour of Christmas Ale Thursday.', url: 'https://www.cleveland19.com/2026/10/15/unofficial-kickoff-holiday-season-1st-pour-christmas-ale/', checked: C, publisher: 'Cleveland 19 News' },
    { quote: "Christmas Ale continues to be a top performer in GLBC's portfolio, despite being available for only 10 weeks each year.", url: 'https://www.greatlakesbrewing.com/news/winter-seasonals-2026/', checked: C, publisher: 'Great Lakes Brewing Co. news release' },
  ] as Source[],
  pours: [
    { brewery: 'Great Lakes Brewing Co.', breweryId: 136, town: 'Cleveland', site: 'greatlakesbrewing.com', beer: 'Christmas Ale', confirmed2026: true,
      about: { quote: 'GLBC gifts Christmas Ale to all markets in draft, bottles, cans, and in the new Holiday Party Pack beginning October 19, following its Christmas Ale First Pour event on October 15 at the Ohio City brewpub.', url: 'https://www.greatlakesbrewing.com/news/winter-seasonals-2026/', checked: C },
      when: { quote: 'CLEVELAND, Sept. 23, 2026 – Great Lakes Brewing Co. (GLBC) announces its full holiday lineup anchored by bestselling Christmas Ale', url: 'https://www.greatlakesbrewing.com/news/winter-seasonals-2026/', checked: C }, whenLabel: 'Brewery announcement' },
    { brewery: 'The Brew Kettle', breweryId: 2444, town: 'Strongsville', site: 'thebrewkettle.com', beer: 'Winter Warmer', confirmed2026: true,
      about: { quote: "Get into the holiday spirit with Winter Warmer, The Brew Kettle's festive spiced beer crafted to warm your soul on the coldest of nights.", url: 'https://thebrewkettle.com/beers/seasonal/winter-warmer/', checked: C },
      when: { quote: 'Winter Warmer arrives in The Brew Kettle pubs Friday, October 2, 2026.', url: 'https://thebrewkettle.com/winter-warmer-2026/', checked: C } },
    { brewery: 'Thirsty Dog Brewing Co.', breweryId: 314, town: 'Akron', site: 'thirstydog.com', beer: '12 Dogs of Christmas', confirmed2026: false,
      identity: { quote: '12 Dogs of Christmas | Thirsty Dog Brewing Co', url: 'https://thirstydog.com/portfolio-item/12-dogs-of-christmas/', checked: C },
      about: { quote: "Spiced for the holidays with honey, cinnamon, ginger, nutmeg and Santa's secret recipe.", url: 'https://thirstydog.com/portfolio-item/12-dogs-of-christmas/', checked: C },
      when: { quote: 'Available Oct 13 – Dec 31', url: 'https://thirstydog.com/portfolio-item/12-dogs-of-christmas/', checked: C } },
    { brewery: 'Fat Head’s Brewery', breweryId: 108, town: 'Middleburg Heights', site: 'fatheads.com', beer: 'Holly Jolly Christmas Ale', confirmed2026: false,
      about: { quote: 'Inspired by the holidays, our festive spiced ale has all the aromas and flavors of Christmas Day.', url: 'https://fatheads.com/beer/holly-jolly/', checked: C },
      when: { quote: 'Holly Jolly Christmas Ale October – December', url: 'https://fatheads.com/beer/holly-jolly/', checked: C } },
    { brewery: 'Fat Head’s Brewery', breweryId: 108, town: 'Middleburg Heights', site: 'fatheads.com', beer: 'Pimp My Sleigh', confirmed2026: false,
      about: { quote: 'Over the river and through the woods to this rich, complex Belgian-style holiday brew.', url: 'https://fatheads.com/beer/pimp-my-sleigh/', checked: C },
      when: { quote: 'Pimp My Sleigh Belgian-Style Christmas Ale November – December', url: 'https://fatheads.com/beer/pimp-my-sleigh/', checked: C } },
    { brewery: 'Hoppin’ Frog Brewery', breweryId: 163, town: 'Akron', site: 'hoppinfrog.com', beer: 'Frosted Frog Christmas Ale', confirmed2026: false,
      identity: { quote: 'Frosted Frog Christmas Ale | Hoppin’ Frog', url: 'https://hoppinfrog.com/beer/frosted-frog-christmas-ale/', checked: C },
      about: { quote: "Perfectly blended spices compliment Frosted Frog's rich malt flavors, creating the ultimate Christmas experience.", url: 'https://hoppinfrog.com/beer/frosted-frog-christmas-ale/', checked: C } },
    { brewery: 'Collision Bend Brewing Co.', breweryId: 72, town: 'Cleveland', site: 'collisionbendbrewery.com', beer: 'Christmas Staycation', confirmed2026: false,
      identity: { quote: 'Christmas Staycation | Collision Bend Brewing Company', url: 'https://collisionbendbrewery.com/beer/christmas-staycation-44941', checked: C },
      about: { quote: 'This Holiday Amber Ale is spiced with a blend of Cinnamon, Fresh Ginger Root and Nutmeg.', url: 'https://collisionbendbrewery.com/beer/christmas-staycation-44941', checked: C } },
    { brewery: 'Market Garden Brewery', breweryId: 207, town: 'Cleveland', site: 'marketgardenbrewery.com', beer: 'Festivus Holiday Spiced Ale', confirmed2026: false,
      about: { quote: 'FESTIVUS HOLIDAY SPICED ALE 7.5% ABV Description This smooth, spiced holiday ale is a heartwarming tribute to our favorite holiday.', url: 'https://www.marketgardenbrewery.com/beer', checked: C } },
  ] as Pour[],
  events: [
    { name: 'Cleveland Beer Week Holiday Showcase', where: 'Forest City Brewery', breweryId: 120, date: '2026-11-13',
      source: { quote: 'Sample an array of holiday beers and know just what to grab during the busy holiday season.', url: 'https://www.forestcitybrewery.com/events/2026/11/13/cleveland-beer-week-holiday-showcase', checked: C },
      dateSource: { quote: 'Cleveland Beer Week Holiday Showcase Friday, November 13, 2026 6:30 PM 9:30 PM Forest City Brewery', url: 'https://www.forestcitybrewery.com/events/2026/11/13/cleveland-beer-week-holiday-showcase', checked: C } },
  ],
};
