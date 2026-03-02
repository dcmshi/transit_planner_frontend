import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQueries } from "@tanstack/react-query";
import { useRoutePolyline } from "./useRoutePolyline";
import type { ScoredRoute, StopResult, WalkLeg, TripLeg } from "@/lib/api";

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQueries: vi.fn() };
});

const mockUseQueries = vi.mocked(useQueries);

const originStop: StopResult = {
  stop_id: "S1",
  stop_name: "Origin Stop",
  lat: 43.6,
  lon: -79.4,
  routes_served: [],
};

const destStop: StopResult = {
  stop_id: "S2",
  stop_name: "Dest Stop",
  lat: 43.7,
  lon: -79.5,
  routes_served: [],
};

function makeWalkLeg(fromId: string, fromName: string, toId: string, toName: string): WalkLeg {
  return {
    kind: "walk",
    from_stop_id: fromId,
    to_stop_id: toId,
    from_stop_name: fromName,
    to_stop_name: toName,
    distance_m: 200,
    walk_seconds: 150,
    risk: null,
  };
}

function makeTripLeg(fromId: string, fromName: string, toId: string, toName: string, riskLabel: "Low" | "Medium" | "High" = "Low"): TripLeg {
  return {
    kind: "trip",
    from_stop_id: fromId,
    to_stop_id: toId,
    from_stop_name: fromName,
    to_stop_name: toName,
    trip_id: "T1",
    route_id: "31",
    service_id: "SVC1",
    departure_time: "09:00:00",
    arrival_time: "09:30:00",
    travel_seconds: 1800,
    risk: { risk_score: 0.1, risk_label: riskLabel, modifiers: [], is_cancelled: false },
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

beforeEach(() => {
  mockUseQueries.mockReturnValue([]);
});

describe("useRoutePolyline", () => {
  it("returns null when route is null", () => {
    mockUseQueries.mockReturnValue([]);
    const { result } = renderHook(() => useRoutePolyline(null, originStop, destStop));
    expect(result.current).toBeNull();
  });

  it("returns null while a query is pending", () => {
    const route = makeRoute([makeWalkLeg("S1", "Origin Stop", "S2", "Dest Stop")]);
    mockUseQueries.mockReturnValue([{ isPending: true, data: undefined } as any]);
    const { result } = renderHook(() => useRoutePolyline(route, originStop, destStop));
    expect(result.current).toBeNull();
  });

  it("returns a FeatureCollection when all queries settled", () => {
    const route = makeRoute([makeWalkLeg("S1", "Origin Stop", "S2", "Dest Stop")]);
    mockUseQueries.mockReturnValue([]);
    const { result } = renderHook(() => useRoutePolyline(route, originStop, destStop));
    expect(result.current).not.toBeNull();
    expect(result.current?.type).toBe("FeatureCollection");
  });

  it("uses origin/destination coords directly without a query result", () => {
    const route = makeRoute([makeWalkLeg("S1", "Origin Stop", "S2", "Dest Stop")]);
    mockUseQueries.mockReturnValue([]);
    const { result } = renderHook(() => useRoutePolyline(route, originStop, destStop));
    const feature = result.current?.features[0];
    expect(feature?.geometry.coordinates[0]).toEqual([-79.4, 43.6]);
    expect(feature?.geometry.coordinates[1]).toEqual([-79.5, 43.7]);
  });

  it("uses intermediate stop coords from query result data", () => {
    const midStop: StopResult = { stop_id: "S3", stop_name: "Mid Stop", lat: 43.65, lon: -79.45, routes_served: [] };
    const route = makeRoute([
      makeTripLeg("S1", "Origin Stop", "S3", "Mid Stop"),
      makeTripLeg("S3", "Mid Stop", "S2", "Dest Stop"),
    ]);
    mockUseQueries.mockReturnValue([{ isPending: false, data: midStop } as any]);
    const { result } = renderHook(() => useRoutePolyline(route, originStop, destStop));
    expect(result.current).not.toBeNull();
    expect(result.current?.features).toHaveLength(2);
  });

  it("skips a leg when coord is missing", () => {
    const route = makeRoute([
      makeWalkLeg("S1", "Origin Stop", "S_UNKNOWN", "Unknown Stop"),
      makeWalkLeg("S_UNKNOWN", "Unknown Stop", "S2", "Dest Stop"),
    ]);
    mockUseQueries.mockReturnValue([{ isPending: false, data: null } as any]);
    const { result } = renderHook(() => useRoutePolyline(route, originStop, destStop));
    // Both legs involve S_UNKNOWN which has no coord, so they are skipped
    expect(result.current?.features).toHaveLength(0);
  });

  it("walk leg has kind='walk' and riskLabel=null; trip leg has kind='trip' with matching riskLabel", () => {
    const midStop: StopResult = { stop_id: "S3", stop_name: "Mid Stop", lat: 43.65, lon: -79.45, routes_served: [] };
    const route = makeRoute([
      makeTripLeg("S1", "Origin Stop", "S3", "Mid Stop", "High"),
      makeWalkLeg("S3", "Mid Stop", "S2", "Dest Stop"),
    ]);
    mockUseQueries.mockReturnValue([{ isPending: false, data: midStop } as any]);
    const { result } = renderHook(() => useRoutePolyline(route, originStop, destStop));
    const features = result.current?.features ?? [];
    const tripFeature = features.find((f) => f.properties.kind === "trip");
    const walkFeature = features.find((f) => f.properties.kind === "walk");
    expect(tripFeature?.properties.riskLabel).toBe("High");
    expect(walkFeature?.properties.riskLabel).toBeNull();
  });
});
