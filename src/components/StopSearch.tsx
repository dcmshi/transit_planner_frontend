"use client";

import { useState, useRef, useEffect, useId } from "react";
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
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  // Namespaced ids so the two StopSearch instances on the page never collide
  const id = useId();
  const inputId = `${id}-input`;
  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;

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

  // Sync display value when the external value changes (render-phase
  // adjustment — https://react.dev/learn/you-might-not-need-an-effect).
  // Only sync when a stop is set: a null value also arrives when the user
  // edits the text below, and overwriting would wipe their typing.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      setInputValue(value.stop_name);
      setFocusedIndex(-1);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setInputValue(text);
    setOpen(true);
    setFocusedIndex(-1);
    // Any edit that diverges from the selected stop's name clears the
    // selection — otherwise the form would submit a stop the input no
    // longer displays
    if (value && text !== value.stop_name) onChange(null);
  }

  function handleSelect(stop: StopResult) {
    onChange(stop);
    setInputValue(stop.stop_name);
    setOpen(false);
    setFocusedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Escape always closes, even when the dropdown shows "No stops found"
    if (e.key === "Escape") {
      setOpen(false);
      setFocusedIndex(-1);
      return;
    }
    // ArrowDown reopens a closed dropdown (standard combobox behavior)
    if (e.key === "ArrowDown" && !showDropdown) {
      if (inputValue.trim().length >= 2) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (!showDropdown || stops.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, stops.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleSelect(stops[focusedIndex]);
    }
  }

  const showDropdown = open && inputValue.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={focusedIndex >= 0 ? optionId(focusedIndex) : undefined}
        />
        {isFetching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            …
          </span>
        )}
      </div>

      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute top-full z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {stops.length === 0 && !isFetching && (
            <li className="px-3 py-2 text-sm text-gray-500">No stops found</li>
          )}
          {stops.map((stop, index) => (
            <li
              key={stop.stop_id}
              id={optionId(index)}
              role="option"
              aria-selected={stop.stop_id === value?.stop_id}
              onPointerDown={() => handleSelect(stop)}
              className={"flex cursor-pointer flex-col px-3 py-2 text-sm text-gray-900 hover:bg-green-50 aria-selected:bg-green-100" + (focusedIndex === index ? " bg-green-50" : "")}
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
