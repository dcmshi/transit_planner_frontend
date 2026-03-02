"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { RouteForm, type RouteQuery } from "@/components/RouteForm";
import { RouteList } from "@/components/RouteList";
import { LoadingRoutes } from "@/components/LoadingRoutes";
import { useRoutes } from "@/hooks/useRoutes";
import type { StopResult } from "@/lib/api";

const RouteMap = dynamic(
  () => import("@/components/RouteMap").then((m) => m.RouteMap),
  { ssr: false }
);

const STORAGE_KEY = "go-transit-last-stops";

export default function Home() {
  const [query, setQuery] = useState<RouteQuery | null>(null);

  const [savedStops] = useState<{ origin: StopResult | null; destination: StopResult | null }>(() => {
    if (typeof window === "undefined") return { origin: null, destination: null };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { origin: null, destination: null };
    } catch {
      return { origin: null, destination: null };
    }
  });

  const [mapStops, setMapStops] = useState<{
    origin: StopResult | null;
    destination: StopResult | null;
  }>({ origin: savedStops.origin, destination: savedStops.destination });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapStops));
    } catch {
      // Ignore quota errors — persistence is best-effort
    }
  }, [mapStops]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const { data, isFetching, isError, refetch, dataUpdatedAt } = useRoutes(query);

  const handleSubmit = (q: RouteQuery) => {
    setQuery(q);
    setSelectedRouteIndex(null);
  };

  const effectiveSelectedIndex = selectedRouteIndex ?? (data ? 0 : null);
  const selectedRoute = data?.routes[effectiveSelectedIndex ?? 0] ?? null;

  return (
    <div className="flex flex-col lg:flex-row lg:gap-6 lg:items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <RouteForm
          onSubmit={handleSubmit}
          isLoading={isFetching}
          onStopsChange={(origin, destination) => setMapStops({ origin, destination })}
          defaultOrigin={savedStops.origin}
          defaultDestination={savedStops.destination}
        />

        {isError && (
          <p className="text-sm text-red-600">
            Failed to fetch routes. Please try again.
          </p>
        )}

        {(() => {
          const isInitialLoading = isFetching && !data;
          const isRefreshing = isFetching && !!data;
          return (
            <>
              {isInitialLoading && <LoadingRoutes />}
              {data && (
                <RouteList
                  routes={data.routes}
                  explanation={data.explanation ?? undefined}
                  onRefresh={refetch}
                  dataUpdatedAt={dataUpdatedAt}
                  isRefreshing={isRefreshing}
                  selectedRouteIndex={effectiveSelectedIndex}
                  onSelectRoute={setSelectedRouteIndex}
                />
              )}
            </>
          );
        })()}
      </div>

      <div className="lg:w-[420px] lg:sticky lg:top-6 lg:self-start">
        <RouteMap
          origin={mapStops.origin}
          destination={mapStops.destination}
          selectedRoute={selectedRoute}
        />
      </div>
    </div>
  );
}
