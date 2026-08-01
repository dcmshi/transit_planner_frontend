"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary. The client ErrorBoundary in layout.tsx catches
 * render errors inside the app shell; this catches the ones that escape it,
 * including errors thrown during navigation.
 */
export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error("Route error", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <p className="text-sm font-semibold text-red-900">Something went wrong</p>
      <p className="mt-1 text-sm text-red-800">
        The route planner failed to render. Trying again is usually enough.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-red-400">Reference: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
      >
        Try again
      </button>
    </div>
  );
}
