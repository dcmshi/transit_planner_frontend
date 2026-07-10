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
  // Key routes on the journey only — toggling `explain` must not refetch them
  const journey = params && {
    origin: params.origin,
    destination: params.destination,
    departure_time: params.departure_time,
    travel_date: params.travel_date,
  };

  const routesQuery = useQuery({
    queryKey: ["routes", journey],
    queryFn: ({ signal }) => api.routes(journey!, signal),
    enabled: journey !== null,
    staleTime: 60 * 60 * 1000, // 1 hr — matches backend cache TTL
    refetchInterval: 5 * 60 * 1000, // re-fetch every 5 min while results are shown
    refetchOnWindowFocus: true,      // silent refresh when user returns to tab
    retry: 1,
  });

  // The LLM explanation is expensive, so it lives in its own query that is
  // fetched once per journey and excluded from the background refresh cycle.
  const explanationQuery = useQuery({
    queryKey: ["routes-explanation", journey],
    queryFn: ({ signal }) => api.routes({ ...journey!, explain: true }, signal),
    enabled: journey !== null && params?.explain === true,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return { ...routesQuery, explanation: explanationQuery.data?.explanation ?? null };
}
