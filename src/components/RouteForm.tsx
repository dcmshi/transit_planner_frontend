"use client";

import { useState } from "react";
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
  onStopsChange?: (origin: StopResult | null, destination: StopResult | null) => void;
  defaultOrigin?: StopResult | null;
  defaultDestination?: StopResult | null;
}

export function RouteForm({ onSubmit, isLoading = false, onStopsChange, defaultOrigin, defaultDestination }: Props) {
  const [origin, setOrigin] = useState<StopResult | null>(defaultOrigin ?? null);
  const [destination, setDestination] = useState<StopResult | null>(defaultDestination ?? null);
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState(nowTime());
  const [explain, setExplain] = useState(false);

  function handleOriginChange(stop: StopResult | null) {
    setOrigin(stop);
    onStopsChange?.(stop, destination);
  }

  function handleDestinationChange(stop: StopResult | null) {
    setDestination(stop);
    onStopsChange?.(origin, stop);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination) return;
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
          onChange={handleOriginChange}
        />
        <StopSearch
          label="Destination"
          placeholder="Search destination stop…"
          value={destination}
          onChange={handleDestinationChange}
        />

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={date}
              min={todayDate()}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Departure time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>
        </div>

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
