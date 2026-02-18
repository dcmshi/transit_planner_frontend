import type { ScoredRoute } from "@/lib/api";
import { parseRecommendedIndex } from "@/lib/explanation";
import { ExplanationPanel } from "./ExplanationPanel";
import { RouteCard } from "./RouteCard";

interface Props {
  routes: ScoredRoute[];
  explanation?: string;
}

export function RouteList({ routes, explanation }: Props) {
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
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {routes.length} route{routes.length !== 1 ? "s" : ""} found
      </p>
      {routes.map((route, i) => (
        <RouteCard
          key={i}
          route={route}
          index={i + 1}
          recommended={i === recommendedIndex}
        />
      ))}
    </div>
  );
}
