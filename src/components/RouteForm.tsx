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
}

export function RouteForm({ onSubmit, isLoading = false, origin, destination, onOriginChange, onDestinationChange }: Props) {
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState(nowTime());
  const [explain, setExplain] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const id = useId();
  const dateId = `${id}-date`;
  const timeId = `${id}-time`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination) return;
    // The date input's min attribute doesn't stop typed past dates
    if (date < todayDate()) {
      setDateError("Travel date can't be in the past.");
      return;
    }
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <StopSearch
          label="Origin"
          placeholder="Search origin stop…"
          value={origin}
          onChange={onOriginChange}
        />
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
              onChange={(e) => { setDate(e.target.value); setDateError(null); }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={timeId} className="text-sm font-medium text-gray-700">Departure time</label>
            <input
              id={timeId}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>
        </div>

        {dateError && (
          <p role="alert" className="text-sm text-red-600">{dateError}</p>
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
