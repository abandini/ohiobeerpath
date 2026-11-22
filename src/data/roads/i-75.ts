// Interstate 75, Sault Ste. Marie to Richmond, Kentucky: a directory road like I-71. This file is the hand-written
// part. The stops are built by `node scripts/build-road-trip.mjs i-75` from the checkers' rows in data/roads/i-75/.
// Keep this file free of imports other than types (the build and verify scripts load it in plain Node).
//
// Plain text only: no Interstate shield and no logo (the shield is not among the public-domain sign designs).
//
// Where the mapped line stops, and why. The road data pulled for this page (data/roads/i-75/osm-ways.json) runs from
// the north end of I-75 at Sault Ste. Marie to a little way into Tennessee. The page uses it as far as Richmond,
// Kentucky: the most southerly directory listing within 5 miles of the road is in Richmond, and a mapped line that ran
// on to the state line would be about 100 more miles with nothing on it. The interstate itself continues to Florida.
import type { RoadConfig } from '../../lib/road-trip';

const WIKI = 'https://en.wikipedia.org/wiki/Interstate_75';
const C = '2026-11-22';

export const I_75: RoadConfig = {
  slug: 'i-75',
  name: 'Interstate 75',
  shortName: 'I-75',
  // Editorial approval to publish. Set true on 2026-11-22 under the rules the I-71 page passed review with: every
  // listed stop has operating evidence read on its own site, its printed address is tied to the coordinates it is
  // measured from, and the source verifier passes. Set it false to take the road down everywhere.
  publish: true,
  // Location identity: see addressMustMatch in src/lib/road-trip.ts for the exact order.
  addressMustMatch: true,
  interstate: true,
  // The Cincinnati and northern Kentucky listings are also on I-71: one record of each, taken from that road's folder.
  sharedRowsFrom: 'i-71',
  collapseLegs: true,
  maxDetourMiles: 5,
  gapNoteMiles: 20,
  geometry: { source: 'OpenStreetMap ways of the Interstate 75 route relations, downloaded through the Overpass API', downloaded: C },
  about: 'An independent list, not an official guide, of breweries near Interstate 75 from Sault Ste. Marie, Michigan south to Richmond, Kentucky, by way of Detroit, Toledo, Dayton, Cincinnati and Lexington, in five legs.',
  legsNote: 'These are editorial sections of one continuous interstate, divided where our mapped line crosses the Saginaw River at Zilwaukee, at the Michigan and Ohio state line, at the point on our mapped line nearest central Dayton, and at the Ohio River in Cincinnati. We assign each brewery to the leg containing its nearest mapped-road point, not by its town or state.',
  roadSources: [
    { quote: 'to Sault Ste. Marie, Michigan, at the Canada–United States border.', url: WIKI, checked: C },
  ],
  methodNotes: [
    'Where this page stops. Interstate 75 runs on south to Florida. This page follows it from its north end at Sault Ste. Marie as far as Richmond, Kentucky, because the most southerly listing in our directory within 5 straight-line miles of the road is in Richmond.',
    'Exit numbers. We do not give them. The road data we work from is the line of the road only and carries no exit numbers, so each stop is placed by its mile along our line instead. That mile is our measurement from the start of the leg, not a milepost and not an exit number.',
  ],
  legs: [
    {
      id: 'sault-saginaw', from: 'Sault Ste. Marie, Michigan', to: 'Zilwaukee, Michigan',
      // From the north end of the mapped road to where it crosses the Saginaw River (the Zilwaukee Bridge).
      start: [46.5084734, -84.3607231], end: [43.488024, -83.923686],
      segments: [
        { id: 'north', toMile: 200 },
        { id: 'saginaw-bay', toMile: null },
      ],
    },
    {
      id: 'saginaw-ohio-line', from: 'Zilwaukee, Michigan', to: 'the Ohio line',
      // To the Michigan and Ohio state line north of Toledo.
      start: [43.488024, -83.923686], end: [41.7320924, -83.4889935],
      segments: [
        { id: 'saginaw-flint', toMile: 50 },
        { id: 'oakland', toMile: 96 },
        { id: 'detroit', toMile: null },
      ],
    },
    {
      id: 'ohio-line-dayton', from: 'the Michigan line', to: 'Dayton, Ohio',
      // To the point nearest the centre of Dayton.
      start: [41.7320924, -83.4889935], end: [39.76097, -84.2009466],
      segments: [
        // Toledo, the south side of Dayton and Cincinnati are dense: within 2 miles is the list, 2 to 5 miles is shown apart.
        { id: 'toledo', toMile: 25, maxDetourMiles: 2, furtherOffMiles: 5 },
        { id: 'north-west-ohio', toMile: 140 },
        { id: 'dayton-north', toMile: null },
      ],
    },
    {
      id: 'dayton-cincinnati', from: 'Dayton, Ohio', to: 'Cincinnati, Ohio',
      // To the Ohio River at Cincinnati.
      start: [39.76097, -84.2009466], end: [39.090183, -84.5226652],
      segments: [
        { id: 'dayton-south', toMile: 17, maxDetourMiles: 2, furtherOffMiles: 5 },
        { id: 'butler-warren', toMile: 36 },
        { id: 'cincinnati', toMile: null, maxDetourMiles: 2, furtherOffMiles: 5 },
      ],
    },
    {
      id: 'cincinnati-richmond', from: 'Cincinnati, Ohio', to: 'Richmond, Kentucky',
      // From the Ohio River to the point on the mapped road nearest Richmond.
      start: [39.090183, -84.5226652], end: [37.75182, -84.320049],
      segments: [
        { id: 'northern-kentucky', toMile: 12 },
        { id: 'georgetown-lexington', toMile: null },
      ],
    },
  ],
};
