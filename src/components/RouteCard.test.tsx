import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RouteCard } from "./RouteCard";
import type { ScoredRoute, TripLeg, WalkLeg } from "@/lib/api";

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
};

const tripLeg: TripLeg = {
  kind: "trip",
  from_stop_id: "A",
  to_stop_id: "B",
  from_stop_name: "Stop A",
  to_stop_name: "Stop B",
  trip_id: "T1",
  route_id: "27",
  service_id: "20260710",
  departure_time: "09:00:00",
  arrival_time: "09:30:00",
  travel_seconds: 1800,
  risk: { risk_score: 0.2, risk_label: "Low", modifiers: [], is_cancelled: false },
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

  it("marks selection with a neutral dark ring, not a second accent colour", () => {
    render(<RouteCard route={makeRoute()} index={1} isSelected />);
    const card = screen.getByTestId("route-card");
    expect(card.className).toContain("ring-gray-900");
    expect(card.className).not.toContain("blue");
  });

  it("uses the green accent for the recommended card", () => {
    render(<RouteCard route={makeRoute()} index={1} recommended />);
    expect(screen.getByTestId("route-card").className).toContain("border-green-500");
  });

  it("keeps the Recommended label when the recommended card is also selected", () => {
    render(<RouteCard route={makeRoute()} index={1} recommended isSelected />);
    expect(screen.getByText("Recommended")).toBeInTheDocument();
    expect(screen.getByTestId("route-card").className).toContain("ring-gray-900");
  });

  it("expands to show leg details when the details button is clicked", () => {
    render(<RouteCard route={makeRoute({ legs: [walkLeg], total_walk_metres: 150 })} index={1} />);
    expect(screen.queryByText(/Stop A to Stop B/i)).not.toBeInTheDocument();
    const details = screen.getByRole("button", { name: /route details/i });
    expect(details).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(details);
    expect(details).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Stop A to Stop B/i)).toBeInTheDocument();
    expect(screen.getByText("Walk 150 m")).toBeInTheDocument();
  });

  it("collapses leg details when the details button is clicked again", () => {
    render(<RouteCard route={makeRoute({ legs: [walkLeg], total_walk_metres: 150 })} index={1} />);
    fireEvent.click(screen.getByRole("button", { name: /route details/i }));
    expect(screen.getByText(/Stop A to Stop B/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /route details/i }));
    expect(screen.queryByText(/Stop A to Stop B/i)).not.toBeInTheDocument();
  });

  it("clicking the summary selects the route without expanding it", () => {
    const onSelect = vi.fn();
    render(<RouteCard route={makeRoute({ legs: [walkLeg], total_walk_metres: 150 })} index={1} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /#1/ }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByText(/Stop A to Stop B/i)).not.toBeInTheDocument();
  });

  it("expanding and collapsing details does not re-select the route", () => {
    const onSelect = vi.fn();
    render(<RouteCard route={makeRoute({ legs: [walkLeg], total_walk_metres: 150 })} index={1} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /route details/i }));
    fireEvent.click(screen.getByRole("button", { name: /route details/i }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("headlines a line-like route id above the stop pair", () => {
    render(<RouteCard route={makeRoute({ legs: [tripLeg] })} index={1} />);
    fireEvent.click(screen.getByRole("button", { name: /route details/i }));
    const label = screen.getByText("Route 27");
    expect(label.className).toContain("text-green-700");
  });

  it("demotes an opaque route id instead of headlining it", () => {
    const opaque: TripLeg = { ...tripLeg, route_id: "06260926-GT" };
    render(<RouteCard route={makeRoute({ legs: [opaque] })} index={1} />);
    fireEvent.click(screen.getByRole("button", { name: /route details/i }));

    expect(screen.queryByText("Route 06260926-GT")).not.toBeInTheDocument();
    const fallback = screen.getByText("Route ID 06260926-GT");
    expect(fallback.className).toContain("text-gray-400");
    expect(fallback.className).not.toContain("uppercase");
  });

  it("shows live delay and expected times on a delayed trip leg", () => {
    const delayed: TripLeg = {
      ...tripLeg,
      live_delay_seconds: 420,
      expected_departure: "09:07:00",
      expected_arrival: "09:37:00",
    };
    render(<RouteCard route={makeRoute({ legs: [delayed] })} index={1} />);
    fireEvent.click(screen.getByRole("button", { name: /route details/i }));
    expect(screen.getByText(/Running ~7 min late — expected 09:07 – 09:37/)).toBeInTheDocument();
  });

  it("shows no delay line for an on-time trip leg", () => {
    render(<RouteCard route={makeRoute({ legs: [tripLeg] })} index={1} />);
    fireEvent.click(screen.getByRole("button", { name: /route details/i }));
    expect(screen.queryByText(/late/i)).not.toBeInTheDocument();
  });

  it("shows no delay line for a sub-minute delay", () => {
    const barelyLate: TripLeg = { ...tripLeg, live_delay_seconds: 45, expected_departure: "09:00:45" };
    render(<RouteCard route={makeRoute({ legs: [barelyLate] })} index={1} />);
    fireEvent.click(screen.getByRole("button", { name: /route details/i }));
    expect(screen.queryByText(/late/i)).not.toBeInTheDocument();
  });
});
