import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StopSearch } from "./StopSearch";
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
  mockUseStops.mockReturnValue({ data: [], isFetching: false } as any);
});

describe("StopSearch", () => {
  it("renders the label and text input", () => {
    render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
    expect(screen.getByText("Origin")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("does not show the dropdown when input is fewer than 2 characters", () => {
    render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "G" } });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows the dropdown with results when input is 2 or more characters", () => {
    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as any);
    render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Gu" } });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("Guelph Central Station")).toBeInTheDocument();
  });

  it("shows served route numbers in the dropdown", () => {
    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as any);
    render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Gu" } });
    expect(screen.getByText(/31, 40/)).toBeInTheDocument();
  });

  it("shows 'No stops found' when results are empty and not fetching", () => {
    mockUseStops.mockReturnValue({ data: [], isFetching: false } as any);
    render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Gu" } });
    expect(screen.getByText("No stops found")).toBeInTheDocument();
  });

  it("calls onChange with the stop when a result is selected", () => {
    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as any);
    const onChange = vi.fn();
    render(<StopSearch label="Origin" value={null} onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Gu" } });
    fireEvent.pointerDown(screen.getByText("Guelph Central Station"));
    expect(onChange).toHaveBeenCalledWith(fakeStop);
  });

  it("calls onChange with null when the input is cleared", () => {
    const onChange = vi.fn();
    render(<StopSearch label="Origin" value={fakeStop} onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
