import { REQUEST_TIMEOUT_MS } from "@/lib/api";

const TIMEOUT_SECONDS = Math.round(REQUEST_TIMEOUT_MS / 1000);

export function LoadingRoutes() {
  return (
    <div role="status" className="mt-8 flex flex-col items-center gap-4 py-12 text-center">
      <div aria-hidden="true" className="h-10 w-10 animate-spin rounded-full border-4 border-accent-edge border-t-brand" />
      <div>
        <p className="text-sm font-medium text-n-700">Finding the best routes…</p>
        <p className="mt-1 text-xs text-n-400">
          Scoring reliability across all legs — this can take up to {TIMEOUT_SECONDS} seconds.
        </p>
      </div>
    </div>
  );
}
