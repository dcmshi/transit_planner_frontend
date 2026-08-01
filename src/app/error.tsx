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
      className="rounded-xl border border-danger-edge bg-danger-surface px-6 py-10 text-center"
    >
      <p className="text-sm font-semibold text-danger-ink-strong">Something went wrong</p>
      <p className="mt-1 text-sm text-danger-ink">
        The route planner failed to render. Trying again is usually enough.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-danger-ink-soft">Reference: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-danger-solid px-4 py-2 text-sm font-semibold text-white hover:bg-danger-solid-strong"
      >
        Try again
      </button>
    </div>
  );
}
