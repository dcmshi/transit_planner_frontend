"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { RouteForm, type RouteQuery } from "@/components/RouteForm";
import { RouteList } from "@/components/RouteList";
import { LoadingRoutes } from "@/components/LoadingRoutes";
import { useRoutes } from "@/hooks/useRoutes";
import { useSavedStops } from "@/hooks/useSavedStops";
import { routeKeys } from "@/lib/routeKey";
import { describeApiError } from "@/lib/apiError";

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
  // Kept outside `query` so toggling it re-evaluates the explanation query
  // against the results already on screen instead of waiting for a resubmit
  const [explain, setExplain] = useState(false);
  const { data, isFetching, isError, error, refetch, dataUpdatedAt, explanation, isExplanationPending } =
    useRoutes(query && { ...query, explain });

  const handleSubmit = (q: RouteQuery) => {
    setQuery(q);
    setSelectedRouteKey(null);
  };

  const keys = data ? routeKeys(data.routes) : [];
  let selectedIndex = selectedRouteKey ? keys.indexOf(selectedRouteKey) : -1;
  if (selectedIndex === -1 && data && data.routes.length > 0) selectedIndex = 0;
  const selectedRoute = selectedIndex >= 0 ? (data?.routes[selectedIndex] ?? null) : null;

  return (
    // Two columns from lg up; one below, where source order puts the map
    // directly under the form instead of behind a full-length results list
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <RouteForm
          onSubmit={handleSubmit}
          isLoading={isFetching}
          origin={stops.origin}
          destination={stops.destination}
          onOriginChange={(origin) => setStops({ ...stops, origin })}
          onDestinationChange={(destination) => setStops({ ...stops, destination })}
          onSwap={() => setStops({ origin: stops.destination, destination: stops.origin })}
          explain={explain}
          onExplainChange={setExplain}
        />
      </div>

      <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-6 lg:self-start">
        <RouteMap
          origin={stops.origin}
          destination={stops.destination}
          selectedRoute={selectedRoute}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-2">
        {isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4"
          >
            <p className="min-w-0 text-sm text-red-800">{describeApiError(error)}</p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="shrink-0 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-40"
            >
              {isFetching ? "Retrying…" : "Try again"}
            </button>
          </div>
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
            isExplanationPending={isExplanationPending}
            onRefresh={refetch}
            dataUpdatedAt={dataUpdatedAt}
            isRefreshing={isFetching && !!data}
            selectedRouteIndex={selectedIndex >= 0 ? selectedIndex : null}
            onSelectRoute={(i) => setSelectedRouteKey(keys[i] ?? null)}
            routeKeys={keys}
          />
        )}
      </div>
    </div>
  );
}
