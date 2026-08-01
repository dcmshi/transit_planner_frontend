import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Loading from "./loading";
import ErrorPage from "./error";
import NotFound from "./not-found";

describe("loading.tsx", () => {
  it("announces itself and reserves the map's space", () => {
    render(<Loading />);
    expect(screen.getByRole("status", { name: /loading the route planner/i })).toBeInTheDocument();
    expect(screen.getByTestId("map-placeholder")).toBeInTheDocument();
  });
});

describe("error.tsx", () => {
  function renderError(error: Error & { digest?: string }, reset = vi.fn()) {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorPage error={error} reset={reset} />);
    return { reset, consoleError };
  }

  it("reports the failure and logs it", () => {
    const error = new Error("boom");
    const { consoleError } = renderError(error);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(consoleError).toHaveBeenCalledWith("Route error", error);
    consoleError.mockRestore();
  });

  it("retries through the reset callback Next provides", () => {
    const { reset, consoleError } = renderError(new Error("boom"));
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it("surfaces the digest when Next supplies one", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    const { consoleError } = renderError(error);
    expect(screen.getByText(/Reference: abc123/)).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("omits the digest line when there is none", () => {
    const { consoleError } = renderError(new Error("boom"));
    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument();
    consoleError.mockRestore();
  });
});

describe("not-found.tsx", () => {
  it("offers a way back to the planner", () => {
    render(<NotFound />);
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to the route planner/i }))
      .toHaveAttribute("href", "/");
  });
});
