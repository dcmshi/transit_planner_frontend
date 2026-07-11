import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { StrictMode } from "react";
import { useSavedStops } from "./useSavedStops";
import type { StopResult } from "@/lib/api";

const KEY = "go-transit-last-stops";

function stop(id: string, name: string): StopResult {
  return { stop_id: id, stop_name: name, lat: 43.5, lon: -80.2, routes_served: [] };
}

beforeEach(() => {
  localStorage.clear();
});

describe("useSavedStops", () => {
  it("starts empty when nothing is persisted", () => {
    const { result } = renderHook(() => useSavedStops());
    expect(result.current[0]).toEqual({ origin: null, destination: null });
  });

  it("loads persisted stops after mount", () => {
    localStorage.setItem(KEY, JSON.stringify({ origin: stop("S1", "Guelph"), destination: stop("S2", "Union") }));
    const { result } = renderHook(() => useSavedStops());
    expect(result.current[0].origin?.stop_id).toBe("S1");
    expect(result.current[0].destination?.stop_id).toBe("S2");
  });

  it("does not clobber persisted stops on mount, even under StrictMode double effects", () => {
    // Regression: the old page-level effect pair wrote the initial empty
    // state to storage on mount, which permanently wiped the saved stops
    // when StrictMode re-ran the effects in dev
    const saved = JSON.stringify({ origin: stop("S1", "Guelph"), destination: stop("S2", "Union") });
    localStorage.setItem(KEY, saved);
    const { result } = renderHook(() => useSavedStops(), { wrapper: StrictMode });
    expect(localStorage.getItem(KEY)).toBe(saved);
    expect(result.current[0].origin?.stop_id).toBe("S1");
  });

  it("persists updates to storage and state", () => {
    const { result } = renderHook(() => useSavedStops());
    act(() => {
      result.current[1]({ origin: stop("S3", "Aberfoyle"), destination: null });
    });
    expect(result.current[0].origin?.stop_id).toBe("S3");
    expect(JSON.parse(localStorage.getItem(KEY)!).origin.stop_id).toBe("S3");
  });

  it("falls back to empty when storage holds corrupt JSON", () => {
    localStorage.setItem(KEY, "{not-json");
    const { result } = renderHook(() => useSavedStops());
    expect(result.current[0]).toEqual({ origin: null, destination: null });
  });

  it("drops a persisted stop with missing coordinates but keeps the valid one", () => {
    // Regression: a malformed stop used to flow into Marker.setLngLat and
    // crash the map into the error screen on every visit
    localStorage.setItem(
      KEY,
      JSON.stringify({ origin: { stop_id: "S1", stop_name: "A" }, destination: stop("S2", "B") }),
    );
    const { result } = renderHook(() => useSavedStops());
    expect(result.current[0].origin).toBeNull();
    expect(result.current[0].destination?.stop_id).toBe("S2");
  });

  it("defaults routes_served when the persisted stop lacks it", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        origin: { stop_id: "S1", stop_name: "A", lat: 43.5, lon: -80.2 },
        destination: null,
      }),
    );
    const { result } = renderHook(() => useSavedStops());
    expect(result.current[0].origin?.routes_served).toEqual([]);
  });

  it("rejects non-object persisted values", () => {
    localStorage.setItem(KEY, JSON.stringify("surprise"));
    const { result } = renderHook(() => useSavedStops());
    expect(result.current[0]).toEqual({ origin: null, destination: null });
  });
});
