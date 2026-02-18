"use client";

import { useState, useRef, useEffect } from "react";
import { useStops } from "@/hooks/useStops";
import type { StopResult } from "@/lib/api";

interface Props {
  label: string;
  placeholder?: string;
  value: StopResult | null;
  onChange: (stop: StopResult | null) => void;
}

export function StopSearch({ label, placeholder = "Search stops…", value, onChange }: Props) {
  const [inputValue, setInputValue] = useState(value?.stop_name ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: stops = [], isFetching } = useStops(inputValue);

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // Sync display value if external value changes
  useEffect(() => {
    setInputValue(value?.stop_name ?? "");
  }, [value]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange(null);
  }

  function handleSelect(stop: StopResult) {
    onChange(stop);
    setInputValue(stop.stop_name);
    setOpen(false);
  }

  const showDropdown = open && inputValue.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.trim().length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {isFetching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            …
          </span>
        )}
      </div>

      {showDropdown && (
        <ul
          role="listbox"
          className="absolute top-full z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {stops.length === 0 && !isFetching && (
            <li className="px-3 py-2 text-sm text-gray-500">No stops found</li>
          )}
          {stops.map((stop) => (
            <li
              key={stop.stop_id}
              role="option"
              aria-selected={stop.stop_id === value?.stop_id}
              onPointerDown={() => handleSelect(stop)}
              className="flex cursor-pointer flex-col px-3 py-2 text-sm text-gray-900 hover:bg-green-50 aria-selected:bg-green-100"
            >
              <span className="font-medium">{stop.stop_name}</span>
              {stop.routes_served.length > 0 && (
                <span className="text-xs text-gray-500">
                  Routes: {stop.routes_served.join(", ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
