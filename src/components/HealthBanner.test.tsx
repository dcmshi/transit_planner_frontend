import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HealthBanner } from "./HealthBanner";
import { useHealth } from "@/hooks/useHealth";

vi.mock("@/hooks/useHealth");

const mockUseHealth = vi.mocked(useHealth);

const healthyData = {
  gtfs: { graph_built: true, last_built_at: "2024-01-01T00:00:00Z" },
  reliability: { records: 1000 },
};

beforeEach(() => {
  mockUseHealth.mockReset();
});

describe("HealthBanner", () => {
  it("renders nothing when the backend is healthy", () => {
    mockUseHealth.mockReturnValue({
      data: healthyData,
      isError: false,
      isPending: false,
    } as any);
    const { container } = render(<HealthBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while the initial fetch is pending", () => {
    mockUseHealth.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
    } as any);
    const { container } = render(<HealthBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an error alert when the backend is unreachable", () => {
    mockUseHealth.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
    } as any);
    render(<HealthBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Cannot reach the backend/i)).toBeInTheDocument();
  });

  it("renders a warning when the GTFS graph has not been built", () => {
    mockUseHealth.mockReturnValue({
      data: {
        gtfs: { graph_built: false, last_built_at: null },
        reliability: { records: 0 },
      },
      isError: false,
      isPending: false,
    } as any);
    render(<HealthBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/GTFS graph is still building/i)).toBeInTheDocument();
  });

  it("renders a warning when reliability data has not been seeded", () => {
    mockUseHealth.mockReturnValue({
      data: {
        gtfs: { graph_built: true, last_built_at: "2024-01-01T00:00:00Z" },
        reliability: { records: 0 },
      },
      isError: false,
      isPending: false,
    } as any);
    render(<HealthBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Reliability data not yet seeded/i)).toBeInTheDocument();
  });
});
