import { describe, it, expect } from "vitest";
import { groupLegs } from "./groupLegs";
import type { TripLeg, WalkLeg } from "@/lib/api";

function makeTripLeg(overrides: Partial<TripLeg> = {}): TripLeg {
  return {
    kind: "trip",
    from_stop_id: "A",
    to_stop_id: "B",
    from_stop_name: "Stop A",
    to_stop_name: "Stop B",
    trip_id: "trip-1",
    route_id: "27",
    service_id: "service-1",
    departure_time: "09:00:00",
    arrival_time: "09:30:00",
    travel_seconds: 1800,
    risk: null,
    ...overrides,
  };
}

function makeWalkLeg(overrides: Partial<WalkLeg> = {}): WalkLeg {
  return {
    kind: "walk",
    from_stop_id: "B",
    to_stop_id: "C",
    from_stop_name: "Stop B",
    to_stop_name: "Stop C",
    distance_m: 200,
    walk_seconds: 180,
    risk: null,
    ...overrides,
  };
}

describe("groupLegs", () => {
  it("returns an empty array for no legs", () => {
    expect(groupLegs([])).toEqual([]);
  });

  it("leaves a single trip leg ungrouped with empty intermediate_stops", () => {
    const leg = makeTripLeg();
    const result = groupLegs([leg]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("trip");
    if (result[0].kind === "trip") {
      expect(result[0].intermediate_stops).toHaveLength(0);
    }
  });

  it("merges consecutive legs with the same trip_id", () => {
    const leg1 = makeTripLeg({ from_stop_name: "A", to_stop_name: "B", departure_time: "09:00:00", arrival_time: "09:15:00", travel_seconds: 900 });
    const leg2 = makeTripLeg({ from_stop_name: "B", to_stop_name: "C", departure_time: "09:15:00", arrival_time: "09:30:00", travel_seconds: 900 });
    const result = groupLegs([leg1, leg2]);

    expect(result).toHaveLength(1);
    const group = result[0];
    if (group.kind === "trip") {
      expect(group.from_stop_name).toBe("A");
      expect(group.to_stop_name).toBe("C");
      expect(group.arrival_time).toBe("09:30:00");
      expect(group.travel_seconds).toBe(1800);
      expect(group.intermediate_stops).toHaveLength(1);
    }
  });

  it("does not merge legs with different trip_ids", () => {
    const leg1 = makeTripLeg({ trip_id: "trip-1" });
    const leg2 = makeTripLeg({ trip_id: "trip-2" });
    expect(groupLegs([leg1, leg2])).toHaveLength(2);
  });

  it("does not merge trip legs separated by a walk", () => {
    const leg1 = makeTripLeg({ trip_id: "trip-1" });
    const walk = makeWalkLeg();
    const leg2 = makeTripLeg({ trip_id: "trip-1" });
    const result = groupLegs([leg1, walk, leg2]);
    expect(result).toHaveLength(3);
  });

  it("passes walk legs through unchanged", () => {
    const walk = makeWalkLeg();
    const result = groupLegs([walk]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("walk");
  });
});
