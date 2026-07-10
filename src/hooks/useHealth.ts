"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type HealthResponse } from "@/lib/api";

/**
 * Poll every 30s while unhealthy; slow to 5 min once healthy so we can
 * detect a subsequent degradation (reliability records drop, graph rebuilt).
 */
export function healthRefetchInterval(data: HealthResponse | undefined): number {
  if (data?.gtfs.graph_built && data.reliability.records > 0) return 5 * 60_000;
  return 30_000;
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => api.health(signal),
    refetchInterval: (query) => healthRefetchInterval(query.state.data),
    // Don't retry aggressively — backend may be starting up
    retry: 2,
    retryDelay: 3_000,
  });
}
