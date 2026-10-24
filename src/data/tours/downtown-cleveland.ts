// Downtown Cleveland brewery walk: every published fact carries a verbatim quote, its source URL and the date it was
// checked. Coordinates come from the site's brewery database (OpenBreweryDB-derived) except Anthology Cask House
// (OpenStreetMap Nominatim, 2026-10-24); distances are straight-line, our calculation. No hours are published (they
// change); stops with a website link to it. A neighborhood is shown only where a quote supports it.
// Re-check with: node scripts/verify-tour-sources.mjs
export interface Source { quote: string; url: string; checked: string; publisher?: string }
export interface TourStop {
  name: string;
  breweryId?: number;          // brewerytrip.com/brewery/:id when the stop is in the database
  neighborhood?: string;       // only where one of the stop's quotes names it
  address: string;
  website?: string;
  lat: number; lon: number;
  addressSource: Source;
  note: string;                // our one-line description, supported by noteSource
  noteSource: Source;
}
const C = "2026-10-24";
export const DOWNTOWN_TOUR = {
  slug: "downtown-cleveland",
  title: "Downtown Cleveland Brewery Walk",
  intro: "Ten breweries from the east edge of downtown through the Flats and Ohio City to Hingetown, in the order we suggest walking them.",
  stops: [
    { name: "Noble Beast Brewing Co.", breweryId: 235, neighborhood: "Downtown", address: "1470 Lakeside Ave. E", website: "https://www.noblebeastbeer.com/",
      lat: 41.5078233, lon: -81.686408,
      addressSource: { quote: "1470 Lakeside Ave. E, Cleveland, 216-417-8588", url: "https://clevelandmagazine.com/food-drink/noble-beast-brewing-co", checked: C, publisher: "Cleveland Magazine" },
      note: "The owners' longstanding downtown brewery.",
      noteSource: { quote: "all that beer will be made downtown at the longstanding Noble Beast location", url: "https://www.clevescene.com/food-drink/shaun-yasaki-to-open-anthology-cask-house-in-former-bookhouse-brewing-space/", checked: C, publisher: "Cleveland Scene" } },
    { name: "Masthead Brewing Company", breweryId: 208, address: "1261 Superior Ave", website: "https://www.mastheadbrewingco.com/",
      lat: 41.502305, lon: -81.6886168,
      addressSource: { quote: "1261 Superior Ave, Cleveland", url: "https://www.mastheadbrewingco.com/", checked: C },
      note: "Hazy IPAs, lagers and Neapolitan-style pizza.",
      noteSource: { quote: "We’re known for our hazy IPAs, lagers, Neapolitan-style pizza and shareables", url: "https://www.mastheadbrewingco.com/", checked: C } },
    { name: "Southern Tier Brewing Co. Cleveland", breweryId: 296, address: "811 Prospect Ave E", website: "https://cleveland.stbcbeer.com/",
      lat: 41.4991253, lon: -81.6870304,
      addressSource: { quote: "811 Prospect Ave E, Cleveland", url: "https://cleveland.stbcbeer.com/", checked: C },
      note: "A satellite taproom a short walk from Progressive Field and Rocket Mortgage FieldHouse.",
      noteSource: { quote: "this is Southern Tier's second satellite taproom, just a short stroll away from Rocket Mortgage FieldHouse and Progressive Field", url: "https://cleveland.stbcbeer.com/", checked: C } },
    { name: "Brick and Barrel", breweryId: 51, neighborhood: "The Flats", address: "1844 Columbus Rd", website: "https://brickandbarrelbrewery.com/",
      lat: 41.4894905, lon: -81.7007862,
      addressSource: { quote: "1844 COLUMBUS RD, CLEVELAND, OH 44113", url: "https://brickandbarrelbrewery.com/", checked: C },
      note: "In the Flats.",
      noteSource: { quote: "craft beers in the heart of the Flats Cleveland", url: "https://brickandbarrelbrewery.com/", checked: C } },
    { name: "Forest City Brewery", breweryId: 120, address: "2135 Columbus Rd", website: "https://www.forestcitybrewery.com/",
      lat: 41.4832518, lon: -81.7001577,
      addressSource: { quote: "2135 Columbus Road Cleveland, OH 44113", url: "https://www.forestcitybrewery.com/", checked: C },
      note: "Look for the door on Freeman Avenue.",
      noteSource: { quote: "No you are not lost – Building entrance is located on Freeman Avenue.", url: "https://www.forestcitybrewery.com/", checked: C } },
    { name: "Great Lakes Brewing Company", breweryId: 136, address: "2516 Market Ave", website: "https://www.greatlakesbrewing.com/",
      lat: 41.484403, lon: -81.704532,
      addressSource: { quote: "2516 Market Ave.", url: "https://www.greatlakesbrewing.com/", checked: C },
      note: "Calls itself Ohio's original craft brewery.",
      noteSource: { quote: "Ohio’s original craft brewery", url: "https://www.greatlakesbrewing.com/", checked: C } },
    { name: "Market Garden Brewery", breweryId: 207, neighborhood: "Ohio City", address: "1947 W. 25th St", website: "https://www.marketgardenbrewery.com/",
      lat: 41.4850769, lon: -81.7034306,
      addressSource: { quote: "1947 West 25th St", url: "https://www.marketgardenbrewery.com/", checked: C },
      note: "Across from the West Side Market.",
      noteSource: { quote: "We're located in exciting Ohio City, across from the historic West Side Market.", url: "https://www.marketgardenbrewery.com/", checked: C } },
    { name: "Nano Brew Cleveland", breweryId: 229, neighborhood: "Ohio City", address: "1859 W. 25th St", website: "https://www.nanobrewcleveland.com/",
      lat: 41.4860542, lon: -81.7045576,
      addressSource: { quote: "1859 West 25th St", url: "https://www.nanobrewcleveland.com/", checked: C },
      note: "Beer and burgers on West 25th since 2012.",
      noteSource: { quote: "GOOD TIMES, GREAT BEER & BURGERS IN OHIO CITY SINCE 2012", url: "https://www.nanobrewcleveland.com/", checked: C } },
    { name: "Anthology Cask House", neighborhood: "Ohio City", address: "1526 W. 25th St",
      lat: 41.4895913, lon: -81.7070255,
      addressSource: { quote: "Ohio City's newest pub pours its first pint today at Anthology Cask House (1526 W. 25th St.), which opens in the former Bookhouse Brewing space from Noble Beast's Shaun and JoLyn Yasaki.", url: "https://clevelandmagazine.com/articles/downtown-farmers-market-lessens-loss-of-grocery-store-cle-daily/", checked: C, publisher: "Cleveland Magazine, Aug. 14, 2026" },
      note: "Noble Beast's owners opened it in the former Bookhouse Brewing space; its cask ales are brewed on site.",
      noteSource: { quote: "the cask ales, which are brewed onsite by Yasaki and brewer Logan Buckley-Neff", url: "https://www.clevescene.com/food-drink/first-look-anthology-cask-house-opening-in-ohio-city-friday-aug-14/", checked: C, publisher: "Cleveland Scene, Aug. 5, 2026" } },
    { name: "Saucy Brew Works", breweryId: 280, address: "2885 Detroit Ave", website: "https://www.saucybrewworks.com/",
      lat: 41.4895927, lon: -81.7105726,
      addressSource: { quote: "2885 Detroit Ave", url: "https://www.saucybrewworks.com/", checked: C },
      note: "Opened in Cleveland in 2017.",
      noteSource: { quote: "Since opening in Cleveland, OH in 2017", url: "https://www.saucybrewworks.com/", checked: C } },
  ] as TourStop[],
  nearby: [
    { name: "Hansa Brewery", breweryId: 2356, address: "2717 Lorain Ave", source: { quote: "2717 Lorain Ave", url: "https://www.hansabrewery.com/", checked: C } },
    { name: "Collision Bend Brewing Company", breweryId: 72, address: "1250 Old River Rd", source: { quote: "1250 Old River Road", url: "https://collisionbendbrewery.com/", checked: C } },
  ],
};

// Straight-line distance in miles between two stops (haversine): our calculation, not a walking route.
export function milesBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 3958.8, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
