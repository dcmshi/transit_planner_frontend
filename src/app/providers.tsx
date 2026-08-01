"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";

// Devtools are a development tool and live in devDependencies. Loading them
// through next/dynamic behind an inlined NODE_ENV check keeps the module out
// of the production graph entirely, rather than relying on tree-shaking to
// drop an unused top-level import.
const ReactQueryDevtools: React.ComponentType =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () => import("@tanstack/react-query-devtools").then((m) => m.ReactQueryDevtools),
        { ssr: false },
      )
    : () => null;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 60 * 1000, // 1 hour — matches backend cache TTL
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
