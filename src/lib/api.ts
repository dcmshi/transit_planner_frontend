import type { components, operations } from "@/types/api";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Route scoring can take up to a minute on a cold backend cache; time out
// rather than hanging forever if the backend stalls.
const REQUEST_TIMEOUT_MS = 90_000;

function withTimeout(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

async function apiFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal: withTimeout(signal) });
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
  health: (signal?: AbortSignal): Promise<HealthResponse> =>
    apiFetch("/health", signal),

  stops: (query: string, signal?: AbortSignal): Promise<StopResult[]> =>
    apiFetch(`/stops?query=${encodeURIComponent(query)}`, signal),

  routes: async (
    params: {
      origin: string;
      destination: string;
      departure_time?: string;
      travel_date?: string;
      explain?: boolean;
    },
    signal?: AbortSignal,
  ): Promise<RoutesResponse> => {
    const qs = new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
      ...(params.departure_time && { departure_time: params.departure_time }),
      ...(params.travel_date && { travel_date: params.travel_date }),
      // Only send explain when true — backend treats absence as false
      ...(params.explain === true && { explain: "true" }),
    });
    const res = await fetch(`${API_BASE}/routes?${qs}`, { signal: withTimeout(signal) });
    // 404 means no routes found for this origin/destination, not a real error
    if (res.status === 404) return { routes: [] };
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return res.json() as Promise<RoutesResponse>;
  },
};
