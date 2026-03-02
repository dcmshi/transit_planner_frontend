import { useQueries } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { api } from "@/lib/api";
import type { ScoredRoute, StopResult } from "@/lib/api";

type GeoJSON = ReturnType<typeof buildFeatureCollection>;
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

export function useRoutePolyline(
  route: ScoredRoute | null,
  origin: StopResult | null,
  destination: StopResult | null,
) {
  const lastGeojson = useRef<GeoJSON | null>(null);

  // Known coordinates from the stop-search selections
  const knownCoords: Record<string, [number, number]> = {};
  if (origin)      knownCoords[origin.stop_id]      = [origin.lon, origin.lat];
  if (destination) knownCoords[destination.stop_id] = [destination.lon, destination.lat];

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
    return [...all.entries()].map(([id, name]) => ({ id, name }));
  }, [route, origin?.stop_id, destination?.stop_id]);

  // Fetch each intermediate stop by name, match by stop_id
  const queries = useQueries({
    queries: stopsToFetch.map(({ id, name }) => ({
      queryKey: ["stop-by-id", id],
      queryFn: () =>
        api.stops(name).then((results) => results.find((s) => s.stop_id === id) ?? null),
      staleTime: Infinity,
      enabled: name.length >= 2,
    })),
  });

  // If route cleared, reset the cached value and clear the map
  if (!route) {
    lastGeojson.current = null;
    return null;
  }

  // While intermediate stop queries are in-flight, show the previous polyline
  // so the map doesn't flash empty between route selections
  const allSettled = queries.every((q) => !q.isPending);
  if (!allSettled) return lastGeojson.current;

  // Merge fetched coords into lookup
  const allCoords: Record<string, [number, number]> = { ...knownCoords };
  stopsToFetch.forEach(({ id }, i) => {
    const s = queries[i]?.data;
    if (s) allCoords[id] = [s.lon, s.lat];
  });

  // Build GeoJSON — legs with missing coords are skipped gracefully
  const geojson = buildFeatureCollection(route, allCoords);
  lastGeojson.current = geojson;
  return geojson;
}
