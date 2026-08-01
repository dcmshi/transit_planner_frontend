import type { ScoredRoute } from "@/lib/api";
import { groupLegs } from "@/lib/groupLegs";
import { formatDistance, formatDuration, formatGtfsTime } from "@/lib/format";
import { routeLabel } from "@/lib/routeName";

/**
 * Text equivalent of what the map draws. The map is a canvas with no
 * accessible content of its own, so the selected route's legs are described
 * in a visually hidden summary beside it.
 */
export function routeSummary(route: ScoredRoute): string {
  const legs = groupLegs(route.legs).map((group) =>
    group.kind === "trip"
      ? `${routeLabel(group.route_id).text} from ${group.from_stop_name} at ` +
        `${formatGtfsTime(group.departure_time)} to ${group.to_stop_name} at ` +
        `${formatGtfsTime(group.arrival_time)}`
      : `walk ${formatDistance(group.distance_m)} from ${group.from_stop_name} ` +
        `to ${group.to_stop_name}`,
  );

  const total = `Total ${formatDuration(route.total_travel_seconds)}, ${route.risk_label} risk.`;
  if (legs.length === 0) return `Selected route. ${total}`;
  return `Selected route, ${legs.length} leg${legs.length !== 1 ? "s" : ""}: ${legs.join("; ")}. ${total}`;
}
