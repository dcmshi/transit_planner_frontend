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

const fakeStop2: StopResult = {
  stop_id: "ST002",
  stop_name: "Guelph Stone Road",
  lat: 43.52,
  lon: -80.21,
  routes_served: ["57"],
};

beforeEach(() => {
  mockUseStops.mockReturnValue({ data: [], isFetching: false } as ReturnType<typeof useStops>);
});

describe("StopSearch", () => {
  it("renders the label and text input", () => {
    render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
    expect(screen.getByText("Origin")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("does not show the dropdown when input is fewer than 2 characters", () => {
    render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "G" } });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows the dropdown with results when input is 2 or more characters", () => {
    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
    render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Gu" } });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("Guelph Central Station")).toBeInTheDocument();
  });

  it("shows served route numbers in the dropdown", () => {
    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
    render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Gu" } });
    expect(screen.getByText(/31, 40/)).toBeInTheDocument();
  });

  it("shows 'No stops found' when results are empty and not fetching", () => {
    mockUseStops.mockReturnValue({ data: [], isFetching: false } as ReturnType<typeof useStops>);
    render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Gu" } });
    expect(screen.getByText("No stops found")).toBeInTheDocument();
  });

  it("calls onChange with the stop when a result is selected", () => {
    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
    const onChange = vi.fn();
    render(<StopSearch label="Origin" value={null} onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Gu" } });
    fireEvent.pointerDown(screen.getByText("Guelph Central Station"));
    expect(onChange).toHaveBeenCalledWith(fakeStop);
  });

  it("calls onChange with null when the input is cleared", () => {
    const onChange = vi.fn();
    render(<StopSearch label="Origin" value={fakeStop} onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  describe("keyboard navigation", () => {
    function openDropdown() {
      mockUseStops.mockReturnValue({ data: [fakeStop, fakeStop2], isFetching: false } as ReturnType<typeof useStops>);
      render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "Gu" } });
    }

    it("ArrowDown sets aria-activedescendant to the first option", () => {
      openDropdown();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      expect(screen.getByRole("combobox")).toHaveAttribute("aria-activedescendant", "stop-option-0");
    });

    it("ArrowDown twice advances to the second option", () => {
      openDropdown();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      expect(screen.getByRole("combobox")).toHaveAttribute("aria-activedescendant", "stop-option-1");
    });

    it("ArrowDown does not advance past the last option", () => {
      openDropdown();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      expect(screen.getByRole("combobox")).toHaveAttribute("aria-activedescendant", "stop-option-1");
    });

    it("ArrowUp does not go below the first option", () => {
      openDropdown();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowUp" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowUp" });
      expect(screen.getByRole("combobox")).toHaveAttribute("aria-activedescendant", "stop-option-0");
    });

    it("Enter selects the focused option and calls onChange", () => {
      const onChange = vi.fn();
      mockUseStops.mockReturnValue({ data: [fakeStop, fakeStop2], isFetching: false } as ReturnType<typeof useStops>);
      render(<StopSearch label="Origin" value={null} onChange={onChange} />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "Gu" } });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
      expect(onChange).toHaveBeenCalledWith(fakeStop2);
    });

    it("Escape closes the dropdown", () => {
      openDropdown();
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });
});
