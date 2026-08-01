"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { RouteForm, type RouteQuery } from "@/components/RouteForm";
import { RouteList } from "@/components/RouteList";
import { LoadingRoutes } from "@/components/LoadingRoutes";
import { useRoutes } from "@/hooks/useRoutes";
import { useSavedStops } from "@/hooks/useSavedStops";
import { routeKeys } from "@/lib/routeKey";

const RouteMap = dynamic(
  () => import("@/components/RouteMap").then((m) => m.RouteMap),
  { ssr: false }
);

export default function Home() {
  const [query, setQuery] = useState<RouteQuery | null>(null);
  const [stops, setStops] = useSavedStops();
  // Selection is tracked by route identity (not index) so it survives
  // background refetches that reorder the results
  const [selectedRouteKey, setSelectedRouteKey] = useState<string | null>(null);
  const { data, isFetching, isError, refetch, dataUpdatedAt, explanation } = useRoutes(query);

  const handleSubmit = (q: RouteQuery) => {
    setQuery(q);
    setSelectedRouteKey(null);
  };

  const keys = data ? routeKeys(data.routes) : [];
  let selectedIndex = selectedRouteKey ? keys.indexOf(selectedRouteKey) : -1;
  if (selectedIndex === -1 && data && data.routes.length > 0) selectedIndex = 0;
  const selectedRoute = selectedIndex >= 0 ? (data?.routes[selectedIndex] ?? null) : null;

  return (
    <div className="flex flex-col lg:flex-row lg:gap-6 lg:items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <RouteForm
          onSubmit={handleSubmit}
          isLoading={isFetching}
          origin={stops.origin}
          destination={stops.destination}
          onOriginChange={(origin) => setStops({ ...stops, origin })}
          onDestinationChange={(destination) => setStops({ ...stops, destination })}
        />

        {isError && (
          <p className="text-sm text-red-600">
            Failed to fetch routes. Please try again.
          </p>
        )}

        {!query && !isFetching && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 px-6 py-10 text-center">
            <p className="text-sm font-medium text-gray-600">
              Pick two GO stations to see reliability-scored routes.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Every leg is scored against historical and live service data, so
              the fastest option isn&apos;t always the one we recommend.
            </p>
          </div>
        )}

        {isFetching && !data && <LoadingRoutes />}
        {data && (
          <RouteList
            routes={data.routes}
            explanation={explanation ?? undefined}
            onRefresh={refetch}
            dataUpdatedAt={dataUpdatedAt}
            isRefreshing={isFetching && !!data}
            selectedRouteIndex={selectedIndex >= 0 ? selectedIndex : null}
            onSelectRoute={(i) => setSelectedRouteKey(keys[i] ?? null)}
            routeKeys={keys}
          />
        )}
      </div>

      <div className="lg:w-[420px] lg:sticky lg:top-6 lg:self-start">
        <RouteMap
          origin={stops.origin}
          destination={stops.destination}
          selectedRoute={selectedRoute}
        />
      </div>
    </div>
  );
}
