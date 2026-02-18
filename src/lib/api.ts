import type { components, operations } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// Convenience type aliases derived from the generated schema
export type HealthResponse = components["schemas"]["HealthResponse"];
export type StopResult = operations["search_stops_stops_get"]["responses"][200]["content"]["application/json"][number];
export type RoutesResponse = components["schemas"]["RoutesResponse"];
export type ScoredRoute = components["schemas"]["ScoredRoute"];
export type TripLeg = components["schemas"]["TripLeg"];
export type WalkLeg = components["schemas"]["WalkLeg"];

export const api = {
  health: (): Promise<HealthResponse> => apiFetch("/health"),

  stops: (query: string): Promise<StopResult[]> =>
    apiFetch(`/stops?query=${encodeURIComponent(query)}`),

  routes: async (params: {
    origin: string;
    destination: string;
    departure_time?: string;
    travel_date?: string;
    explain?: boolean;
  }): Promise<RoutesResponse> => {
    const qs = new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
      ...(params.departure_time && { departure_time: params.departure_time }),
      ...(params.travel_date && { travel_date: params.travel_date }),
      // Only send explain when true — backend treats absence as false
      ...(params.explain === true && { explain: "true" }),
    });
    const res = await fetch(`${API_BASE}/routes?${qs}`);
    // 404 means no routes found for this origin/destination, not a real error
    if (res.status === 404) return { routes: [] };
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return res.json() as Promise<RoutesResponse>;
  },
};
