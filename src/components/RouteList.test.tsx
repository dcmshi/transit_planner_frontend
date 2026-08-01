import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RouteList } from "./RouteList";
import type { ScoredRoute, WalkLeg } from "@/lib/api";

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

  it("distinguishes a missed deadline from an absent connection", () => {
    render(<RouteList routes={[]} emptyReason="missed-deadline" />);
    expect(screen.getByText(/nothing arrives in time/i)).toBeInTheDocument();
    expect(screen.getByText(/try a later deadline/i)).toBeInTheDocument();
    expect(screen.queryByText(/No routes found/i)).not.toBeInTheDocument();
  });

  it("shows the correct singular route count", () => {
    render(<RouteList routes={[makeRoute()]} />);
    expect(screen.getByText("1 route found")).toBeInTheDocument();
  });

  it("shows the correct plural route count", () => {
    render(<RouteList routes={[makeRoute(), makeRoute(), makeRoute()]} />);
    expect(screen.getByText("3 routes found")).toBeInTheDocument();
  });

  it("keeps a card's expansion with its route when a refetch reorders results", () => {
    const walk = (from: string, to: string): WalkLeg => ({
      kind: "walk",
      from_stop_id: from,
      to_stop_id: to,
      from_stop_name: from,
      to_stop_name: to,
      distance_m: 100,
      walk_seconds: 90,
    });
    const a = makeRoute({ legs: [walk("Stop A", "Stop B")] });
    const b = makeRoute({ legs: [walk("Stop C", "Stop D")] });

    const { rerender } = render(<RouteList routes={[a, b]} />);
    fireEvent.click(screen.getAllByRole("button", { name: /route details/i })[1]);
    expect(screen.getByText(/Stop C to Stop D/)).toBeInTheDocument();

    rerender(<RouteList routes={[b, a]} />);

    // The expanded route moved to the front and took its expansion with it
    expect(screen.getByText(/Stop C to Stop D/)).toBeInTheDocument();
    const details = screen.getAllByRole("button", { name: /route details/i });
    expect(details[0]).toHaveAttribute("aria-expanded", "true");
    expect(details[1]).toHaveAttribute("aria-expanded", "false");
  });

  it("acknowledges a pending explanation so the toggle isn't a no-op", () => {
    render(<RouteList routes={[makeRoute()]} isExplanationPending />);
    expect(screen.getByText(/writing an explanation/i)).toBeInTheDocument();
  });

  it("drops the pending notice once the explanation arrives", () => {
    render(
      <RouteList routes={[makeRoute()]} explanation="Route 1 is best." isExplanationPending />
    );
    expect(screen.queryByText(/writing an explanation/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Route 1 is best/)).toBeInTheDocument();
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
