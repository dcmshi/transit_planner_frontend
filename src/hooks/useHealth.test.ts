import { describe, it, expect } from "vitest";
import { healthRefetchInterval } from "./useHealth";
import type { HealthResponse } from "@/lib/api";

function health(graphBuilt: boolean, records: number): HealthResponse {
  return {
    gtfs: { graph_built: graphBuilt, last_built_at: null },
    reliability: { records, last_seeded_at: null },
  } as HealthResponse;
}

describe("healthRefetchInterval", () => {
  it("polls every 30s before the first response arrives", () => {
    expect(healthRefetchInterval(undefined)).toBe(30_000);
  });

  it("polls every 30s while the graph is not built", () => {
    expect(healthRefetchInterval(health(false, 100))).toBe(30_000);
  });

  it("polls every 30s while reliability data is missing", () => {
    expect(healthRefetchInterval(health(true, 0))).toBe(30_000);
  });

  it("keeps polling at 5 min once healthy, to detect later degradation", () => {
    expect(healthRefetchInterval(health(true, 100))).toBe(5 * 60_000);
  });
});
