// US Route 422, the first single-road trip. This file is the hand-written part: what the road is, how each leg is cut
// into stretches, and the sources for what the page says about the road itself. The stops are NOT written here: they
// are built from the checkers' rows by `node scripts/build-road-trip.mjs us-422` into us-422.built.ts.
// Keep this file free of imports other than types (the build and verify scripts load it in plain Node).
import type { RoadConfig } from '../../lib/road-trip';

const WIKI = 'https://en.wikipedia.org/wiki/U.S._Route_422';
const C = '2026-11-22';

// US 422 as it was listed before the update of 22 November 2026 (the published list of 34 stops: directory id, name,
// town, mile and straight-line distance). Kept so the correction notice on the page is worked out from data: what was
// listed then against what is listed now. Do not edit.
const US_422_BEFORE_2026_11_22 = [
 {
  "breweryId": 208,
  "name": "Masthead Brewing Company",
  "town": "Cleveland",
  "mile": 0,
  "detourMiles": 0.32
 },
 {
  "breweryId": 72,
  "name": "Collision Bend Brewing Company",
  "town": "Cleveland",
  "mile": 0,
  "detourMiles": 0.57
 },
 {
  "breweryId": 280,
  "name": "Saucy Brew Works",
  "town": "Cleveland",
  "mile": 0,
  "detourMiles": 1.11
 },
 {
  "breweryId": 308,
  "name": "Terrestrial Brewing Company",
  "town": "Cleveland",
  "mile": 0,
  "detourMiles": 2.4
 },
 {
  "breweryId": 51,
  "name": "Brick and Barrel",
  "town": "Cleveland",
  "mile": 0.2,
  "detourMiles": 0.72
 },
 {
  "breweryId": 207,
  "name": "Market Garden Brewpub",
  "town": "Cleveland",
  "mile": 0.2,
  "detourMiles": 1.04
 },
 {
  "breweryId": 120,
  "name": "Forest City Brewery",
  "town": "Cleveland",
  "mile": 0.2,
  "detourMiles": 1.05
 },
 {
  "breweryId": 136,
  "name": "Great Lakes Brewing Company",
  "town": "Cleveland",
  "mile": 0.2,
  "detourMiles": 1.11
 },
 {
  "breweryId": 2356,
  "name": "Hansa Brewery",
  "town": "Cleveland",
  "mile": 0.2,
  "detourMiles": 1.17
 },
 {
  "breweryId": 296,
  "name": "Southern Tier Brewing Co. Cleveland",
  "town": "Cleveland",
  "mile": 0.3,
  "detourMiles": 0.23
 },
 {
  "breweryId": 154,
  "name": "Hofbräuhaus Cleveland",
  "town": "Cleveland",
  "mile": 0.4,
  "detourMiles": 0.61
 },
 {
  "breweryId": 130,
  "name": "Goldhorn Brewery",
  "town": "Cleveland",
  "mile": 1.8,
  "detourMiles": 2.25
 },
 {
  "breweryId": 182,
  "name": "The Jolly Scholar",
  "town": "Cleveland",
  "mile": 3.5,
  "detourMiles": 2.45
 },
 {
  "breweryId": 82,
  "name": "Crooked Pecker Brewing Company",
  "town": "Newbury",
  "mile": 22.4,
  "detourMiles": 1.86
 },
 {
  "breweryId": 261,
  "name": "Pompatus Brewing Co",
  "town": "Chagrin Falls",
  "mile": 25.6,
  "detourMiles": 0.71
 },
 {
  "breweryId": 60,
  "name": "Bummin' Beaver Brewery",
  "town": "Auburn Twp.",
  "mile": 29.1,
  "detourMiles": 0.24
 },
 {
  "breweryId": 218,
  "name": "Modern Methods Brewing Company",
  "town": "Warren",
  "mile": 54.1,
  "detourMiles": 0.11
 },
 {
  "breweryId": 26,
  "name": "Biker Brewhouse",
  "town": "Austintown",
  "mile": 63.6,
  "detourMiles": 4.27
 },
 {
  "breweryId": 259,
  "name": "Penguin City Brewing Company",
  "town": "Youngstown",
  "mile": 67,
  "detourMiles": 0.55
 },
 {
  "breweryId": 2394,
  "name": "Noble Creature Cask House",
  "town": "Youngstown",
  "mile": 67.8,
  "detourMiles": 0.42
 },
 {
  "breweryId": 992,
  "name": "Brew 32",
  "town": "Pulaski",
  "mile": 77.5,
  "detourMiles": 3.59
 },
 {
  "breweryId": 1030,
  "name": "Crooked Tongue Brewing",
  "town": "Edinburg",
  "mile": 81.2,
  "detourMiles": 2.07
 },
 {
  "breweryId": 1184,
  "name": "Recon Brewing",
  "town": "Butler",
  "mile": 115.1,
  "detourMiles": 1.31
 },
 {
  "breweryId": 1122,
  "name": "Levity Brewing Co",
  "town": "Indiana",
  "mile": 166.7,
  "detourMiles": 3.63
 },
 {
  "breweryId": 1261,
  "name": "Troegs Brewing Co",
  "town": "Hershey",
  "mile": 2.5,
  "detourMiles": 0.04
 },
 {
  "breweryId": 1197,
  "name": "Rotunda Brewing",
  "town": "Annville",
  "mile": 10.2,
  "detourMiles": 0
 },
 {
  "breweryId": 1218,
  "name": "Snitz Creek Brewery",
  "town": "Lebanon",
  "mile": 15.2,
  "detourMiles": 0.02
 },
 {
  "breweryId": 1082,
  "name": "Hidden River Brewing Co",
  "town": "Douglassville",
  "mile": 57.3,
  "detourMiles": 0.01
 },
 {
  "breweryId": 1217,
  "name": "Sly Fox Brewing Co",
  "town": "Pottstown",
  "mile": 60.8,
  "detourMiles": 1.47
 },
 {
  "breweryId": 1196,
  "name": "Root Down Brewing Company",
  "town": "Phoenixville",
  "mile": 73.4,
  "detourMiles": 2.4
 },
 {
  "breweryId": 1228,
  "name": "Stable 12 Brewing Company",
  "town": "Phoenixville",
  "mile": 73.4,
  "detourMiles": 2.72
 },
 {
  "breweryId": 1216,
  "name": "Sly Fox Brewhouse and Eatery",
  "town": "Phoenixville",
  "mile": 73.5,
  "detourMiles": 2.77
 },
 {
  "breweryId": 1115,
  "name": "La Cabra Brewing",
  "town": "Berwyn",
  "mile": 82.4,
  "detourMiles": 3.02
 },
 {
  "breweryId": 1020,
  "name": "Conshohocken Brewing - Bridgeport",
  "town": "Bridgeport",
  "mile": 82.4,
  "detourMiles": 3.66
 }
];

export const US_422: RoadConfig = {
  slug: 'us-422',
  name: 'US Route 422',
  shortName: 'US 422',
  // Editorial approval to publish. Set true on 2026-11-22 after the pre-launch review round: every listed stop carries
  // operating evidence (printed visiting hours read on its own site that day), the source verifier passes, and the page
  // states how many nearby directory breweries we reached a decision on. Set it false to take the road down everywhere.
  publish: true,
  // Location identity: a stop is measured from coordinates tied to the address it prints (Census coordinates for
  // that address, data/roads/us-422/geocodes.json, or the directory's point when the address is the directory's in
  // full), or it stays off. See addressMustMatch in src/lib/road-trip.ts for the exact order.
  addressMustMatch: true,
  // The page was public with 34 stops before the location rule was applied to it: the notice is generated from this.
  update: { date: '2026-11-22', what: 'We revised how we locate breweries using their published addresses.', previous: US_422_BEFORE_2026_11_22 },
  // Listed when within this straight-line distance of the road. Five miles is the low end of the "road-trip pace"
  // detours other route tools offer (see the research note "Single road brewery trips/landscape.md", section 7).
  maxDetourMiles: 5,
  gapNoteMiles: 15,
  geometry: { source: 'OpenStreetMap ways tagged as US 422, downloaded through the Overpass API', downloaded: '2026-11-22' },
  about: 'US 422 is one number on two roads that do not meet. The western one runs from downtown Cleveland, Ohio, east to Ebensburg, Pennsylvania. The eastern one is entirely in Pennsylvania, from Hershey east to King of Prussia, near Philadelphia. This page treats them as two legs.',
  methodNotes: [
      ],
  roadSources: [
    { quote: 'split into two segments in the U.S. states of Ohio and Pennsylvania', url: WIKI, checked: C },
    { quote: 'The western segment of US 422 runs from downtown Cleveland, Ohio, east to Ebensburg, Pennsylvania.', url: WIKI, checked: C },
    { quote: 'The eastern segment, located entirely within Pennsylvania, runs from Hershey east to King of Prussia, near Philadelphia.', url: WIKI, checked: C },
  ],
  legs: [
    {
      id: 'west', from: 'Cleveland, Ohio', to: 'Ebensburg, Pennsylvania',
      // The ends are the westernmost and easternmost mapped points of this stretch.
      start: [41.4990263, -81.6931177], end: [40.4894018, -78.7476757], lonRange: [-82.5, -77.5],
      // Stretches are cut where the directory's breweries thin out, so each one is a cluster you could reach in one
      // go. A stretch is named on the page by the towns of its stops (or by its miles when it has none).
      segments: [
        { id: 'cleveland', toMile: 12, link: { href: '/trails/downtown-cleveland', text: 'On foot instead: the Downtown Cleveland Brewery Walk' } },
        { id: 'chagrin', toMile: 45 },
        { id: 'mahoning', toMile: 72 },
        { id: 'lawrence', toMile: 100 },
        { id: 'butler', toMile: 140 },
        { id: 'indiana-ebensburg', toMile: null },
      ],
    },
    {
      id: 'east', from: 'Hershey, Pennsylvania', to: 'King of Prussia, Pennsylvania',
      start: [40.2637645, -76.6901929], end: [40.081938, -75.408529], lonRange: [-77.5, -75],
      segments: [
        { id: 'hershey-lebanon', toMile: 30 },
        { id: 'reading', toMile: 52 },
        { id: 'schuylkill', toMile: null },
      ],
    },
  ],
};
