"use client";

import { useState } from "react";
import { useAlerts } from "@/hooks/useAlerts";
import { WarningIcon } from "./icons";

// The live feed regularly carries 20+ standing alerts (elevator outages
// etc.) — cap the strip at a few headlines so it stays a banner, not a page
const MAX_HEADERS = 3;

/**
 * Service-disruption strip under the health banner. Renders nothing while
 * loading, on error, or when there are no active alerts.
 */
export function AlertsBanner() {
  const { data: alerts } = useAlerts();
  const [expanded, setExpanded] = useState(false);
  if (!alerts || alerts.length === 0) return null;

  // The feed repeats identical headlines across stations ("Elevator out of
  // service" at each of them), so each distinct one is listed once and the
  // count reports what the reader can actually see
  const headers = [...new Set(alerts.map((a) => a.header).filter(Boolean))];
  if (headers.length === 0) return null;

  const hidden = headers.length - MAX_HEADERS;

  return (
    <div
      role="status"
      className="w-full border-b border-warn-edge bg-warn-surface px-4 py-3 text-sm text-warn-ink"
    >
      <div className="flex items-start gap-2">
        <WarningIcon className="mt-0.5 h-4 w-4" />
        <div className="min-w-0 flex-1">
          {headers.length === 1 ? (
            <span>{headers[0]}</span>
          ) : expanded ? (
            <>
              <span className="font-medium">{headers.length} active service alerts</span>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {headers.map((header) => (
                  <li key={header}>{header}</li>
                ))}
              </ul>
            </>
          ) : (
            <span>
              {headers.length} active service alerts:{" "}
              {headers.slice(0, MAX_HEADERS).join(" · ")}
            </span>
          )}
        </div>
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="shrink-0 whitespace-nowrap font-medium underline hover:text-warn-ink-strong"
          >
            {expanded ? "Show fewer" : `+${hidden} more`}
          </button>
        )}
      </div>
    </div>
  );
}
