import type { ScoredRoute } from "@/lib/api";

/**
 * Stable identity for a route derived from its legs, so React keys and the
 * selection state survive background refetches that reorder the results.
 */
export function routeKey(route: ScoredRoute): string {
  return (
    route.legs
      .map((leg) =>
        leg.kind === "trip"
          ? `t:${leg.trip_id}:${leg.from_stop_id}:${leg.to_stop_id}`
          : `w:${leg.from_stop_id}:${leg.to_stop_id}`,
      )
      .join("|") || "empty"
  );
}

/** Keys for a result set, with duplicates disambiguated by occurrence. */
export function routeKeys(routes: ScoredRoute[]): string[] {
  const seen = new Map<string, number>();
  return routes.map((route) => {
    const base = routeKey(route);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}#${n}`;
  });
}
