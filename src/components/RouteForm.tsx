"use client";

import { useId, useState } from "react";
import { StopSearch } from "@/components/StopSearch";
import type { StopResult } from "@/lib/api";

function todayDate(): string {
  return new Date().toLocaleDateString("en-CA");
}

function nowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/** Whether the time field means "leave after" or "arrive before". */
export type TimeMode = "depart" | "arrive";

export interface RouteQuery {
  origin: string;
  destination: string;
  travel_date: string;
  // Exactly one of these is set — the backend rejects both together
  departure_time?: string;
  arrive_by?: string;
}

interface Props {
  onSubmit: (query: RouteQuery) => void;
  isLoading?: boolean;
  // Stops are controlled by the parent so values restored from storage (which
  // arrive after hydration) show up in the form
  origin: StopResult | null;
  destination: StopResult | null;
  onOriginChange: (stop: StopResult | null) => void;
  onDestinationChange: (stop: StopResult | null) => void;
  /** Exchanges the two stops. Owned by the parent so both land in one update. */
  onSwap: () => void;
  // Explanation is not a submit-time option: the parent owns the flag so
  // toggling it takes effect against the results already on screen
  explain: boolean;
  onExplainChange: (explain: boolean) => void;
}

export function RouteForm({ onSubmit, isLoading = false, origin, destination, onOriginChange, onDestinationChange, onSwap, explain, onExplainChange }: Props) {
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState(nowTime());
  const [mode, setMode] = useState<TimeMode>("depart");
  const [formError, setFormError] = useState<string | null>(null);
  const id = useId();
  const dateId = `${id}-date`;
  const timeId = `${id}-time`;
  const modeName = `${id}-mode`;
  // Distinct from the "Arrive by" radio: two controls sharing an accessible
  // name is ambiguous to a screen reader
  const timeLabel = mode === "depart" ? "Departure time" : "Arrival time";

  // Both fields reset together: "leave now" means today as well as this
  // minute, and a stale date would otherwise survive the reset
  function handleNow() {
    setDate(todayDate());
    setTime(nowTime());
    setFormError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination) return;
    // The date input's min doesn't stop typed or cleared values, and it is
    // itself computed at render — re-check against the current date here
    if (!date) {
      setFormError("Please choose a travel date.");
      return;
    }
    if (date < todayDate()) {
      setFormError("Travel date can't be in the past.");
      return;
    }
    if (!time) {
      setFormError(
        mode === "depart" ? "Please choose a departure time." : "Please choose an arrival time.",
      );
      return;
    }
    // A past time on today's date is allowed on purpose — it shows the rest
    // of today's schedule from that point. An arrive-by deadline in the past
    // is left to the backend, which answers with its own missed-deadline case.
    onSubmit({
      origin: origin.stop_id,
      destination: destination.stop_id,
      travel_date: date,
      ...(mode === "depart" ? { departure_time: time } : { arrive_by: time }),
    });
  }

  const canSubmit = origin !== null && destination !== null && !isLoading;

  return (
    <div className="rounded-xl border border-n-200 bg-n-0 p-5 shadow-sm">
      {/* noValidate: our submit handler owns validation messaging — native
          min-attribute bubbles would block backdated same-day queries */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <StopSearch
          label="Origin"
          placeholder="Search origin stop…"
          value={origin}
          onChange={onOriginChange}
        />
        <div className="-my-2 flex justify-end">
          <button
            type="button"
            onClick={onSwap}
            disabled={!origin && !destination}
            aria-label="Swap origin and destination"
            className="rounded-md border border-n-300 bg-n-0 p-1.5 text-n-500 shadow-sm hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg
              className="h-4 w-4" aria-hidden="true"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>
        <StopSearch
          label="Destination"
          placeholder="Search destination stop…"
          value={destination}
          onChange={onDestinationChange}
        />

        {/* Radios rather than buttons: the two are one exclusive choice, and
            this gets arrow-key navigation and grouping for free */}
        <fieldset className="flex w-fit gap-0.5 rounded-md border border-n-300 bg-n-50 p-0.5">
          <legend className="sr-only">When to travel</legend>
          {([["depart", "Leave at"], ["arrive", "Arrive by"]] as const).map(([value, label]) => (
            <label
              key={value}
              className={`cursor-pointer rounded px-3 py-1 text-sm font-medium transition-colors ${
                mode === value
                  ? "bg-n-0 text-accent-ink-strong shadow-sm"
                  : "text-n-500 hover:text-n-700"
              }`}
            >
              <input
                type="radio"
                name={modeName}
                value={value}
                checked={mode === value}
                onChange={() => { setMode(value); setFormError(null); }}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </fieldset>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={dateId} className="text-sm font-medium text-n-700">Date</label>
            <input
              id={dateId}
              type="date"
              value={date}
              min={todayDate()}
              onChange={(e) => { setDate(e.target.value); setFormError(null); }}
              className="rounded-md border border-n-300 bg-n-0 px-3 py-2 text-sm text-n-900 shadow-sm focus:border-brand"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={timeId} className="text-sm font-medium text-n-700">{timeLabel}</label>
              {/* "Now" resets to the present, which only means something for a
                  departure — an arrival deadline of "now" is never useful */}
              {mode === "depart" && (
                <button
                  type="button"
                  onClick={handleNow}
                  className="text-xs font-medium text-accent-ink hover:text-accent-ink-strong"
                >
                  Now
                </button>
              )}
            </div>
            {/* No min: it was computed at render, so it went stale as the page
                sat open, and backdated same-day departures are allowed on
                purpose (see handleSubmit) — the constraint only misled. */}
            <input
              id={timeId}
              type="time"
              value={time}
              onChange={(e) => { setTime(e.target.value); setFormError(null); }}
              className="rounded-md border border-n-300 bg-n-0 px-3 py-2 text-sm text-n-900 shadow-sm focus:border-brand"
            />
          </div>
        </div>

        {formError && (
          <p role="alert" className="text-sm text-danger-ink-soft">{formError}</p>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-n-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={explain}
              onChange={(e) => onExplainChange(e.target.checked)}
              className="rounded border-n-300 text-accent-ink"
            />
            Include AI explanation
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "Searching…" : "Find routes"}
          </button>
        </div>
      </form>
    </div>
  );
}
