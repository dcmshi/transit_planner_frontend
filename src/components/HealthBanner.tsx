"use client";

import { useHealth } from "@/hooks/useHealth";

export function HealthBanner() {
  const { data, isError, isPending } = useHealth();

  // Backend unreachable — only show if we have no prior successful response
  if (isError && !data) {
    return (
      <Banner variant="error">
        Cannot reach the backend. Make sure the GO Transit API is running at{" "}
        <code className="font-mono text-sm">{process.env.NEXT_PUBLIC_API_URL}</code>.
      </Banner>
    );
  }

  // Still loading on first fetch — don't flash a banner
  if (isPending) return null;

  // Backend up but graph not ready
  if (!data.gtfs.graph_built) {
    return (
      <Banner variant="warning">
        GTFS graph is still building. Route results will be available shortly.
        {data.gtfs.last_built_at === null && " (No graph has been built yet.)"}
      </Banner>
    );
  }

  // Reliability data not seeded
  if (data.reliability.records === 0) {
    return (
      <Banner variant="warning">
        Reliability data not yet seeded. Risk scores may be unavailable.
      </Banner>
    );
  }

  return null;
}

function Banner({
  variant,
  children,
}: {
  variant: "warning" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    warning: "bg-amber-50 border-amber-300 text-amber-900",
    error: "bg-red-50 border-red-300 text-red-900",
  };

  const icons = {
    warning: "⚠️",
    error: "🚫",
  };

  return (
    <div
      role="alert"
      className={`w-full border-b px-4 py-3 text-sm flex items-center gap-2 ${styles[variant]}`}
    >
      <span aria-hidden="true">{icons[variant]}</span>
      <span>{children}</span>
    </div>
  );
}
