import type { components, operations } from "@/types/api";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Route scoring can take a while on a cold backend cache; time out rather
// than hanging forever if the backend stalls. Exported so the loading copy
// quotes the same number instead of drifting from it.
export const REQUEST_TIMEOUT_MS = 90_000;

function withTimeout(signal?: AbortSignal): AbortSignal | undefined {
  // AbortSignal.timeout/any need Chrome 116+ / Firefox 124+ / Safari 17.4+ —
  // on older browsers degrade to no timeout rather than throwing pre-fetch
  if (typeof AbortSignal.timeout !== "function") return signal;
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  if (!signal) return timeout;
  return typeof AbortSignal.any === "function" ? AbortSignal.any([signal, timeout]) : signal;
}

/** Carries the HTTP status so callers can explain the failure without
 *  re-parsing the message. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, statusText: string) {
    super(`API ${status}: ${statusText}`);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal: withTimeout(signal) });
  if (!res.ok) {
    throw new ApiError(res.status, res.statusText);
  }
  return res.json() as Promise<T>;
}

// Convenience type aliases derived from the generated schema
export type HealthResponse = components["schemas"]["HealthResponse"];
export type AlertResult = components["schemas"]["AlertResult"];
export type StopResult = operations["search_stops_stops_get"]["responses"][200]["content"]["application/json"][number];
export type RoutesResponse = components["schemas"]["RoutesResponse"];
export type ScoredRoute = components["schemas"]["ScoredRoute"];
export type TripLeg = components["schemas"]["TripLeg"];
export type WalkLeg = components["schemas"]["WalkLeg"];

/**
 * Why a search came back empty. The backend returns 404 both when the stops
 * have no connection at all and when service exists but nothing meets an
 * arrive-by deadline — a distinction the empty state needs to make.
 */
export type EmptyReason = "no-connection" | "missed-deadline";

export type RoutesResult = RoutesResponse & { emptyReason?: EmptyReason };

export const api = {
  health: (signal?: AbortSignal): Promise<HealthResponse> =>
    apiFetch("/health", signal),

  stops: (query: string, signal?: AbortSignal): Promise<StopResult[]> =>
    apiFetch(`/stops?query=${encodeURIComponent(query)}`, signal),

  alerts: (signal?: AbortSignal): Promise<AlertResult[]> =>
    apiFetch("/alerts", signal),

  routes: async (
    params: {
      origin: string;
      destination: string;
      departure_time?: string;
      /** Latest acceptable arrival. The backend rejects this with
       *  departure_time — send one or the other, never both. */
      arrive_by?: string;
      travel_date?: string;
      explain?: boolean;
    },
    signal?: AbortSignal,
  ): Promise<RoutesResult> => {
    const qs = new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
      ...(params.departure_time && { departure_time: params.departure_time }),
      ...(params.arrive_by && { arrive_by: params.arrive_by }),
      ...(params.travel_date && { travel_date: params.travel_date }),
      // Only send explain when true — backend treats absence as false
      ...(params.explain === true && { explain: "true" }),
    });
    const res = await fetch(`${API_BASE}/routes?${qs}`, { signal: withTimeout(signal) });
    // 404 means no routes found, not a real error — but which kind of nothing
    // matters to the empty state. Match loosely: the backend's wording for the
    // missed-deadline case is expected to be polished.
    if (res.status === 404) {
      const detail = await res
        .json()
        .then((body) => String((body as { detail?: unknown })?.detail ?? ""))
        .catch(() => "");
      return {
        routes: [],
        emptyReason: /arrives by/i.test(detail) ? "missed-deadline" : "no-connection",
      };
    }
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    return res.json() as Promise<RoutesResult>;
  },
};
