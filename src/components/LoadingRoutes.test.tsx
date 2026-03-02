import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { LoadingRoutes } from "./LoadingRoutes";

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
});
