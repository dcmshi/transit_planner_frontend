import polyline from "@mapbox/polyline";
import type { components } from "@/types/api";

type LiveRisk = components["schemas"]["LiveRisk"];

/**
 * LiveRisk has grown twice now — time_bucket, then six reliability counters —
 * and each time every literal in the test suite stopped compiling. Build them
 * here so the next required field is one edit.
 */
export function makeLiveRisk(overrides: Partial<LiveRisk> = {}): LiveRisk {
  return {
    risk_score: 0.2,
    risk_label: "Low",
    modifiers: [],
    is_cancelled: false,
    time_bucket: "weekday_am_peak",
    scheduled_departures: 60,
    observed_departures: 51,
    total_delay_seconds: 4320,
    cancellation_count: 2,
    source: "seed",
    neutral_prior_used: false,
    ...overrides,
  };
}

/**
 * Encode [lon, lat] coordinates the way the API sends them.
 *
 * Google's polyline encoding is latitude-first while everything else in this
 * API is GeoJSON [lon, lat], so the swap is spelled out rather than assumed.
 */
export function encodeTrack(coordinates: [number, number][]): string {
  return polyline.encode(coordinates.map(([lon, lat]) => [lat, lon]));
}
