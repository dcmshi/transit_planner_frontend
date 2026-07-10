import { describe, it, expect } from "vitest";
import { stopBounds } from "./mapBounds";
import type { StopResult } from "@/lib/api";

function stop(lon: number, lat: number): StopResult {
  return { stop_id: "S", stop_name: "Stop", lon, lat, routes_served: [] };
}

describe("stopBounds", () => {
  it("returns [southwest, northeast] when origin is southwest of destination", () => {
    expect(stopBounds(stop(-80.2, 43.5), stop(-79.4, 43.7))).toEqual([
      [-80.2, 43.5],
      [-79.4, 43.7],
    ]);
  });

  it("orders corners correctly when origin is east of destination", () => {
    // Regression: swapped corners make maplibre's fitBounds zoom out to the world
    expect(stopBounds(stop(-79.4, 43.7), stop(-80.2, 43.5))).toEqual([
      [-80.2, 43.5],
      [-79.4, 43.7],
    ]);
  });

  it("handles a mixed case (east but south)", () => {
    expect(stopBounds(stop(-79.4, 43.5), stop(-80.2, 43.7))).toEqual([
      [-80.2, 43.5],
      [-79.4, 43.7],
    ]);
  });
});
