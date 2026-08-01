import type { components } from "@/types/api";

type LiveRisk = components["schemas"]["LiveRisk"];

export interface RiskBasis {
  /** The history window this score was drawn from, e.g. "Weekday AM peak". */
  bucketLabel: string;
  scheduled: number;
  observed: number;
  /** Share of scheduled departures that actually ran, or null if none scheduled. */
  observedShare: number | null;
  cancellations: number;
  /** Mean delay across the departures that ran, or null if none did. */
  averageDelaySeconds: number | null;
  sourceLabel: string;
  /** False when the score rests on a neutral prior rather than real counts. */
  hasHistory: boolean;
}

const SOURCE_LABELS: Record<string, string> = {
  seed: "Modelled baseline",
  mixed: "Observed history and modelled baseline",
  observed: "Observed history",
};

/** "weekday_am_peak" → "Weekday AM peak" */
function humanizeBucket(bucket: string): string {
  const words = bucket
    .split("_")
    .filter(Boolean)
    .map((word) => (word === "am" || word === "pm" ? word.toUpperCase() : word));
  if (words.length === 0) return "Unknown period";
  return words[0][0].toUpperCase() + words[0].slice(1) + (words.length > 1 ? " " + words.slice(1).join(" ") : "");
}

function humanizeSource(source: string | null): string {
  if (!source) return "Unknown source";
  return SOURCE_LABELS[source] ?? source[0].toUpperCase() + source.slice(1);
}

/**
 * The counters behind a leg's risk score, shaped for display.
 *
 * These arrive inline on the leg, so nothing is fetched — and because they
 * come from the same lookup the server scored against, they always describe
 * the score actually shown rather than a bucket the client guessed at.
 */
export function riskBasis(risk: LiveRisk): RiskBasis {
  // The counters are floats, not integers — the backend pro-rates them across
  // buckets, so a weekend figure arrives as 17.13051275419115. Round for
  // display, and derive the share from the rounded pair so the numbers on
  // screen agree with the percentage beside them.
  const scheduled = Math.round(risk.scheduled_departures);
  const observed = Math.round(risk.observed_departures);
  return {
    bucketLabel: humanizeBucket(risk.time_bucket),
    scheduled,
    observed,
    observedShare: scheduled > 0 ? observed / scheduled : null,
    cancellations: Math.round(risk.cancellation_count),
    // Averaged over the unrounded count, which is the more accurate divisor
    averageDelaySeconds:
      risk.observed_departures > 0 ? risk.total_delay_seconds / risk.observed_departures : null,
    sourceLabel: humanizeSource(risk.source),
    hasHistory: !risk.neutral_prior_used,
  };
}
