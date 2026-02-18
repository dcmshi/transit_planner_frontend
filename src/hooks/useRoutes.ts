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
    retry: 1,
  });
}
