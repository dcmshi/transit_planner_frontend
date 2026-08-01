import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlertsBanner } from "./AlertsBanner";
import { useAlerts } from "@/hooks/useAlerts";
import type { AlertResult } from "@/lib/api";

vi.mock("@/hooks/useAlerts");

const mockUseAlerts = vi.mocked(useAlerts);

function alert(id: string, header: string): AlertResult {
  return {
    alert_id: id,
    header,
    description: "",
    affected_route_ids: [],
    affected_stop_ids: [],
    fetched_at: "2026-07-10T12:00:00Z",
  };
}

function withData(data: AlertResult[] | undefined) {
  return { data } as unknown as ReturnType<typeof useAlerts>;
}

beforeEach(() => {
  mockUseAlerts.mockReset();
});

describe("AlertsBanner", () => {
  it("renders nothing while alerts are loading", () => {
    mockUseAlerts.mockReturnValue(withData(undefined));
    const { container } = render(<AlertsBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there are no active alerts", () => {
    mockUseAlerts.mockReturnValue(withData([]));
    const { container } = render(<AlertsBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a single alert's header", () => {
    mockUseAlerts.mockReturnValue(withData([alert("a1", "Route 27 detour at Aberfoyle")]));
    render(<AlertsBanner />);
    expect(screen.getByRole("status")).toHaveTextContent("Route 27 detour at Aberfoyle");
  });

  it("shows the count and all headers for multiple alerts", () => {
    mockUseAlerts.mockReturnValue(
      withData([alert("a1", "Route 27 detour"), alert("a2", "Union Station escalator outage")]),
    );
    render(<AlertsBanner />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("2 active service alerts");
    expect(status).toHaveTextContent("Route 27 detour");
    expect(status).toHaveTextContent("Union Station escalator outage");
  });

  it("caps the headlines and summarises the rest", () => {
    // The live feed carries 20+ standing alerts — the banner must not
    // swallow the page
    mockUseAlerts.mockReturnValue(
      withData([
        alert("a1", "Alert one"),
        alert("a2", "Alert two"),
        alert("a3", "Alert three"),
        alert("a4", "Alert four"),
        alert("a5", "Alert five"),
      ]),
    );
    render(<AlertsBanner />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("5 active service alerts");
    expect(status).toHaveTextContent("Alert three");
    expect(status).not.toHaveTextContent("Alert four");
    expect(status).toHaveTextContent("+2 more");
  });

  it("expands to the full list and collapses again", () => {
    mockUseAlerts.mockReturnValue(
      withData([
        alert("a1", "Alert one"),
        alert("a2", "Alert two"),
        alert("a3", "Alert three"),
        alert("a4", "Alert four"),
      ]),
    );
    render(<AlertsBanner />);
    const toggle = screen.getByRole("button", { name: "+1 more" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    expect(screen.getByRole("status")).toHaveTextContent("Alert four");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: "Show fewer" }));
    expect(screen.getByRole("status")).not.toHaveTextContent("Alert four");
  });

  it("lists each distinct headline once", () => {
    // The live feed repeats "Elevator out of service" per station
    mockUseAlerts.mockReturnValue(
      withData([
        alert("a1", "Elevator out of service"),
        alert("a2", "Elevator out of service"),
        alert("a3", "Route 27 detour"),
      ]),
    );
    render(<AlertsBanner />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("2 active service alerts");
    expect(status.textContent?.match(/Elevator out of service/g)).toHaveLength(1);
  });

  it("renders nothing when every alert has an empty header", () => {
    mockUseAlerts.mockReturnValue(withData([alert("a1", ""), alert("a2", "")]));
    const { container } = render(<AlertsBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows no toggle when every headline already fits", () => {
    mockUseAlerts.mockReturnValue(
      withData([alert("a1", "Alert one"), alert("a2", "Alert two")]),
    );
    render(<AlertsBanner />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
