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

export interface RouteQuery {
  origin: string;
  destination: string;
  departure_time: string;
  travel_date: string;
  explain: boolean;
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
}

export function RouteForm({ onSubmit, isLoading = false, origin, destination, onOriginChange, onDestinationChange, onSwap }: Props) {
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState(nowTime());
  const [explain, setExplain] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const id = useId();
  const dateId = `${id}-date`;
  const timeId = `${id}-time`;

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
      setFormError("Please choose a departure time.");
      return;
    }
    // A past time on today's date is allowed on purpose — it shows the rest
    // of today's schedule from that point.
    onSubmit({
      origin: origin.stop_id,
      destination: destination.stop_id,
      departure_time: time,
      travel_date: date,
      explain,
    });
  }

  const canSubmit = origin !== null && destination !== null && !isLoading;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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
            className="rounded-md border border-gray-300 bg-white p-1.5 text-gray-500 shadow-sm hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-40"
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

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={dateId} className="text-sm font-medium text-gray-700">Date</label>
            <input
              id={dateId}
              type="date"
              value={date}
              min={todayDate()}
              onChange={(e) => { setDate(e.target.value); setFormError(null); }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={timeId} className="text-sm font-medium text-gray-700">Departure time</label>
            {/* No min: it was computed at render, so it went stale as the page
                sat open, and backdated same-day departures are allowed on
                purpose (see handleSubmit) — the constraint only misled. */}
            <input
              id={timeId}
              type="time"
              value={time}
              onChange={(e) => { setTime(e.target.value); setFormError(null); }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>
        </div>

        {formError && (
          <p role="alert" className="text-sm text-red-600">{formError}</p>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={explain}
              onChange={(e) => setExplain(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-600"
            />
            Include AI explanation
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-green-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "Searching…" : "Find routes"}
          </button>
        </div>
      </form>
    </div>
  );
}
