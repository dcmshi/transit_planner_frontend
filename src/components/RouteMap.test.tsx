import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import type { ScoredRoute, StopResult } from "@/lib/api";

/** Every Map the component constructs, newest last. */
const maps: MockMap[] = [];

class MockMap {
  handlers: Record<string, ((payload?: unknown) => void)[]> = {};
  addSource = vi.fn();
  addLayer = vi.fn();
  getSource = vi.fn();
  fitBounds = vi.fn();
  flyTo = vi.fn();
  remove = vi.fn();

  constructor(public options: Record<string, unknown>) {
    maps.push(this);
  }
  on(event: string, cb: (payload?: unknown) => void) {
    (this.handlers[event] ??= []).push(cb);
  }
  emit(event: string, payload?: unknown) {
    this.handlers[event]?.forEach((cb) => cb(payload));
  }
}

class MockMarker {
  setLngLat() {
    return this;
  }
  addTo() {
    return this;
  }
  remove() {}
}

vi.mock("maplibre-gl", () => ({
  default: { Map: MockMap, Marker: MockMarker },
}));

vi.mock("@/hooks/useRoutePolyline", () => ({
  useRoutePolyline: () => null,
}));

const origin: StopResult = {
  stop_id: "S1",
  stop_name: "Guelph Central GO",
  lat: 43.54,
  lon: -80.25,
  routes_served: [],
};

const destination: StopResult = {
  stop_id: "S2",
  stop_name: "Union Station GO",
  lat: 43.64,
  lon: -79.38,
  routes_served: [],
};

const route: ScoredRoute = {
  legs: [
    {
      kind: "trip",
      from_stop_id: "S1",
      to_stop_id: "S2",
      from_stop_name: "Guelph Central GO",
      to_stop_name: "Union Station GO",
      trip_id: "T1",
      route_id: "31",
      service_id: "SVC1",
      departure_time: "06:26:00",
      arrival_time: "07:47:00",
      travel_seconds: 4860,
      risk: { risk_score: 0.1, risk_label: "Low", modifiers: [], is_cancelled: false },
    },
  ],
  total_travel_seconds: 4860,
  transfers: 0,
  total_walk_metres: 0,
  risk_score: 0.1,
  risk_label: "Low",
};

const { RouteMap } = await import("./RouteMap");

beforeEach(() => {
  maps.length = 0;
});

describe("RouteMap", () => {
  it("sizes itself with responsive classes rather than a fixed inline height", () => {
    render(<RouteMap origin={origin} destination={destination} />);
    const container = screen.getByTestId("route-map");
    expect(container.style.height).toBe("");
    expect(container.className).toContain("h-72");
    expect(container.className).toContain("lg:h-[480px]");
  });

  it("shows a fallback when the basemap fails before load", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<RouteMap origin={origin} destination={destination} />);
    expect(screen.queryByRole("alert")).toBeNull();

    act(() => maps.at(-1)!.emit("error", { error: new Error("tiles unreachable") }));

    expect(screen.getByRole("alert")).toHaveTextContent("Map unavailable");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("exposes the selected route as text inside a labelled region", () => {
    render(<RouteMap origin={origin} destination={destination} selectedRoute={route} />);
    const region = screen.getByRole("region", { name: "Route map" });
    expect(region).toHaveTextContent(
      "Route 31 from Guelph Central GO at 06:26 to Union Station GO at 07:47"
    );
  });

  it("says so when no route is selected", () => {
    render(<RouteMap origin={origin} destination={destination} />);
    expect(screen.getByRole("region", { name: "Route map" })).toHaveTextContent(
      "No route selected."
    );
  });

  it("ignores transient tile errors raised after the style has loaded", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<RouteMap origin={origin} destination={destination} />);
    const map = maps.at(-1)!;

    act(() => map.emit("load"));
    act(() => map.emit("error", { error: new Error("one tile 404'd") }));

    expect(screen.queryByRole("alert")).toBeNull();
    consoleError.mockRestore();
  });
});
