import { useMemo } from "react";
import type { ScoredRoute, TripLeg, WalkLeg } from "@/lib/api";

export type RoutePolyline = ReturnType<typeof buildFeatureCollection>;

type Leg = TripLeg | WalkLeg;
type Position = [number, number];

/** A leg's two endpoints, or null if the backend didn't supply both. */
function endpoints(leg: Leg): Position[] | null {
  const { from_lat, from_lon, to_lat, to_lon } = leg;
  if (from_lat == null || from_lon == null || to_lat == null || to_lon == null) return null;
  return [
    [from_lon, from_lat],
    [to_lon, to_lat],
  ];
}

function buildFeatureCollection(route: ScoredRoute) {
  const features = route.legs.flatMap((leg) => {
    const coordinates = endpoints(leg);
    if (!coordinates) return [];
    return [{
      type: "Feature" as const,
      properties: {
        kind:      leg.kind,
        riskLabel: leg.kind === "trip" ? (leg.risk?.risk_label ?? "Low") : null,
      },
      geometry: { type: "LineString" as const, coordinates },
    }];
  });
  return { type: "FeatureCollection" as const, features };
}

/**
 * Map GeoJSON for a route's legs, or null when nothing is selected.
 *
 * Every leg carries its own stop coordinates, so this is a pure derivation
 * with no fetching. It used to resolve each intermediate stop through
 * `GET /stops?query=<name>` and filter by id — five extra requests on a
 * Guelph-to-Union route, against a backend that rate-limits.
 */
export function useRoutePolyline(route: ScoredRoute | null): RoutePolyline | null {
  return useMemo(() => (route ? buildFeatureCollection(route) : null), [route]);
}
