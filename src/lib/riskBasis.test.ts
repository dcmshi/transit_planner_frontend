import { describe, it, expect } from "vitest";
import { riskBasis } from "./riskBasis";
import { makeLiveRisk } from "@/test/fixtures";

describe("riskBasis", () => {
  it("humanizes the time bucket", () => {
    expect(riskBasis(makeLiveRisk({ time_bucket: "weekday_am_peak" })).bucketLabel)
      .toBe("Weekday AM peak");
    expect(riskBasis(makeLiveRisk({ time_bucket: "weekday_pm_peak" })).bucketLabel)
      .toBe("Weekday PM peak");
    expect(riskBasis(makeLiveRisk({ time_bucket: "weekday_offpeak" })).bucketLabel)
      .toBe("Weekday offpeak");
    expect(riskBasis(makeLiveRisk({ time_bucket: "weekend" })).bucketLabel)
      .toBe("Weekend");
  });

  it("survives an unrecognised bucket rather than guessing", () => {
    expect(riskBasis(makeLiveRisk({ time_bucket: "holiday_evening" })).bucketLabel)
      .toBe("Holiday evening");
    expect(riskBasis(makeLiveRisk({ time_bucket: "" })).bucketLabel).toBe("Unknown period");
  });

  it("computes the observed share of scheduled departures", () => {
    const basis = riskBasis(makeLiveRisk({ scheduled_departures: 60, observed_departures: 51 }));
    expect(basis.observedShare).toBeCloseTo(0.85, 2);
  });

  it("averages the delay across departures that actually ran", () => {
    const basis = riskBasis(makeLiveRisk({ observed_departures: 18, total_delay_seconds: 4320 }));
    expect(basis.averageDelaySeconds).toBe(240);
  });

  it("reports no share or average when nothing was scheduled or ran", () => {
    const basis = riskBasis(makeLiveRisk({
      scheduled_departures: 0,
      observed_departures: 0,
      total_delay_seconds: 0,
    }));
    expect(basis.observedShare).toBeNull();
    expect(basis.averageDelaySeconds).toBeNull();
  });

  it("labels the data source", () => {
    expect(riskBasis(makeLiveRisk({ source: "seed" })).sourceLabel).toBe("Modelled baseline");
    expect(riskBasis(makeLiveRisk({ source: "mixed" })).sourceLabel)
      .toBe("Observed history and modelled baseline");
    expect(riskBasis(makeLiveRisk({ source: "observed" })).sourceLabel).toBe("Observed history");
    expect(riskBasis(makeLiveRisk({ source: "telemetry" })).sourceLabel).toBe("Telemetry");
    expect(riskBasis(makeLiveRisk({ source: null })).sourceLabel).toBe("Unknown source");
  });

  it("flags a score resting on a neutral prior", () => {
    expect(riskBasis(makeLiveRisk({ neutral_prior_used: true })).hasHistory).toBe(false);
    expect(riskBasis(makeLiveRisk({ neutral_prior_used: false })).hasHistory).toBe(true);
  });
});
