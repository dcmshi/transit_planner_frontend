"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    // Poll every 30s while unhealthy; slow to 5 min once healthy so we can
    // detect a subsequent degradation (reliability records drop, graph rebuilt).
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.gtfs.graph_built && data.reliability.records > 0) return 5 * 60_000;
      return 30_000;
    },
    // Don't retry aggressively — backend may be starting up
    retry: 2,
    retryDelay: 3_000,
  });
}
