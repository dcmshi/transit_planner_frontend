import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "./page";
import { useRoutes } from "@/hooks/useRoutes";
import { useStops } from "@/hooks/useStops";
import { ApiError, type StopResult } from "@/lib/api";

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

  it("shows an onboarding hint before the first search", () => {
    render(<Home />);
    expect(screen.getByText(/pick two GO stations/i)).toBeInTheDocument();
  });

  it("replaces the onboarding hint once a search has been submitted", async () => {
    localStorage.setItem("go-transit-last-stops", JSON.stringify({ origin, destination }));
    render(<Home />);
    await screen.findByDisplayValue("Guelph Central Station");

    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);

    expect(screen.queryByText(/pick two GO stations/i)).not.toBeInTheDocument();
  });

  it("applies the explain toggle to the existing results without a resubmit", async () => {
    localStorage.setItem("go-transit-last-stops", JSON.stringify({ origin, destination }));
    render(<Home />);
    await screen.findByDisplayValue("Guelph Central Station");
    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);
    expect(mockUseRoutes.mock.calls.at(-1)?.[0]).toMatchObject({ explain: false });

    fireEvent.click(screen.getByRole("checkbox"));

    const params = mockUseRoutes.mock.calls.at(-1)?.[0];
    expect(params).toMatchObject({ origin: "SA", destination: "SB", explain: true });
  });

  it("passes no query to useRoutes before the first submit, even with explain on", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(mockUseRoutes.mock.calls.at(-1)?.[0]).toBeNull();
  });

  it("keeps the selection on the same route when a refetch reorders results", async () => {
    localStorage.setItem("go-transit-last-stops", JSON.stringify({ origin, destination }));
    const walkRoute = (from: string, to: string) => ({
      legs: [{
        kind: "walk", from_stop_id: from, to_stop_id: to,
        from_stop_name: from, to_stop_name: to, distance_m: 100, walk_seconds: 90,
      }],
      total_travel_seconds: 3600, transfers: 0, total_walk_metres: 100,
      risk_score: 0.1, risk_label: "Low",
    });
    const a = walkRoute("Stop A", "Stop B");
    const b = walkRoute("Stop C", "Stop D");
    const result = (routes: unknown[]) => ({
      data: { routes },
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
      dataUpdatedAt: 1,
      explanation: null,
    } as unknown as ReturnType<typeof useRoutes>);

    mockUseRoutes.mockReturnValue(result([a, b]));
    const { rerender } = render(<Home />);
    await screen.findByDisplayValue("Guelph Central Station");

    fireEvent.click(screen.getByRole("button", { name: /#2/ }));
    expect(screen.getByRole("button", { name: /#2/ })).toHaveAttribute("aria-pressed", "true");

    mockUseRoutes.mockReturnValue(result([b, a]));
    rerender(<Home />);

    // Route b moved to position 1 and the selection followed it there
    expect(screen.getByRole("button", { name: /#1/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /#2/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("explains a failed search and offers a retry that refetches", () => {
    const refetch = vi.fn();
    mockUseRoutes.mockReturnValue({
      data: undefined,
      isFetching: false,
      isError: true,
      error: new ApiError(500, "Internal Server Error"),
      refetch,
      dataUpdatedAt: 0,
      explanation: null,
    } as unknown as ReturnType<typeof useRoutes>);
    render(<Home />);

    expect(screen.getByRole("alert")).toHaveTextContent("HTTP 500");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("puts the map ahead of the results in source order for the mobile stack", () => {
    mockUseRoutes.mockReturnValue({
      data: { routes: [{
        legs: [], total_travel_seconds: 3600, transfers: 0,
        total_walk_metres: 0, risk_score: 0.1, risk_label: "Low",
      }] },
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
      dataUpdatedAt: 1,
      explanation: null,
    } as unknown as ReturnType<typeof useRoutes>);
    render(<Home />);

    const map = screen.getByTestId("route-map");
    const results = screen.getByText("1 route found");
    expect(map.compareDocumentPosition(results) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
