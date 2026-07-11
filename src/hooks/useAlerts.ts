"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Active GTFS-RT service alerts. Empty until the backend has RT polling
 * configured, so the banner simply never shows in static-only setups.
 */
export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: ({ signal }) => api.alerts(signal),
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
    retry: 1,
  });
}
