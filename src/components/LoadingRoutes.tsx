export function LoadingRoutes() {
  return (
    <div className="mt-8 flex flex-col items-center gap-4 py-12 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
      <div>
        <p className="text-sm font-medium text-gray-700">Finding the best routes…</p>
        <p className="mt-1 text-xs text-gray-400">
          Scoring reliability across all legs — this can take up to a minute.
        </p>
      </div>
    </div>
  );
}
