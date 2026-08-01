import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MAP_FRAME_CLASS, MapPlaceholder } from "./MapFrame";

describe("MapPlaceholder", () => {
  it("occupies exactly the frame the loaded map will occupy", () => {
    // The whole point is that nothing below the map shifts when its chunk
    // arrives, so the placeholder must carry the same height classes
    render(<MapPlaceholder />);
    const placeholder = screen.getByTestId("map-placeholder");
    for (const cls of MAP_FRAME_CLASS.split(" ")) {
      expect(placeholder.className).toContain(cls);
    }
  });

  it("is hidden from assistive technology", () => {
    render(<MapPlaceholder />);
    expect(screen.getByTestId("map-placeholder")).toHaveAttribute("aria-hidden", "true");
  });

  it("declares a height at every breakpoint", () => {
    expect(MAP_FRAME_CLASS).toContain("h-72");
    expect(MAP_FRAME_CLASS).toContain("sm:h-96");
    expect(MAP_FRAME_CLASS).toContain("lg:h-[480px]");
  });
});
