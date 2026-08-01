import { describe, it, expect } from "vitest";
import { routeTimes } from "./routeTimes";
import type { ScoredRoute, TripLeg, WalkLeg } from "@/lib/api";

function trip(departure: string, arrival: string): TripLeg {
  return {
    kind: "trip",
    from_stop_id: "A",
    to_stop_id: "B",
    from_stop_name: "Stop A",
    to_stop_name: "Stop B",
    trip_id: "T1",
    route_id: "31",
    service_id: "SVC1",
    departure_time: departure,
    arrival_time: arrival,
    travel_seconds: 600,
    risk: null,
  };
}

const walk: WalkLeg = {
  kind: "walk",
  from_stop_id: "B",
  to_stop_id: "C",
  from_stop_name: "Stop B",
  to_stop_name: "Stop C",
  distance_m: 200,
  walk_seconds: 150,
};

function route(legs: ScoredRoute["legs"]): ScoredRoute {
  return {
    legs,
    total_travel_seconds: 4860,
    transfers: 0,
    total_walk_metres: 0,
    risk_score: 0.1,
    risk_label: "Low",
  };
}

describe("routeTimes", () => {
  it("spans the first departure to the last arrival", () => {
    expect(routeTimes(route([trip("06:26:00", "07:00:00"), trip("07:10:00", "07:47:00")])))
      .toEqual({ departure: "06:26:00", arrival: "07:47:00" });
  });

  it("ignores walk legs at the ends, which carry no clock times", () => {
    expect(routeTimes(route([walk, trip("06:26:00", "07:47:00"), walk])))
      .toEqual({ departure: "06:26:00", arrival: "07:47:00" });
  });

  it("returns null for a walk-only route", () => {
    expect(routeTimes(route([walk]))).toBeNull();
  });

  it("returns null for a route with no legs", () => {
    expect(routeTimes(route([]))).toBeNull();
  });
});
