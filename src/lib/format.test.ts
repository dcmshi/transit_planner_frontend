import { describe, it, expect } from "vitest";
import { formatDuration, formatGtfsTime, formatDistance } from "./format";

describe("formatDuration", () => {
  it("shows minutes only when under an hour", () => {
    expect(formatDuration(45 * 60)).toBe("45m");
  });

  it("shows hours and minutes", () => {
    expect(formatDuration(90 * 60)).toBe("1h 30m");
  });

  it("handles exact hours", () => {
    expect(formatDuration(2 * 3600)).toBe("2h 0m");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0m");
  });
});

describe("formatGtfsTime", () => {
  it("strips seconds from HH:MM:SS", () => {
    expect(formatGtfsTime("09:07:00")).toBe("09:07");
  });

  it("handles times past midnight (>24:00)", () => {
    expect(formatGtfsTime("25:15:00")).toBe("25:15");
  });

  it("pads single-digit hours", () => {
    expect(formatGtfsTime("8:05:00")).toBe("08:05");
  });
});

describe("formatDistance", () => {
  it("shows metres when under 1 km", () => {
    expect(formatDistance(350)).toBe("350 m");
  });

  it("shows km with one decimal when 1 km or over", () => {
    expect(formatDistance(1200)).toBe("1.2 km");
  });

  it("rounds metres", () => {
    expect(formatDistance(999)).toBe("999 m");
  });

  it("handles exact kilometre", () => {
    expect(formatDistance(1000)).toBe("1.0 km");
  });
});
