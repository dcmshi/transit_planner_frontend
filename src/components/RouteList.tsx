import type { ScoredRoute } from "@/lib/api";
import { RouteCard } from "./RouteCard";

interface Props {
  routes: ScoredRoute[];
  explanation?: string;
}

export function RouteList({ routes, explanation }: Props) {
  if (routes.length === 0) {
    return (
      <p className="mt-6 text-sm text-gray-500">No routes found between those stops.</p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {explanation && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="mb-1 font-semibold">AI explanation</p>
          <p>{explanation}</p>
        </div>
      )}
      <p className="text-sm text-gray-500">
        {routes.length} route{routes.length !== 1 ? "s" : ""} found
      </p>
      {routes.map((route, i) => (
        <RouteCard key={i} route={route} index={i + 1} />
      ))}
    </div>
  );
}
