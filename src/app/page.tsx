"use client";

import { useState } from "react";
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

export default function Home() {
  const [query, setQuery] = useState<RouteQuery | null>(null);
  const [mapStops, setMapStops] = useState<{
    origin: StopResult | null;
    destination: StopResult | null;
  }>({ origin: null, destination: null });
  const { data, isFetching, isError } = useRoutes(query);

  return (
    <div className="flex flex-col lg:flex-row lg:gap-6 lg:items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <RouteForm
          onSubmit={setQuery}
          isLoading={isFetching}
          onStopsChange={(origin, destination) => setMapStops({ origin, destination })}
        />

        {isError && (
          <p className="text-sm text-red-600">
            Failed to fetch routes. Please try again.
          </p>
        )}

        {isFetching && <LoadingRoutes />}

        {!isFetching && data && (
          <RouteList routes={data.routes} explanation={data.explanation ?? undefined} />
        )}
      </div>

      <div className="lg:w-[420px] lg:sticky lg:top-6 lg:self-start">
        <RouteMap origin={mapStops.origin} destination={mapStops.destination} />
      </div>
    </div>
  );
}
