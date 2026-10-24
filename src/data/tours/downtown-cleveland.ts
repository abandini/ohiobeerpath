// Downtown Cleveland brewery walk: every published fact carries a verbatim quote, its source URL and the date it was
// checked. Coordinates come from the site's brewery database (OpenBreweryDB-derived) except Anthology Cask House
// (OpenStreetMap Nominatim, 2026-10-24); distances are straight-line, our calculation. No hours are published (they
// change); stops with a website link to it. A neighborhood is shown only where a quote supports it.
// Re-check with: node scripts/verify-tour-sources.mjs
export interface Source { quote: string; url: string; checked: string; publisher?: string }
// A Great American Beer Festival medal, exactly as the official winners list prints it (quote = the list's line).
export interface GabfMedal { year: number; medal: 'Gold' | 'Silver' | 'Bronze'; beer: string; category: string; entrant: string; quote: string; url: string; checked: string }
// The official lists online cover 2013 onward (greatamericanbeerfestival.com past winners); older medals are not counted.
export const GABF_WINDOW = { from: 2013, to: 2026, index: "https://www.greatamericanbeerfestival.com/the-competition/winners/past-winners/" };
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
  gabf?: GabfMedal[];          // medals in the official 2013–2026 GABF winners lists, newest first
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
      noteSource: { quote: "all that beer will be made downtown at the longstanding Noble Beast location", url: "https://www.clevescene.com/food-drink/shaun-yasaki-to-open-anthology-cask-house-in-former-bookhouse-brewing-space/", checked: C, publisher: "Cleveland Scene" },
      gabf: [
        { year: 2024, medal: "Gold", beer: "Eau Rouge", category: "Belgian-Style Sour Ale", entrant: "Noble Beast Brewing Co.", quote: "Gold: Eau Rouge, Noble Beast Brewing Co., Cleveland, OH", url: "https://cdn.greatamericanbeerfestival.com/wp-content/uploads/GABF24-Winners-List.pdf", checked: C },
        { year: 2020, medal: "Silver", beer: "Murder Ballads", category: "International Dark Lager", entrant: "Noble Beast Brewing Co.", quote: "Silver: Murder Ballads, Noble Beast Brewing Co., Cleveland, OH", url: "https://cdn.greatamericanbeerfestival.com/wp-content/uploads/GABF2020-Winners-List.pdf", checked: C },
        { year: 2019, medal: "Bronze", beer: "Murder Ballads", category: "Baltic-Style Porter", entrant: "Noble Beast Brewing Co.", quote: "Bronze: Murder Ballads, Noble Beast Brewing Co., Cleveland, OH", url: "https://cdn.greatamericanbeerfestival.com/wp-content/uploads/GABF-Winners_2019v1.pdf", checked: C },
      ] },
    { name: "Masthead Brewing Company", breweryId: 208, address: "1261 Superior Ave", website: "https://www.mastheadbrewingco.com/",
      lat: 41.502305, lon: -81.6886168,
      addressSource: { quote: "1261 Superior Ave, Cleveland", url: "https://www.mastheadbrewingco.com/", checked: C },
      note: "Hazy IPAs, lagers and Neapolitan-style pizza.",
      noteSource: { quote: "We’re known for our hazy IPAs, lagers, Neapolitan-style pizza and shareables", url: "https://www.mastheadbrewingco.com/", checked: C },
      gabf: [
        { year: 2026, medal: "Gold", beer: "Shower Beer", category: "American Lager", entrant: "Masthead Brewing Co.", quote: "Gold: Shower Beer, Masthead Brewing Co., Cleveland, OH", url: "https://www.greatamericanbeerfestival.com/wp-content/uploads/2026/10/GABF-2026-Winners-List-2.pdf", checked: C },
        { year: 2026, medal: "Gold", beer: "Oni Giri", category: "Rice Lager", entrant: "Masthead Brewing Co.", quote: "Gold: Oni Giri, Masthead Brewing Co., Cleveland, OH", url: "https://www.greatamericanbeerfestival.com/wp-content/uploads/2026/10/GABF-2026-Winners-List-2.pdf", checked: C },
        { year: 2024, medal: "Bronze", beer: "IPA for Aliens", category: "West Coast IPA", entrant: "Masthead Brewing Co.", quote: "Bronze: IPA for Aliens, Masthead Brewing Co., Cleveland, OH", url: "https://cdn.greatamericanbeerfestival.com/wp-content/uploads/GABF24-Winners-List.pdf", checked: C },
        { year: 2021, medal: "Silver", beer: "Midwest Red IPA", category: "Strong Red Ale", entrant: "Masthead Brewing Co.", quote: "Silver: Midwest Red IPA, Masthead Brewing Co., Cleveland, OH", url: "https://cdn.greatamericanbeerfestival.com/wp-content/uploads/GABF21-Winners-List.pdf", checked: C },
        { year: 2020, medal: "Gold", beer: "Augenblick Light Lager", category: "Munich-Style Helles", entrant: "Masthead Brewing Co.", quote: "Gold: Augenblick Light Lager, Masthead Brewing Co., Cleveland, OH", url: "https://cdn.greatamericanbeerfestival.com/wp-content/uploads/GABF2020-Winners-List.pdf", checked: C },
        { year: 2018, medal: "Gold", beer: "Midwest Red IPA", category: "Double Hoppy Red Ale", entrant: "Masthead Brewing Co.", quote: "Gold: Midwest Red IPA, Masthead Brewing Co., Cleveland, OH", url: "https://cdn.greatamericanbeerfestival.com/wp-content/uploads/GABF18-Winners-List.pdf", checked: C },
        { year: 2017, medal: "Bronze", beer: "Midwest Red IPA", category: "Double Red Ale", entrant: "Masthead Brewing Co.", quote: "Bronze: Midwest Red IPA, Masthead Brewing Co., Cleveland, OH", url: "https://cdn.greatamericanbeerfestival.com/wp-content/uploads/2017-GABF-Winners.pdf", checked: C },
      ] },
    { name: "Southern Tier Brewing Co. Cleveland", breweryId: 296, address: "811 Prospect Ave E", website: "https://cleveland.stbcbeer.com/",
      lat: 41.4991253, lon: -81.6870304,
      addressSource: { quote: "811 Prospect Ave E, Cleveland", url: "https://cleveland.stbcbeer.com/", checked: C },
      note: "A satellite taproom a short walk from Progressive Field and the arena.",
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
      noteSource: { quote: "Ohio’s original craft brewery", url: "https://www.greatlakesbrewing.com/", checked: C },
      gabf: [
        { year: 2026, medal: "Silver", beer: "Dort Light", category: "International Light Lager", entrant: "Great Lakes Brewing Co.", quote: "Silver: Dort Light, Great Lakes Brewing Co., Cleveland, OH", url: "https://www.greatamericanbeerfestival.com/wp-content/uploads/2026/10/GABF-2026-Winners-List-2.pdf", checked: C },
      ] },
    { name: "Market Garden Brewery", breweryId: 207, neighborhood: "Ohio City", address: "1947 W. 25th St", website: "https://www.marketgardenbrewery.com/",
      lat: 41.4850769, lon: -81.7034306,
      addressSource: { quote: "1947 West 25th St", url: "https://www.marketgardenbrewery.com/", checked: C },
      note: "Across from the West Side Market.",
      noteSource: { quote: "We're located in exciting Ohio City, across from the historic West Side Market.", url: "https://www.marketgardenbrewery.com/", checked: C },
      gabf: [
        { year: 2019, medal: "Gold", beer: "Prosperity Wheat", category: "South German-Style Hefeweizen", entrant: "Market Garden Brewery - Production Brewery", quote: "Gold: Prosperity Wheat, Market Garden Brewery - Production Brewery, Cleveland, OH", url: "https://cdn.greatamericanbeerfestival.com/wp-content/uploads/GABF-Winners_2019v1.pdf", checked: C },
        { year: 2018, medal: "Silver", beer: "Nano - OG Lager", category: "International-Style Pilsener", entrant: "Market Garden Brewery", quote: "Silver: Nano - OG Lager, Market Garden Brewery, Cleveland, OH", url: "https://cdn.greatamericanbeerfestival.com/wp-content/uploads/GABF18-Winners-List.pdf", checked: C },
        { year: 2013, medal: "Bronze", beer: "Progress Pilsner", category: "Kellerbier or Zwickelbier", entrant: "Market Garden Brewery", quote: "Bronze: Progress Pilsner, Market Garden Brewery, Cleveland, OH", url: "https://www.greatamericanbeerfestival.com/wp-content/uploads/13_GABF_winners.pdf", checked: C },
      ] },
    { name: "Nano Brew Cleveland", breweryId: 229, neighborhood: "Ohio City", address: "1859 W. 25th St", website: "https://www.nanobrewcleveland.com/",
      lat: 41.4860542, lon: -81.7045576,
      addressSource: { quote: "1859 West 25th St", url: "https://www.nanobrewcleveland.com/", checked: C },
      note: "Beer and burgers on West 25th since 2012.",
      noteSource: { quote: "GOOD TIMES, GREAT BEER & BURGERS IN OHIO CITY SINCE 2012", url: "https://www.nanobrewcleveland.com/", checked: C } },
    { name: "Anthology Cask House", breweryId: 2464, neighborhood: "Ohio City", address: "1526 W. 25th St",
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

// Starting points for "Where are you starting from?" (coordinates: OpenStreetMap Nominatim, 2026-10-24).
export const LANDMARKS = [
  { name: "Public Square", lat: 41.499647, lon: -81.6936673 },
  { name: "Huntington Convention Center", lat: 41.5032195, lon: -81.6942895 },
  { name: "Rock and Roll Hall of Fame", lat: 41.5084983, lon: -81.6954068 },
  { name: "Huntington Bank Field", lat: 41.5060559, lon: -81.6997118 },
  { name: "Playhouse Square", lat: 41.5009125, lon: -81.6818217 },
  { name: "Progressive Field", lat: 41.4960906, lon: -81.6851319 },
  { name: "Rocket Arena", lat: 41.4966862, lon: -81.6885754 },
  { name: "West Side Market", lat: 41.4846588, lon: -81.7029998 },
];

// The "Where are you starting from?" route, as plain browser JavaScript (embedded verbatim in the page and evaluated
// directly by the tests, so what ships is exactly what is tested). Nearest stop first, then nearest-next, then a 2-opt
// pass over the rest (the first stop stays pinned). Straight-line distances: our calculation, not a walking route.
export const ROUTE_FROM_JS = `function routeFrom(start, points) {
  var R = 3958.8, rad = function (d) { return d * Math.PI / 180; };
  function dist(a, b) {
    var h = Math.pow(Math.sin(rad(b.lat - a.lat) / 2), 2) + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.pow(Math.sin(rad(b.lon - a.lon) / 2), 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  var left = points.map(function (_, i) { return i; }), order = [], at = start;
  while (left.length) {
    var best = 0;
    for (var k = 1; k < left.length; k++) if (dist(at, points[left[k]]) < dist(at, points[left[best]])) best = k;
    var i = left.splice(best, 1)[0]; order.push(i); at = points[i];
  }
  function len(o) { var s = 0; for (var k = 0; k < o.length; k++) s += dist(k ? points[o[k - 1]] : start, points[o[k]]); return s; }
  for (var improved = true; improved; ) {
    improved = false;
    for (var a = 1; a < order.length - 1; a++) for (var b = a + 1; b < order.length; b++) {
      var next = order.slice(0, a).concat(order.slice(a, b + 1).reverse(), order.slice(b + 1));
      if (len(next) < len(order) - 1e-9) { order = next; improved = true; }
    }
  }
  return order;
}`;

// Straight-line distance in miles between two stops (haversine): our calculation, not a walking route.
export function milesBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 3958.8, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
