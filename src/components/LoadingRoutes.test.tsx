import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingRoutes } from "./LoadingRoutes";

describe("LoadingRoutes", () => {
  it("renders a spinner", () => {
    const { container } = render(<LoadingRoutes />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders loading text", () => {
    render(<LoadingRoutes />);
    expect(screen.getByText("Finding the best routes…")).toBeInTheDocument();
  });
});
