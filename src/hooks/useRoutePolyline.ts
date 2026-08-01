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
 *
 * The API has no lookup-by-id endpoint, so each intermediate stop has to be
 * found through the name search. Queries are keyed by search name rather than
 * stop id so the platforms of one station — which share a name — cost a single
 * request between them. A `GET /stops/{id}` (or a batch endpoint) on the
 * backend would remove these searches entirely.
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

  const namesToFetch = useMemo(
    () => [...new Set(stopsToFetch.map(({ name }) => name))],
    [stopsToFetch],
  );

  const queries = useQueries({
    queries: namesToFetch.map((name) => ({
      queryKey: ["stops-search", name],
      queryFn: ({ signal }: { signal: AbortSignal }) => api.stops(name, signal),
      staleTime: Infinity,
    })),
  });

  const allSettled = !queries.some((q) => q.isPending);

  // Known coordinates from the stop-search selections, plus fetched ones
  const coords: Record<string, [number, number]> = {};
  if (origin)      coords[origin.stop_id]      = [origin.lon, origin.lat];
  if (destination) coords[destination.stop_id] = [destination.lon, destination.lat];

  const resultsByName = new Map(
    namesToFetch.map((name, i) => [name, queries[i]?.data ?? null] as const),
  );
  for (const { id, name } of stopsToFetch) {
    const hit = resultsByName.get(name)?.find((s) => s.stop_id === id);
    if (hit) coords[id] = [hit.lon, hit.lat];
  }

  // Stable fingerprint of the resolved coordinates — stands in for `coords`
  // (a new object every render) so the memo only invalidates when a lookup
  // actually resolves differently
  const dataKey = Object.entries(coords)
    .map(([id, [lon, lat]]) => `${id}:${lon},${lat}`)
    .join("|");

  return useMemo(() => {
    if (!route) return null;
    if (!allSettled) return undefined;
    // Legs with missing coords are skipped gracefully
    return buildFeatureCollection(route, coords);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- coords is captured by dataKey
  }, [route, allSettled, dataKey]);
}
