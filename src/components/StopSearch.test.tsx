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
  mockUseStops.mockReturnValue({ data: [], isFetching: false } as unknown as ReturnType<typeof useStops>);
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
    mockUseStops.mockReturnValue({ data: [], isFetching: false } as unknown as ReturnType<typeof useStops>);
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

  it("clears the selection when the text is edited away from the selected stop", () => {
    // Regression: editing (not just clearing) used to keep the stale
    // selection, so the form submitted a stop the input no longer displayed
    const onChange = vi.fn();
    render(<StopSearch label="Origin" value={fakeStop} onChange={onChange} />);
    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("Guelph Central Station");

    fireEvent.change(input, { target: { value: "Guelph Central Stationx" } });
    expect(onChange).toHaveBeenCalledWith(null);
    // The user's typing is preserved, not wiped by the value sync
    expect(input).toHaveValue("Guelph Central Stationx");
  });

  it("associates the label with the input", () => {
    render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
    expect(screen.getByLabelText("Origin")).toBe(screen.getByRole("combobox"));
  });

  it("gives two instances distinct listbox and option ids", () => {
    mockUseStops.mockReturnValue({ data: [fakeStop], isFetching: false } as ReturnType<typeof useStops>);
    render(
      <>
        <StopSearch label="Origin" value={null} onChange={() => {}} />
        <StopSearch label="Destination" value={null} onChange={() => {}} />
      </>
    );
    const [originInput, destInput] = screen.getAllByRole("combobox");
    expect(originInput.getAttribute("aria-controls")).not.toBe(destInput.getAttribute("aria-controls"));

    fireEvent.change(originInput, { target: { value: "Gu" } });
    fireEvent.change(destInput, { target: { value: "Gu" } });
    const listboxes = screen.getAllByRole("listbox");
    expect(listboxes).toHaveLength(2);
    expect(listboxes[0].id).not.toBe(listboxes[1].id);
    // aria-controls points at each instance's own listbox
    expect(originInput.getAttribute("aria-controls")).toBe(listboxes[0].id);
    expect(destInput.getAttribute("aria-controls")).toBe(listboxes[1].id);
  });

  describe("keyboard navigation", () => {
    function openDropdown() {
      mockUseStops.mockReturnValue({ data: [fakeStop, fakeStop2], isFetching: false } as ReturnType<typeof useStops>);
      render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "Gu" } });
    }

    function activeDescendant() {
      return screen.getByRole("combobox").getAttribute("aria-activedescendant");
    }

    it("ArrowDown sets aria-activedescendant to the first option", () => {
      openDropdown();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      expect(activeDescendant()).toMatch(/-option-0$/);
    });

    it("ArrowDown twice advances to the second option", () => {
      openDropdown();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      expect(activeDescendant()).toMatch(/-option-1$/);
    });

    it("ArrowDown does not advance past the last option", () => {
      openDropdown();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      expect(activeDescendant()).toMatch(/-option-1$/);
    });

    it("ArrowUp does not go below the first option", () => {
      openDropdown();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowUp" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowUp" });
      expect(activeDescendant()).toMatch(/-option-0$/);
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

    it("Escape closes the dropdown even when it shows 'No stops found'", () => {
      mockUseStops.mockReturnValue({ data: [], isFetching: false } as unknown as ReturnType<typeof useStops>);
      render(<StopSearch label="Origin" value={null} onChange={() => {}} />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "Gu" } });
      expect(screen.getByText("No stops found")).toBeInTheDocument();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("ArrowDown reopens a dropdown closed with Escape", () => {
      openDropdown();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
  });
});
