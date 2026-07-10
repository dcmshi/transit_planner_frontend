import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStops } from "./useStops";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({ api: { stops: vi.fn() } }));

const mockStops = vi.mocked(api.stops);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  mockStops.mockReset().mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useStops", () => {
  it("does not fetch when the query is under 2 characters", async () => {
    renderHook(({ q }) => useStops(q), { wrapper: createWrapper(), initialProps: { q: "G" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(mockStops).not.toHaveBeenCalled();
  });

  it("debounces typing by 300ms and skips intermediate values", async () => {
    const { rerender } = renderHook(({ q }) => useStops(q), {
      wrapper: createWrapper(),
      initialProps: { q: "Gu" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockStops).toHaveBeenCalledTimes(1);
    expect(mockStops).toHaveBeenLastCalledWith("Gu", expect.anything());

    rerender({ q: "Gue" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    rerender({ q: "Guel" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    // 300ms hasn't elapsed since the last keystroke — no new fetch yet,
    // and the intermediate "Gue" value must never be fetched
    expect(mockStops).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(mockStops).toHaveBeenCalledTimes(2);
    expect(mockStops).toHaveBeenLastCalledWith("Guel", expect.anything());
  });
});
