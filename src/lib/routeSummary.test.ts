import { describe, it, expect } from "vitest";
import { routeSummary } from "./routeSummary";
import type { ScoredRoute, TripLeg, WalkLeg } from "@/lib/api";

function trip(overrides: Partial<TripLeg> = {}): TripLeg {
  return {
    kind: "trip",
    from_stop_id: "A",
    to_stop_id: "B",
    from_stop_name: "Guelph Central GO",
    to_stop_name: "Union Station GO",
    trip_id: "T1",
    route_id: "31",
    service_id: "SVC1",
    departure_time: "06:26:00",
    arrival_time: "07:47:00",
    travel_seconds: 4860,
    risk: null,
    ...overrides,
  };
}

const walk: WalkLeg = {
  kind: "walk",
  from_stop_id: "B",
  to_stop_id: "C",
  from_stop_name: "Union Station GO",
  to_stop_name: "Union Bus Terminal",
  distance_m: 200,
  walk_seconds: 150,
};

function route(legs: ScoredRoute["legs"], overrides: Partial<ScoredRoute> = {}): ScoredRoute {
  return {
    legs,
    total_travel_seconds: 4860,
    transfers: 0,
    total_walk_metres: 0,
    risk_score: 0.1,
    risk_label: "Low",
    ...overrides,
  };
}

describe("routeSummary", () => {
  it("describes a single trip leg with its stops and times", () => {
    expect(routeSummary(route([trip()]))).toBe(
      "Selected route, 1 leg: Route 31 from Guelph Central GO at 06:26 to " +
        "Union Station GO at 07:47. Total 1h 21m, Low risk.",
    );
  });

  it("describes walk legs by distance", () => {
    expect(routeSummary(route([trip(), walk]))).toContain(
      "walk 200 m from Union Station GO to Union Bus Terminal",
    );
  });

  it("collapses consecutive legs of the same trip into one description", () => {
    const summary = routeSummary(
      route([
        trip({ to_stop_name: "Bramalea GO", arrival_time: "07:05:00" }),
        trip({ from_stop_name: "Bramalea GO", departure_time: "07:05:00" }),
      ]),
    );
    expect(summary).toContain("1 leg:");
    expect(summary).toContain("from Guelph Central GO at 06:26 to Union Station GO at 07:47");
  });

  it("still reports the totals for a route with no legs", () => {
    expect(routeSummary(route([], { risk_label: "High" }))).toBe(
      "Selected route. Total 1h 21m, High risk.",
    );
  });
});
