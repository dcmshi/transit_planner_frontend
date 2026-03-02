"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface RouteParams {
  origin: string;
  destination: string;
  departure_time?: string;
  travel_date?: string;
  explain?: boolean;
}

export function useRoutes(params: RouteParams | null) {
  return useQuery({
    queryKey: ["routes", params],
    queryFn: () => api.routes(params!),
    enabled: params !== null,
    staleTime: 60 * 60 * 1000, // 1 hr — matches backend cache TTL
    refetchInterval: 5 * 60 * 1000, // re-fetch every 5 min while results are shown
    refetchOnWindowFocus: true,      // silent refresh when user returns to tab
    retry: 1,
  });
}
