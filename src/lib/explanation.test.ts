import { describe, it, expect } from "vitest";
import { isExplanationAvailable, parseRecommendedIndex } from "./explanation";

describe("isExplanationAvailable", () => {
  it("returns true for a normal explanation", () => {
    expect(isExplanationAvailable("**Option 1:** Route 27, departs 09:07")).toBe(true);
  });

  it("returns false for the Ollama fallback prefix", () => {
    expect(isExplanationAvailable("Explanation unavailable: Ollama not reachable")).toBe(false);
  });

  it("returns true for strings that contain but do not start with the prefix", () => {
    expect(isExplanationAvailable("Note: Explanation unavailable is shown when...")).toBe(true);
  });
});

describe("parseRecommendedIndex", () => {
  it("parses a recommendation for Option 1 as index 0", () => {
    const text = "**Option 1:** Route 27\n**Recommendation:** Option 1 is fastest.";
    expect(parseRecommendedIndex(text)).toBe(0);
  });

  it("parses a recommendation for Option 2 as index 1", () => {
    const text = "**Option 1:** ...\n**Option 2:** ...\n**Recommendation:** Option 2 is safest.";
    expect(parseRecommendedIndex(text)).toBe(1);
  });

  it("returns null when no recommendation line is present", () => {
    const text = "**Option 1:** Route 27, departs 09:07\n**Backup plan:** Take a taxi.";
    expect(parseRecommendedIndex(text)).toBeNull();
  });

  it("is case-insensitive on Recommendation keyword", () => {
    const text = "**recommendation:** take Option 3";
    expect(parseRecommendedIndex(text)).toBe(2);
  });
});
