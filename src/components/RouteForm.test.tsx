import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { RouteForm } from "./RouteForm";
import { useStops } from "@/hooks/useStops";
import type { StopResult } from "@/lib/api";

vi.mock("@/hooks/useStops");

const mockUseStops = vi.mocked(useStops);

const fakeStop: StopResult = {
  stop_id: "ST001",
  stop_name: "Guelph Central Station",
  lat: 43.5,
  lon: -80.2,
  routes_served: ["31", "40"],
};

const fakeStop2: StopResult = {
  stop_id: "ST002",
  stop_name: "Toronto Union Station",
  lat: 43.65,
  lon: -79.38,
  routes_served: ["31"],
};

/** Stateful harness mirroring how page.tsx controls the stop props. */
function Harness({
  onSubmit = () => {},
  onStopsChange = () => {},
  initialOrigin = null,
  initialDestination = null,
}: {
  onSubmit?: (q: unknown) => void;
  onStopsChange?: (origin: StopResult | null, destination: StopResult | null) => void;
  initialOrigin?: StopResult | null;
  initialDestination?: StopResult | null;
}) {
  const [origin, setOrigin] = useState<StopResult | null>(initialOrigin);
  const [destination, setDestination] = useState<StopResult | null>(initialDestination);
  return (
    <RouteForm
      onSubmit={onSubmit}
      origin={origin}
      destination={destination}
      onOriginChange={(s) => { setOrigin(s); onStopsChange(s, destination); }}
      onDestinationChange={(s) => { setDestination(s); onStopsChange(origin, s); }}
    />
  );
}

function selectBothStops() {
  mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
  const [originInput, destInput] = screen.getAllByRole("combobox");

  fireEvent.change(originInput, { target: { value: "Gu" } });
  fireEvent.pointerDown(screen.getAllByText("Guelph Central Station")[0]);

  fireEvent.change(destInput, { target: { value: "Gu" } });
  fireEvent.pointerDown(screen.getAllByText("Guelph Central Station")[0]);
}

beforeEach(() => {
  mockUseStops.mockReturnValue({ data: [], isFetching: false } as unknown as ReturnType<typeof useStops>);
});

describe("RouteForm", () => {
  it("renders label, two text inputs, date, time, checkbox, submit button", () => {
    render(<Harness />);
    expect(screen.getByText("Origin")).toBeInTheDocument();
    expect(screen.getByText("Destination")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/\d{2}:\d{2}/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find routes/i })).toBeInTheDocument();
  });

  it("associates the Date and Departure time labels with their inputs", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Date")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("Departure time")).toHaveAttribute("type", "time");
  });

  it("submit button is disabled when no stops are selected", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: /find routes/i })).toBeDisabled();
  });

  it("submit button is enabled after selecting origin and destination", () => {
    render(<Harness />);
    selectBothStops();
    expect(screen.getByRole("button", { name: /find routes/i })).not.toBeDisabled();
  });

  it("displays stop names when the controlled props arrive after mount", () => {
    // Regression: persisted stops load from localStorage after hydration —
    // the form must reflect prop updates, not just mount-time values
    const { rerender } = render(
      <RouteForm onSubmit={() => {}} origin={null} destination={null} onOriginChange={() => {}} onDestinationChange={() => {}} />
    );
    expect(screen.getByRole("button", { name: /find routes/i })).toBeDisabled();

    rerender(
      <RouteForm onSubmit={() => {}} origin={fakeStop} destination={fakeStop2} onOriginChange={() => {}} onDestinationChange={() => {}} />
    );
    expect(screen.getByDisplayValue("Guelph Central Station")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Toronto Union Station")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find routes/i })).not.toBeDisabled();
  });

  it("onSubmit payload has correct fields with explain: false by default", () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    selectBothStops();

    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledOnce();
    const payload = onSubmit.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.origin).toBe("ST001");
    expect(payload.destination).toBe("ST001");
    expect(payload.departure_time).toMatch(/^\d{2}:\d{2}$/);
    expect(payload.travel_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.explain).toBe(false);
  });

  it("checking the explain checkbox sends explain: true", () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    selectBothStops();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);

    expect((onSubmit.mock.calls[0][0] as Record<string, unknown>).explain).toBe(true);
  });

  it("rejects a past travel date with an error instead of submitting", () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    selectBothStops();

    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2020-01-01" } });
    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/can't be in the past/i);

    // Correcting the date clears the error and allows submission
    const today = new Date().toLocaleDateString("en-CA");
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: today } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("requires a travel date", () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    selectBothStops();

    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "" } });
    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/choose a travel date/i);
  });

  it("requires a departure time", () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    selectBothStops();

    fireEvent.change(screen.getByLabelText("Departure time"), { target: { value: "" } });
    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/choose a departure time/i);
  });

  it("allows a past departure time today (shows the rest of the day's schedule)", () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    selectBothStops();

    fireEvent.change(screen.getByLabelText("Departure time"), { target: { value: "00:01" } });
    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("onOriginChange fires with the selected stop", () => {
    const onStopsChange = vi.fn();
    render(<Harness onStopsChange={onStopsChange} />);

    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
    const [originInput] = screen.getAllByRole("combobox");
    fireEvent.change(originInput, { target: { value: "Gu" } });
    fireEvent.pointerDown(screen.getByText("Guelph Central Station"));

    expect(onStopsChange).toHaveBeenCalledWith(fakeStop, null);
  });

  it("default date matches today's local date", () => {
    render(<Harness />);
    const today = new Date().toLocaleDateString("en-CA");
    expect(screen.getByDisplayValue(today)).toBeInTheDocument();
  });
});
