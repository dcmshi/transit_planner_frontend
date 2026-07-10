import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "./page";
import { useRoutes } from "@/hooks/useRoutes";
import { useStops } from "@/hooks/useStops";
import type { StopResult } from "@/lib/api";

vi.mock("@/components/RouteMap", () => ({
  RouteMap: () => <div data-testid="route-map" />,
}));
vi.mock("@/hooks/useRoutes");
vi.mock("@/hooks/useStops");

const mockUseRoutes = vi.mocked(useRoutes);
const mockUseStops = vi.mocked(useStops);

const origin: StopResult = {
  stop_id: "SA",
  stop_name: "Guelph Central Station",
  lat: 43.5,
  lon: -80.2,
  routes_served: [],
};
const destination: StopResult = {
  stop_id: "SB",
  stop_name: "Toronto Union Station",
  lat: 43.65,
  lon: -79.38,
  routes_served: [],
};

beforeEach(() => {
  localStorage.clear();
  mockUseStops.mockReturnValue({ data: [], isFetching: false } as unknown as ReturnType<typeof useStops>);
  mockUseRoutes.mockReturnValue({
    data: undefined,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
    dataUpdatedAt: 0,
    explanation: null,
  } as unknown as ReturnType<typeof useRoutes>);
});

describe("Home page", () => {
  it("restores persisted stops into the form inputs", async () => {
    // Regression: stops loaded from localStorage after hydration used to
    // appear only as map markers — the form inputs stayed empty and the
    // submit button stayed disabled
    localStorage.setItem("go-transit-last-stops", JSON.stringify({ origin, destination }));
    render(<Home />);

    expect(await screen.findByDisplayValue("Guelph Central Station")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Toronto Union Station")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find routes/i })).not.toBeDisabled();
  });

  it("submits the restored stops as a route query", async () => {
    localStorage.setItem("go-transit-last-stops", JSON.stringify({ origin, destination }));
    render(<Home />);
    await screen.findByDisplayValue("Guelph Central Station");

    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);

    const lastParams = mockUseRoutes.mock.calls.at(-1)?.[0];
    expect(lastParams).toMatchObject({ origin: "SA", destination: "SB" });
  });

  it("keeps the submit button disabled when nothing is persisted", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: /find routes/i })).toBeDisabled();
  });

  it("resets the route selection to the first route when a new query is submitted", async () => {
    localStorage.setItem("go-transit-last-stops", JSON.stringify({ origin, destination }));
    const makeRoute = () => ({
      legs: [],
      total_travel_seconds: 3600,
      transfers: 0,
      total_walk_metres: 0,
      risk_score: 0.1,
      risk_label: "Low",
    });
    mockUseRoutes.mockReturnValue({
      data: { routes: [makeRoute(), makeRoute()] },
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
      dataUpdatedAt: 1,
      explanation: null,
    } as unknown as ReturnType<typeof useRoutes>);
    render(<Home />);
    await screen.findByDisplayValue("Guelph Central Station");

    fireEvent.click(screen.getByRole("button", { name: /#2/ }));
    expect(screen.getByRole("button", { name: /#2/ })).toHaveAttribute("aria-pressed", "true");

    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);

    expect(screen.getByRole("button", { name: /#1/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /#2/ })).toHaveAttribute("aria-pressed", "false");
  });
});
