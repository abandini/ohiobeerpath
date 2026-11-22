// Interstate 71, Cleveland to Louisville: a directory road like US 422. This file is the hand-written part. The stops
// are built by `node scripts/build-road-trip.mjs i-71` from the checkers' rows in data/roads/i-71/.
// Keep this file free of imports other than types (the build and verify scripts load it in plain Node).
//
// Plain text only: no Interstate shield and no logo (the shield is not among the public-domain sign designs).
import type { RoadConfig } from '../../lib/road-trip';

const WIKI = 'https://en.wikipedia.org/wiki/Interstate_71';
const C = '2026-11-22';

export const I_71: RoadConfig = {
  slug: 'i-71',
  name: 'Interstate 71',
  shortName: 'I-71',
  // Editorial approval to publish. Set true on 2026-11-22: every listed stop has operating evidence read on its own
  // site, its printed address is tied to the coordinates it is measured from, and the source verifier passes. Set it
  // false to take the road down everywhere.
  publish: true,
  // Location identity: a stop is measured from coordinates tied to the address it prints (Census coordinates for
  // that address, data/roads/i-71/geocodes.json, or the directory's point when the address is the directory's in
  // full), or it stays off. See addressMustMatch in src/lib/road-trip.ts for the exact order.
  addressMustMatch: true,
  collapseLegs: true,          // about eighty stops: each leg opens on demand
  maxDetourMiles: 5,
  gapNoteMiles: 20,
  geometry: { source: 'OpenStreetMap ways of the Interstate 71 route relations, downloaded through the Overpass API', downloaded: C },
  about: 'Interstate 71 runs between Louisville, Kentucky and Cleveland, Ohio, by way of Cincinnati and Columbus. This page follows it from Cleveland south-west to Louisville in three legs, cut at Columbus and at Cincinnati. It is an independent list, not an official guide, and it is not every brewery near the road.',
  roadSources: [
    { quote: 'in Louisville, Kentucky, and its northern terminus at an interchange with I-90 in Cleveland, Ohio', url: WIKI, checked: C },
    { quote: 'Major metropolitan areas served by I-71 include Louisville, Cincinnati, Columbus, and Cleveland.', url: WIKI, checked: C },
  ],
  methodNotes: [
    'Exit numbers. We do not give them. The road data we work from is the line of the road only and carries no exit numbers, so each stop is placed by its mile along our line instead. That mile is our measurement from the start of the leg, not a milepost and not an exit number.',
    'Placing a brewery. A stop is measured from coordinates tied to the address the brewery prints. First choice: the US Census geocoder’s coordinates for that address, when the address it matched is the printed one in full (street number, direction, street name, suffix, town and state). Second: our directory’s map point, when the printed address is the directory’s address in full. A looser geocoder match is used only when it falls within a quarter of a mile of the directory’s point. A brewery with none of these is left off.',
  ],
  legs: [
    {
      id: 'cleveland-columbus', from: 'Cleveland, Ohio', to: 'Columbus, Ohio',
      // From the north end of the mapped road in Cleveland to the point nearest the centre of Columbus.
      start: [41.4793937, -81.6932405], end: [39.9528958, -83.0006124],
      segments: [
        // The four city cores are dense: within 2 miles is the list, 2 to 5 miles is shown apart as "a little further off".
        { id: 'cleveland', toMile: 10, maxDetourMiles: 2, furtherOffMiles: 5, link: { href: '/trails/downtown-cleveland', text: 'On foot instead: the Downtown Cleveland Brewery Walk' } },
        { id: 'south-of-cleveland', toMile: 45 },
        { id: 'mid-ohio', toMile: 122 },
        { id: 'columbus-north', toMile: null, maxDetourMiles: 2, furtherOffMiles: 5 },
      ],
    },
    {
      id: 'columbus-cincinnati', from: 'Columbus, Ohio', to: 'Cincinnati, Ohio',
      // To the Ohio River at Cincinnati.
      start: [39.9528958, -83.0006124], end: [39.092207, -84.5224889],
      segments: [
        { id: 'columbus-south', toMile: 10, maxDetourMiles: 2, furtherOffMiles: 5 },
        { id: 'south-west-ohio', toMile: 70 },
        { id: 'north-of-cincinnati', toMile: 93 },
        { id: 'cincinnati', toMile: null, maxDetourMiles: 2, furtherOffMiles: 5 },
      ],
    },
    {
      id: 'cincinnati-louisville', from: 'Cincinnati, Ohio', to: 'Louisville, Kentucky',
      start: [39.092207, -84.5224889], end: [38.2613512, -85.7338635],
      segments: [
        { id: 'northern-kentucky', toMile: 10, maxDetourMiles: 2, furtherOffMiles: 5 },
        { id: 'kentucky', toMile: 85 },
        { id: 'louisville', toMile: null, maxDetourMiles: 2, furtherOffMiles: 5 },
      ],
    },
  ],
};
