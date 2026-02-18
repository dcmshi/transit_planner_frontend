import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExplanationPanel } from "./ExplanationPanel";

describe("ExplanationPanel", () => {
  it("renders the Ollama fallback when explanation is unavailable", () => {
    render(<ExplanationPanel explanation="Explanation unavailable: Ollama not reachable" />);
    expect(screen.getByText(/AI explanation requires Ollama/i)).toBeInTheDocument();
    expect(screen.queryByText("AI explanation")).not.toBeInTheDocument();
  });

  it("renders the explanation heading and content when available", () => {
    render(<ExplanationPanel explanation="Option 1 is the fastest route" />);
    expect(screen.getByText("AI explanation")).toBeInTheDocument();
    expect(screen.getByText(/Option 1 is the fastest route/)).toBeInTheDocument();
  });

  it("renders a link to the Ollama setup guide in the fallback", () => {
    render(<ExplanationPanel explanation="Explanation unavailable: model not found" />);
    expect(screen.getByRole("link", { name: /setup guide/i })).toBeInTheDocument();
  });
});
