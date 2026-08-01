import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge } from "./RiskBadge";

describe("RiskBadge", () => {
  it.each(["Low", "Medium", "High"])("reports %s as a known severity", (label) => {
    render(<RiskBadge label={label} />);
    const badge = screen.getByText(`${label} risk`);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-risk", label);
  });

  it("gives the three severities distinct styling", () => {
    // Which colours they are is a design decision; that they differ is not
    const classes = ["Low", "Medium", "High"].map((label) => {
      const { unmount } = render(<RiskBadge label={label} />);
      const cls = screen.getByText(`${label} risk`).className;
      unmount();
      return cls;
    });
    expect(new Set(classes).size).toBe(3);
  });

  it("marks an unrecognised label as unknown rather than styling it as a severity", () => {
    render(<RiskBadge label="Severe" />);
    const badge = screen.getByText("Severe risk");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-risk", "unknown");
  });

  it("never emits 'undefined' in the class list", () => {
    render(<RiskBadge label="" />);
    const badge = screen.getByText("risk");
    expect(badge.className).not.toContain("undefined");
  });
});
