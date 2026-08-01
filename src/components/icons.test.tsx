import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BlockedIcon, WalkIcon, WarningIcon } from "./icons";

describe("icons", () => {
  it.each([
    ["WarningIcon", WarningIcon],
    ["BlockedIcon", BlockedIcon],
    ["WalkIcon", WalkIcon],
  ])("%s is decorative and inherits the surrounding colour", (_name, Component) => {
    const { container } = render(<Component />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("stroke", "currentColor");
  });

  it("accepts a size override", () => {
    const { container } = render(<WarningIcon className="h-6 w-6" />);
    expect(container.querySelector("svg")!.getAttribute("class")).toContain("h-6");
  });
});
