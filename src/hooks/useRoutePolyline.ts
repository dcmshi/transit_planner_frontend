import { useMemo } from "react";
import polyline from "@mapbox/polyline";
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

/**
 * The leg's stretch of track, when the backend has a usable shape for it.
 *
 * `geometry` is an encoded polyline. Google's encoding is latitude-first,
 * unlike every other coordinate this API returns, so decode via `toGeoJSON`
 * rather than `decode` — the latter yields [lat, lon] and would put the route
 * in the Indian Ocean.
 *
 * Absent on walk legs — GTFS has no geometry for those — and null for trips
 * whose feed carries no shape, so coverage can be partial within one route.
 * A single point can't draw a line, so it falls back with the rest.
 */
function trackGeometry(leg: Leg): Position[] | null {
  if (leg.kind !== "trip" || !leg.geometry) return null;
  let coordinates: Position[];
  try {
    coordinates = polyline.toGeoJSON(leg.geometry).coordinates as Position[];
  } catch {
    // A malformed string shouldn't take the whole map down with it
    return null;
  }
  return coordinates.length >= 2 ? coordinates : null;
}

function buildFeatureCollection(route: ScoredRoute) {
  const features = route.legs.flatMap((leg) => {
    // Track where we have it, straight stop-to-stop chord where we don't
    const coordinates = trackGeometry(leg) ?? endpoints(leg);
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
 * Trip legs are drawn along their actual track; walk legs, and trips whose
 * feed has no shape, fall back to a straight line between the two stops.
 * Every leg carries its own coordinates and geometry, so this is a pure
 * derivation with no fetching — it used to resolve each intermediate stop
 * through `GET /stops?query=<name>`, five extra requests on a
 * Guelph-to-Union route against a backend that rate-limits.
 */
export function useRoutePolyline(route: ScoredRoute | null): RoutePolyline | null {
  return useMemo(() => (route ? buildFeatureCollection(route) : null), [route]);
}
