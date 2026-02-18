import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouteList } from "./RouteList";
import type { ScoredRoute } from "@/lib/api";

function makeRoute(overrides: Partial<ScoredRoute> = {}): ScoredRoute {
  return {
    legs: [],
    total_travel_seconds: 3600,
    transfers: 0,
    total_walk_metres: 0,
    risk_score: 0.1,
    risk_label: "Low",
    ...overrides,
  };
}

describe("RouteList", () => {
  it("shows the empty state when no routes are returned", () => {
    render(<RouteList routes={[]} />);
    expect(screen.getByText(/No routes found/i)).toBeInTheDocument();
    expect(screen.getByText(/Try a different date/i)).toBeInTheDocument();
  });

  it("shows the correct singular route count", () => {
    render(<RouteList routes={[makeRoute()]} />);
    expect(screen.getByText("1 route found")).toBeInTheDocument();
  });

  it("shows the correct plural route count", () => {
    render(<RouteList routes={[makeRoute(), makeRoute(), makeRoute()]} />);
    expect(screen.getByText("3 routes found")).toBeInTheDocument();
  });

  it("renders a numbered card for each route", () => {
    render(<RouteList routes={[makeRoute(), makeRoute(), makeRoute()]} />);
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  it("renders the explanation panel when an explanation is provided", () => {
    render(<RouteList routes={[makeRoute()]} explanation="Option 1 is fastest" />);
    expect(screen.getByText("AI explanation")).toBeInTheDocument();
  });

  it("does not render the explanation panel when no explanation is given", () => {
    render(<RouteList routes={[makeRoute()]} />);
    expect(screen.queryByText("AI explanation")).not.toBeInTheDocument();
  });
});
