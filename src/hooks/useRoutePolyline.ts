import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api";
import type { ScoredRoute, StopResult } from "@/lib/api";

export function useRoutePolyline(
  route: ScoredRoute | null,
  origin: StopResult | null,
  destination: StopResult | null,
) {
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

  // Wait for all fetches to settle before rendering
  const allSettled = queries.every((q) => !q.isPending);
  if (!route || !allSettled) return null;

  // Merge fetched coords into lookup
  const allCoords: Record<string, [number, number]> = { ...knownCoords };
  stopsToFetch.forEach(({ id }, i) => {
    const s = queries[i]?.data;
    if (s) allCoords[id] = [s.lon, s.lat];
  });

  // Build GeoJSON — legs with missing coords are skipped gracefully
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
