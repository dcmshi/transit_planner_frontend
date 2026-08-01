import { describe, it, expect } from "vitest";
import { routeLabel } from "./routeName";

describe("routeLabel", () => {
  it("headlines a numeric line designation", () => {
    expect(routeLabel("31")).toEqual({ text: "Route 31", prominent: true });
  });

  it("headlines a short alphabetic line code", () => {
    expect(routeLabel("LW")).toEqual({ text: "Route LW", prominent: true });
  });

  it("demotes an opaque internal identifier", () => {
    expect(routeLabel("06260926-GT")).toEqual({
      text: "Route ID 06260926-GT",
      prominent: false,
    });
  });

  it("demotes anything longer than a line designation", () => {
    expect(routeLabel("KITCHENER").prominent).toBe(false);
  });

  it("trims surrounding whitespace before deciding", () => {
    expect(routeLabel("  31  ")).toEqual({ text: "Route 31", prominent: true });
  });

  it("does not render a dangling label for an empty id", () => {
    expect(routeLabel("")).toEqual({ text: "Unknown route", prominent: false });
    expect(routeLabel("   ").text).toBe("Unknown route");
  });
});
