import { describe, it, expect } from "vitest";
import { describeApiError } from "./apiError";
import { ApiError, REQUEST_TIMEOUT_MS } from "./api";

describe("describeApiError", () => {
  it("names the timeout and its duration", () => {
    const message = describeApiError(new DOMException("timed out", "TimeoutError"));
    expect(message).toContain(`${Math.round(REQUEST_TIMEOUT_MS / 1000)} seconds`);
  });

  it("treats an abort the same as a timeout", () => {
    expect(describeApiError(new DOMException("aborted", "AbortError"))).toMatch(/cancelled/i);
  });

  it("distinguishes a backend failure from a rejected search", () => {
    expect(describeApiError(new ApiError(500, "Internal Server Error"))).toContain("HTTP 500");
    expect(describeApiError(new ApiError(500, "Internal Server Error"))).toMatch(/backend failed/i);

    expect(describeApiError(new ApiError(422, "Unprocessable Entity"))).toContain("HTTP 422");
    expect(describeApiError(new ApiError(422, "Unprocessable Entity"))).toMatch(/rejected/i);
  });

  it("reports an unreachable backend for a fetch-level TypeError", () => {
    expect(describeApiError(new TypeError("Failed to fetch"))).toMatch(/couldn't reach/i);
  });

  it("falls back to a generic message for anything else", () => {
    expect(describeApiError(new Error("boom"))).toBe("Something went wrong fetching routes.");
    expect(describeApiError(undefined)).toBe("Something went wrong fetching routes.");
  });
});
