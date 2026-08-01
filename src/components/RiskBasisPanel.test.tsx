import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RiskBasisPanel } from "./RiskBasisPanel";
import { makeLiveRisk } from "@/test/fixtures";

describe("RiskBasisPanel", () => {
  it("stays collapsed until asked", () => {
    render(<RiskBasisPanel risk={makeLiveRisk({ risk_label: "Medium" })} />);
    const toggle = screen.getByRole("button", { name: /why medium risk\?/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Based on")).not.toBeInTheDocument();
  });

  it("shows the counters behind the score once opened", () => {
    render(
      <RiskBasisPanel risk={makeLiveRisk({
        time_bucket: "weekend",
        scheduled_departures: 208,
        observed_departures: 156,
        total_delay_seconds: 37440,
        cancellation_count: 17,
        source: "seed",
      })} />
    );
    fireEvent.click(screen.getByRole("button", { name: /why/i }));

    expect(screen.getByText("Weekend")).toBeInTheDocument();
    expect(screen.getByText(/156 of 208 scheduled/)).toBeInTheDocument();
    expect(screen.getByText(/75%/)).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    // 37440s over 156 departures = 240s
    expect(screen.getByText("4m")).toBeInTheDocument();
    expect(screen.getByText("Modelled baseline")).toBeInTheDocument();
  });

  it("issues no request — the counters ride along on the leg", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<RiskBasisPanel risk={makeLiveRisk()} />);
    fireEvent.click(screen.getByRole("button", { name: /why/i }));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("says so when the score rests on a neutral prior", () => {
    render(<RiskBasisPanel risk={makeLiveRisk({ neutral_prior_used: true })} />);
    fireEvent.click(screen.getByRole("button", { name: /why/i }));

    expect(screen.getByText(/none recorded for this period yet/i)).toBeInTheDocument();
    // Counts would be meaningless here
    expect(screen.queryByText(/scheduled/)).not.toBeInTheDocument();
  });

  it("omits the average delay when nothing ran", () => {
    render(
      <RiskBasisPanel risk={makeLiveRisk({ observed_departures: 0, total_delay_seconds: 0 })} />
    );
    fireEvent.click(screen.getByRole("button", { name: /why/i }));
    expect(screen.queryByText("Average delay")).not.toBeInTheDocument();
  });

  it("collapses again on a second click", () => {
    render(<RiskBasisPanel risk={makeLiveRisk()} />);
    const toggle = screen.getByRole("button", { name: /why/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle);
    expect(screen.queryByText("Based on")).not.toBeInTheDocument();
  });
});
