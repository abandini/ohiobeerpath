// US Route 422, the first single-road trip. This file is the hand-written part: what the road is, how each leg is cut
// into stretches, and the sources for what the page says about the road itself. The stops are NOT written here: they
// are built from the checkers' rows by `node scripts/build-road-trip.mjs us-422` into us-422.built.ts.
// Keep this file free of imports other than types (the build and verify scripts load it in plain Node).
import type { RoadConfig } from '../../lib/road-trip';

const WIKI = 'https://en.wikipedia.org/wiki/U.S._Route_422';
const C = '2026-11-22';

export const US_422: RoadConfig = {
  slug: 'us-422',
  name: 'US Route 422',
  shortName: 'US 422',
  // Listed when within this straight-line distance of the road. Five miles is the low end of the "road-trip pace"
  // detours other route tools offer (see the research note "Single road brewery trips/landscape.md", section 7).
  maxDetourMiles: 5,
  gapNoteMiles: 15,
  geometry: { source: 'OpenStreetMap ways tagged as US 422, downloaded through the Overpass API', downloaded: '2026-11-22' },
  about: 'US 422 is one number on two roads that do not meet. The western one runs from downtown Cleveland, Ohio, east to Ebensburg, Pennsylvania. The eastern one is entirely in Pennsylvania, from Hershey east to King of Prussia, near Philadelphia. This page treats them as two legs.',
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
