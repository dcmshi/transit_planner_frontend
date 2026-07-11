"use client";

import { useAlerts } from "@/hooks/useAlerts";

// The live feed regularly carries 20+ standing alerts (elevator outages
// etc.) — cap the strip at a few headlines so it stays a banner, not a page
const MAX_HEADERS = 3;

/**
 * Service-disruption strip under the health banner. Renders nothing while
 * loading, on error, or when there are no active alerts.
 */
export function AlertsBanner() {
  const { data: alerts } = useAlerts();
  if (!alerts || alerts.length === 0) return null;

  const headers = alerts.map((a) => a.header).filter(Boolean);
  const shown = headers.slice(0, MAX_HEADERS);
  const more = headers.length - shown.length;

  return (
    <div
      role="status"
      className="w-full border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-2"
    >
      <span aria-hidden="true">⚠️</span>
      <span>
        {alerts.length === 1
          ? shown[0] ?? "1 active service alert"
          : `${alerts.length} active service alerts: ${shown.join(" · ")}${more > 0 ? ` · +${more} more` : ""}`}
      </span>
    </div>
  );
}
