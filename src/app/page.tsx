"use client";

import { useState } from "react";
import { RouteForm, type RouteQuery } from "@/components/RouteForm";
import { RouteList } from "@/components/RouteList";
import { useRoutes } from "@/hooks/useRoutes";

export default function Home() {
  const [query, setQuery] = useState<RouteQuery | null>(null);
  const { data, isFetching, isError } = useRoutes(query);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        GO Transit Reliability Router
      </h1>

      <RouteForm onSubmit={setQuery} isLoading={isFetching} />

      {isError && (
        <p className="mt-6 text-sm text-red-600">
          Failed to fetch routes. Please try again.
        </p>
      )}

      {data && (
        <RouteList routes={data.routes} explanation={data.explanation ?? undefined} />
      )}
    </main>
  );
}
