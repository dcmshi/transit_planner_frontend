"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    // Poll every 30s only while the graph isn't built yet; stop once healthy
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.gtfs.graph_built && data.reliability.records > 0) return false;
      return 30_000;
    },
    // Don't retry aggressively — backend may be starting up
    retry: 2,
    retryDelay: 3_000,
  });
}
