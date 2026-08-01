import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { LoadingRoutes } from "./LoadingRoutes";
import { REQUEST_TIMEOUT_MS } from "@/lib/api";

describe("LoadingRoutes", () => {
  it("renders a status region with a spinner", () => {
    render(<LoadingRoutes />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("status").querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders loading text", () => {
    render(<LoadingRoutes />);
    expect(screen.getByText("Finding the best routes…")).toBeInTheDocument();
  });

  it("quotes the actual request timeout rather than a hardcoded duration", () => {
    render(<LoadingRoutes />);
    const seconds = Math.round(REQUEST_TIMEOUT_MS / 1000);
    expect(
      screen.getByText(new RegExp(`up to ${seconds} seconds`))
    ).toBeInTheDocument();
  });
});
