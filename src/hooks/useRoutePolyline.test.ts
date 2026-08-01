import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRoutePolyline } from "./useRoutePolyline";
import type { ScoredRoute, WalkLeg, TripLeg } from "@/lib/api";
import { encodeTrack, makeLiveRisk } from "@/test/fixtures";

function makeWalkLeg(overrides: Partial<WalkLeg> = {}): WalkLeg {
  return {
    kind: "walk",
    from_stop_id: "S1",
    to_stop_id: "S2",
    from_stop_name: "Origin Stop",
    to_stop_name: "Dest Stop",
    from_lat: 43.6,
    from_lon: -79.4,
    to_lat: 43.7,
    to_lon: -79.5,
    distance_m: 200,
    walk_seconds: 150,
    ...overrides,
  };
}

function makeTripLeg(overrides: Partial<TripLeg> = {}): TripLeg {
  return {
    kind: "trip",
    from_stop_id: "S1",
    to_stop_id: "S2",
    from_stop_name: "Origin Stop",
    to_stop_name: "Dest Stop",
    from_lat: 43.6,
    from_lon: -79.4,
    to_lat: 43.7,
    to_lon: -79.5,
    trip_id: "T1",
    route_id: "31",
    service_id: "SVC1",
    departure_time: "09:00:00",
    arrival_time: "09:30:00",
    travel_seconds: 1800,
    risk: makeLiveRisk({ risk_score: 0.1 }),
    ...overrides,
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

describe("useRoutePolyline", () => {
  it("returns null when no route is selected", () => {
    const { result } = renderHook(() => useRoutePolyline(null));
    expect(result.current).toBeNull();
  });

  it("builds a FeatureCollection from the coordinates on each leg", () => {
    const { result } = renderHook(() => useRoutePolyline(makeRoute([makeWalkLeg()])));
    expect(result.current?.type).toBe("FeatureCollection");
    // GeoJSON order is [lon, lat], not the [lat, lon] the API reports
    expect(result.current?.features[0]?.geometry.coordinates).toEqual([
      [-79.4, 43.6],
      [-79.5, 43.7],
    ]);
  });

  it("issues no requests — coordinates arrive with the route", () => {
    // Regression: intermediate stops used to be resolved one /stops search at
    // a time, five of them on a Guelph-to-Union route
    const fetchSpy = globalThis.fetch;
    let called = false;
    globalThis.fetch = (() => { called = true; throw new Error("unexpected fetch"); }) as typeof fetch;
    try {
      renderHook(() => useRoutePolyline(makeRoute([makeTripLeg(), makeWalkLeg()])));
    } finally {
      globalThis.fetch = fetchSpy;
    }
    expect(called).toBe(false);
  });

  it("draws a trip leg along its decoded track geometry", () => {
    const track: [number, number][] = [
      [-80.24714, 43.54381],
      [-80.1, 43.6],
      [-79.82242, 43.67512],
    ];
    const { result } = renderHook(() =>
      useRoutePolyline(makeRoute([makeTripLeg({ geometry: encodeTrack(track) })])),
    );
    expect(result.current?.features[0]?.geometry.coordinates).toEqual(track);
  });

  it("decodes longitude-first, not latitude-first", () => {
    // The encoding is lat-first while the rest of the API is [lon, lat].
    // Reading it the wrong way round puts this route in the Indian Ocean.
    const { result } = renderHook(() =>
      useRoutePolyline(makeRoute([makeTripLeg({
        geometry: encodeTrack([[-80.24714, 43.54381], [-79.82242, 43.67512]]),
      })])),
    );
    const [lon, lat] = result.current!.features[0].geometry.coordinates[0];
    expect(lon).toBeCloseTo(-80.24714, 4);
    expect(lat).toBeCloseTo(43.54381, 4);
  });

  it("falls back rather than crashing on a malformed polyline", () => {
    const { result } = renderHook(() =>
      useRoutePolyline(makeRoute([makeTripLeg({ geometry: "!!!not-a-polyline!!!" })])),
    );
    // Either it decoded to junk we rejected, or it threw and we fell back —
    // either way the chord is drawn and the map still renders
    expect(result.current?.features).toHaveLength(1);
  });

  it("falls back to the stop-to-stop chord when a trip has no shape", () => {
    const { result } = renderHook(() =>
      useRoutePolyline(makeRoute([makeTripLeg({ geometry: null })])),
    );
    expect(result.current?.features[0]?.geometry.coordinates).toEqual([
      [-79.4, 43.6],
      [-79.5, 43.7],
    ]);
  });

  it("mixes track and chord legs within one route", () => {
    // Coverage can be partial: the backend returns null geometry for trips
    // whose feed carries no shape
    const track: [number, number][] = [
      [-79.4, 43.6],
      [-79.45, 43.65],
      [-79.5, 43.7],
    ];
    const route = makeRoute([
      makeTripLeg({ geometry: encodeTrack(track) }),
      makeTripLeg({ geometry: null }),
      makeWalkLeg(),
    ]);
    const { result } = renderHook(() => useRoutePolyline(route));
    const coords = result.current?.features.map((f) => f.geometry.coordinates.length);
    expect(coords).toEqual([3, 2, 2]);
  });

  it("keeps walk legs as a straight chord even though they carry no geometry", () => {
    const walk = makeWalkLeg();
    expect(walk).not.toHaveProperty("geometry");
    const { result } = renderHook(() => useRoutePolyline(makeRoute([walk])));
    expect(result.current?.features[0]?.geometry.coordinates).toHaveLength(2);
  });

  it("accepts a two-point track — short straight stretches are real", () => {
    // Mount Pleasant to Bramalea genuinely reduces to two points; that is the
    // rail being straight, not truncation
    const track: [number, number][] = [
      [-79.82242, 43.67512],
      [-79.76349, 43.68703],
    ];
    const { result } = renderHook(() =>
      useRoutePolyline(makeRoute([makeTripLeg({ geometry: encodeTrack(track) })])),
    );
    expect(result.current?.features[0]?.geometry.coordinates).toEqual(track);
  });

  it("falls back when the geometry has too few points to draw", () => {
    const { result } = renderHook(() =>
      useRoutePolyline(makeRoute([makeTripLeg({ geometry: encodeTrack([[-79.4, 43.6]]) })])),
    );
    expect(result.current?.features[0]?.geometry.coordinates).toHaveLength(2);
  });

  it("skips a leg whose coordinates are missing", () => {
    const route = makeRoute([
      makeWalkLeg({ to_lat: null, to_lon: null }),
      makeWalkLeg({ from_stop_id: "S2", to_stop_id: "S3" }),
    ]);
    const { result } = renderHook(() => useRoutePolyline(route));
    expect(result.current?.features).toHaveLength(1);
  });

  it("skips a leg with no coordinate fields at all", () => {
    const bare = makeWalkLeg();
    delete bare.from_lat;
    delete bare.from_lon;
    const { result } = renderHook(() => useRoutePolyline(makeRoute([bare])));
    expect(result.current?.features).toHaveLength(0);
  });

  it("tags trip legs with their risk label and walk legs with null", () => {
    const route = makeRoute([
      makeTripLeg({ risk: makeLiveRisk({ risk_score: 0.9, risk_label: "High", time_bucket: "weekday_pm_peak" }) }),
      makeWalkLeg(),
    ]);
    const { result } = renderHook(() => useRoutePolyline(route));
    const features = result.current?.features ?? [];
    expect(features.find((f) => f.properties.kind === "trip")?.properties.riskLabel).toBe("High");
    expect(features.find((f) => f.properties.kind === "walk")?.properties.riskLabel).toBeNull();
  });

  it("defaults a trip leg with no risk to Low", () => {
    const { result } = renderHook(() => useRoutePolyline(makeRoute([makeTripLeg({ risk: null })])));
    expect(result.current?.features[0]?.properties.riskLabel).toBe("Low");
  });

  it("returns the same object identity across re-renders with an unchanged route", () => {
    // The map effect keys on identity — a fresh object per render would
    // re-apply setData on every unrelated page re-render
    const route = makeRoute([makeWalkLeg()]);
    const { result, rerender } = renderHook(({ r }) => useRoutePolyline(r), {
      initialProps: { r: route },
    });
    const first = result.current;
    rerender({ r: route });
    expect(result.current).toBe(first);
  });
});
