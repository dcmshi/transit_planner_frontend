import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

beforeEach(() => {
  mockUseStops.mockReturnValue({ data: [], isFetching: false } as ReturnType<typeof useStops>);
});

describe("RouteForm", () => {
  it("renders label, two text inputs, date, time, checkbox, submit button", () => {
    render(<RouteForm onSubmit={() => {}} />);
    expect(screen.getByText("Origin")).toBeInTheDocument();
    expect(screen.getByText("Destination")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/\d{2}:\d{2}/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find routes/i })).toBeInTheDocument();
  });

  it("submit button is disabled when no stops are selected", () => {
    render(<RouteForm onSubmit={() => {}} />);
    expect(screen.getByRole("button", { name: /find routes/i })).toBeDisabled();
  });

  it("submit button is enabled after selecting origin and destination", () => {
    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
    render(<RouteForm onSubmit={() => {}} />);

    const [originInput, destInput] = screen.getAllByRole("combobox");

    fireEvent.change(originInput, { target: { value: "Gu" } });
    fireEvent.pointerDown(screen.getAllByText("Guelph Central Station")[0]);

    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
    fireEvent.change(destInput, { target: { value: "Gu" } });
    fireEvent.pointerDown(screen.getAllByText("Guelph Central Station")[0]);

    expect(screen.getByRole("button", { name: /find routes/i })).not.toBeDisabled();
  });

  it("onSubmit payload has correct fields with explain: false by default", () => {
    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
    const onSubmit = vi.fn();
    render(<RouteForm onSubmit={onSubmit} />);

    const [originInput, destInput] = screen.getAllByRole("combobox");

    fireEvent.change(originInput, { target: { value: "Gu" } });
    fireEvent.pointerDown(screen.getAllByText("Guelph Central Station")[0]);

    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
    fireEvent.change(destInput, { target: { value: "Gu" } });
    fireEvent.pointerDown(screen.getAllByText("Guelph Central Station")[0]);

    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledOnce();
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.origin).toBe("ST001");
    expect(payload.destination).toBe("ST001");
    expect(payload.departure_time).toMatch(/^\d{2}:\d{2}$/);
    expect(payload.travel_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.explain).toBe(false);
  });

  it("checking the explain checkbox sends explain: true", () => {
    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
    const onSubmit = vi.fn();
    render(<RouteForm onSubmit={onSubmit} />);

    const [originInput, destInput] = screen.getAllByRole("combobox");

    fireEvent.change(originInput, { target: { value: "Gu" } });
    fireEvent.pointerDown(screen.getAllByText("Guelph Central Station")[0]);

    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
    fireEvent.change(destInput, { target: { value: "Gu" } });
    fireEvent.pointerDown(screen.getAllByText("Guelph Central Station")[0]);

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(screen.getByRole("button", { name: /find routes/i }).closest("form")!);

    expect(onSubmit.mock.calls[0][0].explain).toBe(true);
  });

  it("onStopsChange called with (stop, null) when origin is selected", () => {
    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
    const onStopsChange = vi.fn();
    render(<RouteForm onSubmit={() => {}} onStopsChange={onStopsChange} />);

    const [originInput] = screen.getAllByRole("combobox");
    fireEvent.change(originInput, { target: { value: "Gu" } });
    fireEvent.pointerDown(screen.getByText("Guelph Central Station"));

    expect(onStopsChange).toHaveBeenCalledWith(fakeStop, null);
  });

  it("default date matches today's local date", () => {
    render(<RouteForm onSubmit={() => {}} />);
    const today = new Date().toLocaleDateString("en-CA");
    const dateInput = screen.getByDisplayValue(today);
    expect(dateInput).toBeInTheDocument();
  });
});
