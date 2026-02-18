"use client";

import { useState } from "react";
import { RouteForm, type RouteQuery } from "@/components/RouteForm";
import { RouteList } from "@/components/RouteList";
import { LoadingRoutes } from "@/components/LoadingRoutes";
import { useRoutes } from "@/hooks/useRoutes";

export default function Home() {
  const [query, setQuery] = useState<RouteQuery | null>(null);
  const { data, isFetching, isError } = useRoutes(query);

  return (
    <>
      <RouteForm onSubmit={setQuery} isLoading={isFetching} />

      {isError && (
        <p className="mt-6 text-sm text-red-600">
          Failed to fetch routes. Please try again.
        </p>
      )}

      {isFetching && <LoadingRoutes />}

      {!isFetching && data && (
        <RouteList routes={data.routes} explanation={data.explanation ?? undefined} />
      )}
    </>
  );
}
