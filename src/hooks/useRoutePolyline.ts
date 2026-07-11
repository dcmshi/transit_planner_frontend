import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api";
import type { ScoredRoute, StopResult } from "@/lib/api";

export type RoutePolyline = ReturnType<typeof buildFeatureCollection>;

function buildFeatureCollection(
  route: ScoredRoute,
  allCoords: Record<string, [number, number]>,
) {
  const features = route.legs.flatMap((leg) => {
    const from = allCoords[leg.from_stop_id];
    const to   = allCoords[leg.to_stop_id];
    if (!from || !to) return [];
    return [{
      type: "Feature" as const,
      properties: {
        kind:      leg.kind,
        riskLabel: leg.kind === "trip" ? (leg.risk?.risk_label ?? "Low") : null,
      },
      geometry: { type: "LineString" as const, coordinates: [from, to] },
    }];
  });
  return { type: "FeatureCollection" as const, features };
}

/**
 * Resolve coordinates for a route's legs and build map GeoJSON.
 *
 * Returns:
 * - `null`      — no route selected; the map should clear its polyline
 * - `undefined` — coordinate lookups still in flight; the map should keep
 *                 whatever it is currently showing (prevents a flash of empty
 *                 map between route selections)
 * - GeoJSON     — all lookups settled; draw this
 */
export function useRoutePolyline(
  route: ScoredRoute | null,
  origin: StopResult | null,
  destination: StopResult | null,
): RoutePolyline | null | undefined {
  // Intermediate stops (transfer points) that need a coordinate lookup
  const stopsToFetch = useMemo(() => {
    if (!route) return [];
    const all = new Map<string, string>(); // stop_id → stop_name
    for (const leg of route.legs) {
      all.set(leg.from_stop_id, leg.from_stop_name);
      all.set(leg.to_stop_id,   leg.to_stop_name);
    }
    all.delete(origin?.stop_id      ?? "___");
    all.delete(destination?.stop_id ?? "___");
    return (
      [...all.entries()]
        .map(([id, name]) => ({ id, name }))
        // Names below the backend's search minimum can never resolve — drop
        // them here so no query sits disabled (and therefore pending) forever
        .filter(({ name }) => name.trim().length >= 2)
    );
  }, [route, origin?.stop_id, destination?.stop_id]);

  // Fetch each intermediate stop by name, match by stop_id
  const queries = useQueries({
    queries: stopsToFetch.map(({ id, name }) => ({
      queryKey: ["stop-by-id", id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        api.stops(name, signal).then((results) => results.find((s) => s.stop_id === id) ?? null),
      staleTime: Infinity,
    })),
  });

  const allSettled = !queries.some((q) => q.isPending);
  // Stable fingerprint of the resolved coordinates — stands in for the
  // queries array (new identity every render) so the memo only invalidates
  // when a lookup actually resolves differently
  const dataKey = queries
    .map((q) => (q.data ? `${q.data.stop_id}:${q.data.lon},${q.data.lat}` : "?"))
    .join("|");

  return useMemo(() => {
    if (!route) return null;
    if (!allSettled) return undefined;

    // Known coordinates from the stop-search selections, plus fetched ones
    const allCoords: Record<string, [number, number]> = {};
    if (origin)      allCoords[origin.stop_id]      = [origin.lon, origin.lat];
    if (destination) allCoords[destination.stop_id] = [destination.lon, destination.lat];
    stopsToFetch.forEach(({ id }, i) => {
      const s = queries[i]?.data;
      if (s) allCoords[id] = [s.lon, s.lat];
    });

    // Build GeoJSON — legs with missing coords are skipped gracefully
    return buildFeatureCollection(route, allCoords);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queries' consumed data is captured by dataKey
  }, [route, allSettled, stopsToFetch, origin, destination, dataKey]);
}
