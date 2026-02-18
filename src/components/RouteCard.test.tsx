import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RouteCard } from "./RouteCard";
import type { ScoredRoute, WalkLeg } from "@/lib/api";

function makeRoute(overrides: Partial<ScoredRoute> = {}): ScoredRoute {
  return {
    legs: [],
    total_travel_seconds: 5400, // 1h 30m
    transfers: 2,
    total_walk_metres: 350,
    risk_score: 0.5,
    risk_label: "Medium",
    ...overrides,
  };
}

const walkLeg: WalkLeg = {
  kind: "walk",
  from_stop_id: "A",
  to_stop_id: "B",
  from_stop_name: "Stop A",
  to_stop_name: "Stop B",
  distance_m: 150,
  walk_seconds: 120,
  risk: null,
};

describe("RouteCard", () => {
  it("renders the risk badge, duration, transfer count, and walk distance", () => {
    render(<RouteCard route={makeRoute()} index={1} />);
    expect(screen.getByText("Medium risk")).toBeInTheDocument();
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
    expect(screen.getByText("2 transfers")).toBeInTheDocument();
    expect(screen.getByText("350 m walk")).toBeInTheDocument();
  });

  it("uses the singular 'transfer' when there is exactly one", () => {
    render(<RouteCard route={makeRoute({ transfers: 1 })} index={1} />);
    expect(screen.getByText("1 transfer")).toBeInTheDocument();
  });

  it("omits the transfers badge when transfers is 0", () => {
    render(<RouteCard route={makeRoute({ transfers: 0 })} index={1} />);
    expect(screen.queryByText(/transfer/i)).not.toBeInTheDocument();
  });

  it("omits the walk distance when total_walk_metres is 0", () => {
    render(<RouteCard route={makeRoute({ total_walk_metres: 0 })} index={1} />);
    expect(screen.queryByText(/walk/i)).not.toBeInTheDocument();
  });

  it("shows the 'Recommended' banner when recommended=true", () => {
    render(<RouteCard route={makeRoute()} index={1} recommended />);
    expect(screen.getByText("Recommended")).toBeInTheDocument();
  });

  it("does not show the 'Recommended' banner by default", () => {
    render(<RouteCard route={makeRoute()} index={1} />);
    expect(screen.queryByText("Recommended")).not.toBeInTheDocument();
  });

  it("expands to show leg details when the summary row is clicked", () => {
    render(<RouteCard route={makeRoute({ legs: [walkLeg], total_walk_metres: 150 })} index={1} />);
    expect(screen.queryByText(/Stop A to Stop B/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/Stop A to Stop B/i)).toBeInTheDocument();
    expect(screen.getByText("Walk 150 m")).toBeInTheDocument();
  });

  it("collapses leg details when the summary row is clicked again", () => {
    render(<RouteCard route={makeRoute({ legs: [walkLeg], total_walk_metres: 150 })} index={1} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/Stop A to Stop B/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText(/Stop A to Stop B/i)).not.toBeInTheDocument();
  });
});
