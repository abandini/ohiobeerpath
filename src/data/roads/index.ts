// The single-road trips. A road is listed, linked and served only when its config says publish: true AND at least one
// of its stops passes the gate (isShowableStop: found OPEN by a checker, with dated operating evidence and no date in
// the future). Every route, footer link, brewery-page card, /trails link, sitemap entry and llms.txt line asks
// availableRoads(), so there is one decision.
// The views are worked out when first asked for on a given day, never at module load: the gate compares check dates
// with today, and a Worker's clock is not set until it is handling a request.
// A road's dated updates (*.updates.ts) are records written once; they are attached here and never recomputed.
import { currentDate, viewRoad, type RoadView } from '../../lib/road-trip';
import { US_422 } from './us-422';
import { US_422_BUILT } from './us-422.built';
import { US_422_UPDATES } from './us-422.updates';
import { ROUTE_66 } from './route-66';
import { ROUTE_66_BUILT } from './route-66.built';
import { I_71 } from './i-71';
import { I_71_BUILT } from './i-71.built';
import { I_71_UPDATES } from './i-71.updates';
import { ROUTE_66_UPDATES } from './route-66.updates';

let memo: { day: string; roads: RoadView[] } | null = null;
export function allRoads(today: string = currentDate()): RoadView[] {
  if (!memo || memo.day !== today) memo = { day: today, roads: [{ ...viewRoad(ROUTE_66, ROUTE_66_BUILT, today), updates: ROUTE_66_UPDATES }, { ...viewRoad(I_71, I_71_BUILT, today), updates: I_71_UPDATES }, { ...viewRoad(US_422, US_422_BUILT, today), updates: US_422_UPDATES }] };
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
/** Every published road a brewery is a listed stop on (a Cleveland brewery can be on two). */
export const roadStopsFor = (breweryId: number, roads: RoadView[] = allRoads()) =>
  availableRoads(roads).flatMap((road) => { const stop = road.stops.find((s) => s.breweryId !== undefined && s.breweryId === breweryId); return stop ? [{ road, stop }] : []; });
