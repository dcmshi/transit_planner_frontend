import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { api, API_BASE } from "./api";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterAll(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `${status}`,
    json: () => Promise.resolve(body),
  } as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("api.health", () => {
  it("fetches /health with an abort signal wired for timeouts", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
    await api.health();
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE}/health`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("throws on a non-ok response", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, 500));
    await expect(api.health()).rejects.toThrow(/API 500/);
  });
});

describe("api.alerts", () => {
  it("fetches /alerts", async () => {
    mockFetch.mockResolvedValue(jsonResponse([]));
    await expect(api.alerts()).resolves.toEqual([]);
    expect(mockFetch.mock.calls[0][0]).toBe(`${API_BASE}/alerts`);
  });
});

describe("withTimeout browser fallbacks", () => {
  it("passes the caller's signal through when AbortSignal.any is unavailable", async () => {
    const anyFn = AbortSignal.any;
    (AbortSignal as unknown as Record<string, unknown>).any = undefined;
    try {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
      const caller = new AbortController().signal;
      await expect(api.health(caller)).resolves.toEqual({ ok: true });
      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/health`,
        expect.objectContaining({ signal: caller }),
      );
    } finally {
      (AbortSignal as unknown as Record<string, unknown>).any = anyFn;
    }
  });

  it("still works when AbortSignal.timeout is unavailable", async () => {
    const timeoutFn = AbortSignal.timeout;
    (AbortSignal as unknown as Record<string, unknown>).timeout = undefined;
    try {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
      await expect(api.health()).resolves.toEqual({ ok: true });
    } finally {
      (AbortSignal as unknown as Record<string, unknown>).timeout = timeoutFn;
    }
  });
});

describe("api.stops", () => {
  it("URL-encodes the search query", async () => {
    mockFetch.mockResolvedValue(jsonResponse([]));
    await api.stops("Guelph & 401");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe(`${API_BASE}/stops?query=Guelph%20%26%20401`);
  });
});

describe("api.routes", () => {
  const params = { origin: "S1", destination: "S2", departure_time: "09:00", travel_date: "2026-07-10" };

  it("treats 404 as an empty result set, not an error", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ detail: "No routes found between these stops." }, 404));
    await expect(api.routes(params)).resolves.toEqual({
      routes: [],
      emptyReason: "no-connection",
    });
  });

  it("distinguishes a missed arrive-by deadline from an absent connection", async () => {
    // Both are 404; only the detail string tells them apart, and it is matched
    // loosely because the backend may polish the wording
    mockFetch.mockResolvedValue(
      jsonResponse({ detail: "No route arrives by 06:00:00 — try a later deadline." }, 404),
    );
    await expect(api.routes(params)).resolves.toEqual({
      routes: [],
      emptyReason: "missed-deadline",
    });
  });

  it("falls back to no-connection when the 404 body is unreadable", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "404",
      json: () => Promise.reject(new Error("not json")),
    } as Response);
    await expect(api.routes(params)).resolves.toEqual({
      routes: [],
      emptyReason: "no-connection",
    });
  });

  it("sends arrive_by instead of departure_time when asked", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ routes: [] }));
    await api.routes({ origin: "GL", destination: "UN", arrive_by: "09:00", travel_date: "2026-08-03" });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("arrive_by=09%3A00");
    expect(url).not.toContain("departure_time");
  });

  it("throws on other error statuses", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, 503));
    await expect(api.routes(params)).rejects.toThrow(/API 503/);
  });

  it("omits the explain param unless it is true", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ routes: [] }));
    await api.routes(params);
    await api.routes({ ...params, explain: false });
    await api.routes({ ...params, explain: true });

    const urls = mockFetch.mock.calls.map((c) => c[0] as string);
    expect(urls[0]).not.toContain("explain");
    expect(urls[1]).not.toContain("explain");
    expect(urls[2]).toContain("explain=true");
  });

  it("omits departure_time and travel_date when not provided", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ routes: [] }));
    await api.routes({ origin: "S1", destination: "S2" });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe(`${API_BASE}/routes?origin=S1&destination=S2`);
  });
});
