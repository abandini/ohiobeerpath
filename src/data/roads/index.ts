// The single-road trips. A road is listed, linked and served only while at least one of its stops passes the gate
// (isShowableStop: found OPEN by a checker, with a quote, its source and the day it was read), so adding a road here
// before its rows are checked publishes nothing.
import { viewRoad, type RoadView } from '../../lib/road-trip';
import { US_422 } from './us-422';
import { US_422_BUILT } from './us-422.built';

export const ALL_ROADS: RoadView[] = [viewRoad(US_422, US_422_BUILT)];

/** Roads with a page, the headline trip first. */
export const availableRoads = (roads: RoadView[] = ALL_ROADS): RoadView[] =>
  roads.filter((r) => r.available).sort((a, b) => Number(!!b.config.headline) - Number(!!a.config.headline));
export const roadBySlug = (slug: string, roads: RoadView[] = ALL_ROADS): RoadView | undefined => availableRoads(roads).find((r) => r.config.slug === slug);
/** The road trip a brewery is a stop on, if any (for the link from its own page). */
export const roadStopFor = (breweryId: number, roads: RoadView[] = ALL_ROADS) => {
  for (const road of availableRoads(roads)) { const stop = road.stops.find((s) => s.breweryId === breweryId); if (stop) return { road, stop }; }
  return null;
};
