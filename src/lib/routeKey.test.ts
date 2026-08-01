import { describe, it, expect } from "vitest";
import { routeKey, routeKeys } from "./routeKey";
import type { ScoredRoute, TripLeg, WalkLeg } from "@/lib/api";

function makeTripLeg(tripId: string, fromId: string, toId: string): TripLeg {
  return {
    kind: "trip",
    trip_id: tripId,
    route_id: "31",
    service_id: "SVC1",
    from_stop_id: fromId,
    to_stop_id: toId,
    from_stop_name: fromId,
    to_stop_name: toId,
    departure_time: "09:00:00",
    arrival_time: "09:30:00",
    travel_seconds: 1800,
    risk: null,
  };
}

function makeWalkLeg(fromId: string, toId: string): WalkLeg {
  return {
    kind: "walk",
    from_stop_id: fromId,
    to_stop_id: toId,
    from_stop_name: fromId,
    to_stop_name: toId,
    distance_m: 100,
    walk_seconds: 90,
  };
}

function makeRoute(legs: ScoredRoute["legs"]): ScoredRoute {
  return {
    legs,
    total_travel_seconds: 1800,
    transfers: 0,
    total_walk_metres: 0,
    risk_score: 0.1,
    risk_label: "Low",
  };
}

describe("routeKey", () => {
  it("is stable for the same legs", () => {
    const a = makeRoute([makeTripLeg("T1", "S1", "S2"), makeWalkLeg("S2", "S3")]);
    const b = makeRoute([makeTripLeg("T1", "S1", "S2"), makeWalkLeg("S2", "S3")]);
    expect(routeKey(a)).toBe(routeKey(b));
  });

  it("differs when trips differ", () => {
    const a = makeRoute([makeTripLeg("T1", "S1", "S2")]);
    const b = makeRoute([makeTripLeg("T2", "S1", "S2")]);
    expect(routeKey(a)).not.toBe(routeKey(b));
  });

  it("handles a route with no legs", () => {
    expect(routeKey(makeRoute([]))).toBe("empty");
  });
});

describe("routeKeys", () => {
  it("returns one key per route", () => {
    const routes = [makeRoute([makeTripLeg("T1", "S1", "S2")]), makeRoute([makeTripLeg("T2", "S1", "S2")])];
    expect(routeKeys(routes)).toHaveLength(2);
  });

  it("disambiguates duplicate routes", () => {
    const routes = [makeRoute([]), makeRoute([]), makeRoute([])];
    const keys = routeKeys(routes);
    expect(new Set(keys).size).toBe(3);
  });

  it("assigns duplicates the same keys in the same order after a swap", () => {
    // Two routes with identical legs are indistinguishable to routeKey, so
    // the occurrence suffix is positional: swapping them is a no-op. That is
    // correct precisely because the cards render identically — but it does
    // mean per-card state stays with the position, not the object.
    const dup = () => makeRoute([makeTripLeg("T1", "S1", "S2")]);
    const [a, b] = [dup(), dup()];
    expect(routeKeys([a, b])).toEqual(routeKeys([b, a]));
  });

  it("does not distinguish routes that differ only outside the legs", () => {
    // Risk scores move on every live refetch; keying on them would defeat the
    // stability routeKey exists for. Documented limitation, not an oversight.
    const a = makeRoute([makeTripLeg("T1", "S1", "S2")]);
    const b = { ...makeRoute([makeTripLeg("T1", "S1", "S2")]), risk_score: 0.9, risk_label: "High" as const };
    expect(routeKey(a)).toBe(routeKey(b));
  });

  it("keeps a route's key stable when the result set is reordered", () => {
    const r1 = makeRoute([makeTripLeg("T1", "S1", "S2")]);
    const r2 = makeRoute([makeTripLeg("T2", "S1", "S2")]);
    const before = routeKeys([r1, r2]);
    const after = routeKeys([r2, r1]);
    expect(after[1]).toBe(before[0]);
    expect(after[0]).toBe(before[1]);
  });
});
