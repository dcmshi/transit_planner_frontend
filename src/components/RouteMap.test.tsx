import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { StopResult } from "@/lib/api";

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
});
