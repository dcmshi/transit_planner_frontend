"use client";

import { useId, useState } from "react";
import type { components } from "@/types/api";
import { riskBasis } from "@/lib/riskBasis";
import { formatDuration } from "@/lib/format";

type LiveRisk = components["schemas"]["LiveRisk"];

/**
 * Disclosure showing the counters behind a leg's risk score.
 *
 * A score with no visible basis is hard to trust. Everything here rides along
 * on the leg, so opening it costs nothing.
 */
export function RiskBasisPanel({ risk }: { risk: LiveRisk }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const basis = riskBasis(risk);

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="text-xs font-medium text-n-500 underline decoration-dotted underline-offset-2 hover:text-n-800"
      >
        Why {risk.risk_label.toLowerCase()} risk?
      </button>

      {open && (
        <dl id={panelId} className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <Row label="Based on">{basis.bucketLabel}</Row>

          {basis.hasHistory ? (
            <>
              <Row label="Ran">
                {basis.observed} of {basis.scheduled} scheduled
                {basis.observedShare !== null && (
                  <span className="text-n-400">
                    {" "}
                    ({Math.round(basis.observedShare * 100)}%)
                  </span>
                )}
              </Row>
              <Row label="Cancelled">{basis.cancellations}</Row>
              {basis.averageDelaySeconds !== null && (
                <Row label="Average delay">
                  {formatDuration(Math.round(basis.averageDelaySeconds))}
                </Row>
              )}
            </>
          ) : (
            <Row label="History">
              None recorded for this period yet — scored from a neutral prior.
            </Row>
          )}

          <Row label="Source">{basis.sourceLabel}</Row>
        </dl>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="whitespace-nowrap text-n-400">{label}</dt>
      <dd className="text-n-700 tabular-nums">{children}</dd>
    </>
  );
}
