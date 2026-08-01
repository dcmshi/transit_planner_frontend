import { MapPlaceholder } from "@/components/MapFrame";

/**
 * Route-level fallback. The planner is a client component behind a static
 * shell, so this is brief — it exists to hold the layout rather than let the
 * page appear empty mid-navigation.
 */
export default function Loading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
      <div
        role="status"
        aria-label="Loading the route planner"
        className="h-72 w-full animate-pulse rounded-xl border border-n-200 bg-n-0 shadow-sm"
      />
      <MapPlaceholder />
    </div>
  );
}
