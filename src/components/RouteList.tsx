import type { ScoredRoute } from "@/lib/api";
import { parseRecommendedIndex } from "@/lib/explanation";
import { ExplanationPanel } from "./ExplanationPanel";
import { RouteCard } from "./RouteCard";

interface Props {
  routes: ScoredRoute[];
  explanation?: string;
  onRefresh?: () => void;
  dataUpdatedAt?: number;
  isRefreshing?: boolean;
  selectedRouteIndex?: number | null;
  onSelectRoute?: (index: number) => void;
}

export function RouteList({ routes, explanation, onRefresh, dataUpdatedAt, isRefreshing, selectedRouteIndex, onSelectRoute }: Props) {
  if (routes.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-500">No routes found between those stops.</p>
        <p className="mt-1 text-xs text-gray-400">Try a different date, time, or stop pair.</p>
      </div>
    );
  }

  const recommendedIndex = explanation ? parseRecommendedIndex(explanation) : null;

  return (
    <div className="mt-6 flex flex-col gap-3">
      {explanation && <ExplanationPanel explanation={explanation} />}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {routes.length} route{routes.length !== 1 ? "s" : ""} found
        </p>
        {onRefresh && !!dataUpdatedAt && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Updated at{" "}
              {new Date(dataUpdatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh routes"
              className="rounded p-1 text-gray-400 hover:text-green-700 disabled:opacity-40 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              >
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.389Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
      {routes.map((route, i) => (
        <RouteCard
          key={i}
          route={route}
          index={i + 1}
          recommended={i === recommendedIndex}
          isSelected={i === selectedRouteIndex}
          onSelect={() => onSelectRoute?.(i)}
        />
      ))}
    </div>
  );
}
