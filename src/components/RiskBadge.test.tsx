import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge } from "./RiskBadge";

describe("RiskBadge", () => {
  it("renders 'Low risk' with green styling", () => {
    render(<RiskBadge label="Low" />);
    const badge = screen.getByText("Low risk");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("green");
  });

  it("renders 'Medium risk' with amber styling", () => {
    render(<RiskBadge label="Medium" />);
    const badge = screen.getByText("Medium risk");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("amber");
  });

  it("renders 'High risk' with red styling", () => {
    render(<RiskBadge label="High" />);
    const badge = screen.getByText("High risk");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("red");
  });
});
