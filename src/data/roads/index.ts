// The single-road trips. A road is listed, linked and served only when its config says publish: true AND at least one
// of its stops passes the gate (isShowableStop: found OPEN by a checker, with dated operating evidence and no date in
// the future). Every route, footer link, brewery-page card, /trails link, sitemap entry and llms.txt line asks
// availableRoads(), so there is one decision.
// The views are worked out when first asked for on a given day, never at module load: the gate compares check dates
// with today, and a Worker's clock is not set until it is handling a request.
import { currentDate, viewRoad, type RoadView } from '../../lib/road-trip';
import { US_422 } from './us-422';
import { US_422_BUILT } from './us-422.built';
import { ROUTE_66 } from './route-66';
import { ROUTE_66_BUILT } from './route-66.built';

let memo: { day: string; roads: RoadView[] } | null = null;
export function allRoads(today: string = currentDate()): RoadView[] {
  if (!memo || memo.day !== today) memo = { day: today, roads: [viewRoad(ROUTE_66, ROUTE_66_BUILT, today), viewRoad(US_422, US_422_BUILT, today)] };
  return memo.roads;
}

/** Roads with a page, the headline trip first. */
export const availableRoads = (roads: RoadView[] = allRoads()): RoadView[] =>
  roads.filter((r) => r.available).sort((a, b) => Number(!!b.config.headline) - Number(!!a.config.headline));
export const roadBySlug = (slug: string, roads: RoadView[] = allRoads()): RoadView | undefined => availableRoads(roads).find((r) => r.config.slug === slug);
/** The road trip a brewery is a listed stop on, if any (for the link from its own page). */
export const roadStopFor = (breweryId: number, roads: RoadView[] = allRoads()) => {
  for (const road of availableRoads(roads)) { const stop = road.stops.find((s) => s.breweryId !== undefined && s.breweryId === breweryId); if (stop) return { road, stop }; }
  return null;
};
