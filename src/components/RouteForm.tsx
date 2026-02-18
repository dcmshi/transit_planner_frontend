"use client";

import { useState } from "react";
import { StopSearch } from "@/components/StopSearch";
import type { StopResult } from "@/lib/api";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
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
}

export function RouteForm({ onSubmit, isLoading = false }: Props) {
  const [origin, setOrigin] = useState<StopResult | null>(null);
  const [destination, setDestination] = useState<StopResult | null>(null);
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState(nowTime());
  const [explain, setExplain] = useState(false);

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <StopSearch
        label="Origin"
        placeholder="Search origin stop…"
        value={origin}
        onChange={setOrigin}
      />
      <StopSearch
        label="Destination"
        placeholder="Search destination stop…"
        value={destination}
        onChange={setDestination}
      />

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Departure time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={explain}
          onChange={(e) => setExplain(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Include AI explanation
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Finding routes…" : "Find routes"}
      </button>
    </form>
  );
}
