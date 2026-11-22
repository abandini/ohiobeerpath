// Historic Route 66, Chicago to Santa Monica: the headline single-road list. This file is the hand-written part. The
// stops are built by `node scripts/build-road-trip.mjs route-66` from the regional checkers' files in
// data/roads/route-66/ (normalised by normaliseCheckerFiles; rulings on single rows are in decisions.json there).
// Keep this file free of imports other than types (the build and verify scripts load it in plain Node).
//
// Wording rules: plain text only (no shield, no logo), nothing that reads as official, complete or affiliated. The
// 1926 and 1985 dates appear only inside the National Park Service's own words, quoted in roadSources.
import type { RoadConfig } from '../../lib/road-trip';

const C = '2026-11-22';
const NPS_1926 = 'https://www.nps.gov/articles/000/marketing-perspective-route-66-roadside-architecture.htm';
const NPS_1985 = 'https://www.nps.gov/articles/000/route-66-national.htm';
const NPS_STATES = 'https://www.nps.gov/pefo/learn/news/new-route-66-exhibit-and-pull-out.htm';
const NAVAJO = {
  quote: 'Title 17, subchapter 12, of the N.N.C. bars the transportation, sale, and consumption of alcoholic beverages on the Navajo Reservation. Section 412 of Title 17 sets out exceptions to the prohibitions in the title.',
  url: 'https://www.federalregister.gov/documents/full_text/html/2008/12/24/E8-30688.html', checked: C,
};

export const ROUTE_66: RoadConfig = {
  slug: 'route-66',
  name: 'Historic Route 66',
  shortName: 'Route 66',
  // Editorial approval to publish. See the note at the end of this file for what was judged and when.
  publish: true,
  headline: true,
  stopsHavePages: false,      // these breweries are outside the six states of our directory: a stop stands alone
  ingest: 'checker-files',
  distanceTo: 'any-way',      // distance is to the nearest mapped alignment of any date, so an older alignment is not penalised
  startingList: "the Open Brewery DB (a community dataset) and breweries our checkers found that it lacks",
  drawToleranceMiles: 0.3,
  maxDetourMiles: 5,
  gapNoteMiles: 25,
  geometry: { source: 'The OpenStreetMap relations for the road signed Historic US 66 today, with the older alignments they include, downloaded through the Overpass API', downloaded: C },
  about: 'The National Park Service says Route 66 “was established on November 11, 1926”, and that “In 1985, US Highway 66 was decommissioned as a federal highway”. It names the states the road ran through: “Illinois, Missouri, Kansas, Oklahoma, Texas, New Mexico, Arizona, and California”. This page follows the road signed Historic US 66 today, as OpenStreetMap maps it, one state at a time from Chicago to Santa Monica. It is an independent list. It is not an official guide, it is not complete, and it has no connection with any Route 66 association, commission or tourism office.',
  roadSources: [
    { quote: 'was established on November 11, 1926', url: NPS_1926, checked: C },
    { quote: 'In 1985, US Highway 66 was decommissioned as a federal highway', url: NPS_1985, checked: C },
    { quote: 'Illinois, Missouri, Kansas, Oklahoma, Texas, New Mexico, Arizona, and California', url: NPS_STATES, checked: C },
  ],
  methodNotes: [
    'One line per state. OpenStreetMap maps more than one alignment in places: both directions in Illinois, older alignments in Illinois and Missouri, and an older line through Santa Fe in New Mexico. For each state we measure along the shortest continuous path through those ways from one state line to the next. That gives one line to measure on. It is not a claim about which alignment is the real one, and its length is not the road’s official length.',
    'Distance to any alignment. A brewery’s distance is the straight line to the nearest mapped alignment of any date, so a brewery on an older alignment is not treated as far away. Its mile is still its nearest point on the one line we measure along.',
    'Where the breweries came from. We started from the Open Brewery DB, a community dataset whose repository carries the MIT License, and added breweries our checkers found on tourism, guild and news pages. Each one was then read on its own website. Dataset rows use the dataset’s coordinates; the others, and any brewery whose printed address differs from the dataset’s, use coordinates from the US Census geocoder for the printed address.',
    'St. Louis. The routes through the city of St. Louis are largely missing from the OpenStreetMap relations, and our Missouri line passes north and west of the city. We give no mile and no distance for breweries in the city rather than pretend to a precision we do not have.',
  ],
  legs: [
    {
      id: 'illinois', name: 'Illinois', from: 'Chicago', to: 'the Missouri line',
      start: [41.8787842, -87.6242413], end: [38.7635845, -90.1703164],
      segments: [
        // Chicago is dense: within 2 miles is the list, 2 to 5 miles is shown apart as "a little further off".
        { id: 'chicago', toMile: 7, maxDetourMiles: 2, furtherOffMiles: 5 },
        { id: 'suburbs', toMile: 60 },
        { id: 'central', toMile: 165 },
        { id: 'south', toMile: null },
      ],
    },
    {
      id: 'missouri', name: 'Missouri', from: 'the Illinois line', to: 'the Kansas line',
      start: [38.7635845, -90.1703164], end: [37.0859362, -94.6178982],
      // The ways west of the Chain of Rocks Bridge do not quite meet in five places (the widest gap is 0.32 miles).
      joinMiles: 0.4, maxJoinedMiles: 1,
      unmeasured: [{
        id: 'st-louis', name: 'In the city of St. Louis',
        note: 'The routes Route 66 took through the city of St. Louis are largely missing from the OpenStreetMap relations we use, and our Missouri line passes north and west of the city. These breweries are in the city. We give no mile and no distance for them, because we have no mapped line there to measure from.',
        box: [38.53, -90.33, 38.70, -90.17],
      }],
      segments: [
        { id: 'st-louis-county', toMile: 65 },
        { id: 'ozarks-east', toMile: 150 },
        { id: 'springfield', toMile: null },
      ],
    },
    {
      id: 'kansas', name: 'Kansas', from: 'the Missouri line', to: 'the Oklahoma line',
      start: [37.0859362, -94.6178982], end: [36.9986737, -94.740691],
      notes: [{ text: 'Route 66 only clips the corner of Kansas. We looked for a brewery with a public taproom in Galena, Riverton and Baxter Springs and found none we could confirm, so this leg has no stop. That is what our list holds, not proof that there is none.' }],
      segments: [{ id: 'kansas', toMile: null }],
    },
    {
      id: 'oklahoma', name: 'Oklahoma', from: 'the Kansas line', to: 'the Texas line',
      start: [36.9986737, -94.740691], end: [35.2210244, -99.9976669],
      joinMiles: 0.4,             // one 0.35-mile gap between ways, near Stroud
      segments: [
        { id: 'tulsa', toMile: 160 },
        { id: 'oklahoma-city', toMile: 260 },
        { id: 'west', toMile: null },
      ],
    },
    {
      id: 'texas', name: 'Texas', from: 'the Oklahoma line', to: 'the New Mexico line',
      start: [35.2210244, -99.9976669], end: [35.1824061, -103.0424908],
      notes: [{ text: 'Across the Texas Panhandle, Amarillo is the only place with anything on this list.' }],
      segments: [{ id: 'panhandle', toMile: null }],
    },
    {
      id: 'new-mexico', name: 'New Mexico', from: 'the Texas line', to: 'the Arizona line',
      start: [35.1824061, -103.0424908], end: [35.3613477, -109.0482706],
      notes: [{ text: 'This is the direct line through Moriarty and Albuquerque. OpenStreetMap also maps an older line that loops north through Santa Fe; it is the side leg after this one, and breweries nearer to it are listed there.' }],
      segments: [
        { id: 'east', toMile: 150 },
        { id: 'albuquerque', toMile: 250 },
        {
          id: 'west', toMile: null,
          notes: [
            { text: 'West of Albuquerque the road passes the Pueblo of Laguna, where the sale of alcohol is licensed under the Pueblo’s own ordinance.', sources: [{ quote: 'This Amendment to the Pueblo of Laguna Liquor Control Ordinance regulates the issuance of licenses for the sale of alcohol beverages in package or by the drink for consumption on the premises', url: 'https://www.federalregister.gov/documents/full_text/html/2000/06/01/00-13612.html', checked: C }] },
            { text: 'Towards the Arizona line the road runs through or beside Navajo Nation land. Navajo law bars carrying, selling and drinking alcohol on the reservation, with exceptions set out in the same law.', sources: [NAVAJO] },
          ],
        },
      ],
    },
    {
      id: 'santa-fe-loop', name: 'New Mexico: the older line through Santa Fe', side: true, from: 'Santa Rosa', to: 'Albuquerque',
      // Where the older line leaves the direct one west of Santa Rosa, through Santa Fe, to where it meets it again in
      // downtown Albuquerque. OSM relation 1479185 is described there as "Historic US 66 (pre-1937)".
      start: [34.9512883, -104.7177625], via: [[35.6849709, -105.9384935]], end: [35.0845545, -106.6516186],
      notes: [{ text: 'A side leg, not part of the through mileage. OpenStreetMap describes this line as “Historic US 66 (pre-1937)”. It leaves the direct line west of Santa Rosa, runs north to Santa Fe and comes back down the Rio Grande valley to downtown Albuquerque. Miles here are measured from where it leaves the direct line.' }],
      segments: [
        { id: 'to-santa-fe', toMile: 100 },
        { id: 'santa-fe', toMile: 140 },
        { id: 'valley', toMile: null },
      ],
    },
    {
      id: 'arizona', name: 'Arizona', from: 'the New Mexico line', to: 'the California line',
      start: [35.3613477, -109.0482706], end: [34.7172643, -114.4856559],
      segments: [
        { id: 'east', toMile: 140, notes: [{ text: 'East of Holbrook the road runs through or beside Navajo Nation land. Navajo law bars carrying, selling and drinking alcohol on the reservation, with exceptions set out in the same law.', sources: [NAVAJO] }] },
        { id: 'flagstaff-williams', toMile: 230 },
        { id: 'west', toMile: null, notes: [{ text: 'Between Seligman and Kingman the road passes through the Hualapai Reservation at Peach Springs, where the Tribe’s ordinance governs alcohol.', sources: [{ quote: 'The Ordinance regulates and controls the possession, sale and consumption of liquor within the Hualapai Reservation.', url: 'https://www.federalregister.gov/documents/full_text/html/2008/09/10/E8-20953.html', checked: C }] }] },
      ],
    },
    {
      id: 'california', name: 'California', from: 'the Arizona line', to: 'Santa Monica',
      start: [34.7172643, -114.4856559], end: [34.0164551, -118.4878356],
      segments: [
        { id: 'desert', toMile: 240 },
        { id: 'inland', toMile: 293 },
        // Pasadena to the coast is dense: within 2 miles is the list, 2 to 5 miles is shown apart.
        { id: 'los-angeles', toMile: null, maxDetourMiles: 2, furtherOffMiles: 5 },
      ],
    },
  ],
};

// publish: true, set 2026-11-22. What was judged: every listed stop has operating evidence read on its own website
// that day by a checker and passed a second same-day status check; rows that failed either are off (decisions.json);
// the page states its coverage, its one-line-per-state method and the St. Louis gap. Set it to false to take the road
// down everywhere (routes, index, sitemap, llms.txt) without removing any code or data.
