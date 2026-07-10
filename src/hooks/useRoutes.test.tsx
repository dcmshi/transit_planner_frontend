import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRoutes } from "./useRoutes";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({ api: { routes: vi.fn() } }));

const mockRoutes = vi.mocked(api.routes);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const params = {
  origin: "S1",
  destination: "S2",
  departure_time: "09:00",
  travel_date: "2026-07-10",
  explain: false,
};

beforeEach(() => {
  mockRoutes.mockReset();
});

describe("useRoutes", () => {
  it("does not fetch while params are null", () => {
    const { result } = renderHook(() => useRoutes(null), { wrapper: createWrapper() });
    expect(mockRoutes).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.explanation).toBeNull();
  });

  it("fetches routes without the explain flag", async () => {
    mockRoutes.mockResolvedValue({ routes: [] });
    const { result } = renderHook(() => useRoutes(params), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRoutes).toHaveBeenCalledTimes(1);
    expect(mockRoutes.mock.calls[0][0]).not.toHaveProperty("explain");
    expect(result.current.explanation).toBeNull();
  });

  it("fetches the explanation in a separate query when explain is on", async () => {
    mockRoutes.mockImplementation(async (p) =>
      p.explain ? { routes: [], explanation: "**Recommendation:** Option 1" } : { routes: [] },
    );
    const { result } = renderHook(() => useRoutes({ ...params, explain: true }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.explanation).toBe("**Recommendation:** Option 1"));
    expect(mockRoutes.mock.calls.filter(([p]) => p.explain === true)).toHaveLength(1);
  });

  it("does not re-run the explanation when routes are refetched", async () => {
    // Regression: the explanation is an expensive LLM call and used to be
    // re-triggered by every 5-minute background refresh
    mockRoutes.mockImplementation(async (p) =>
      p.explain ? { routes: [], explanation: "Option 1 is best" } : { routes: [] },
    );
    const { result } = renderHook(() => useRoutes({ ...params, explain: true }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.explanation).toBe("Option 1 is best"));

    const routeCallsBefore = mockRoutes.mock.calls.filter(([p]) => !p.explain).length;
    await act(async () => {
      await result.current.refetch();
    });

    expect(mockRoutes.mock.calls.filter(([p]) => !p.explain).length).toBe(routeCallsBefore + 1);
    expect(mockRoutes.mock.calls.filter(([p]) => p.explain === true)).toHaveLength(1);
    expect(result.current.explanation).toBe("Option 1 is best");
  });
});
