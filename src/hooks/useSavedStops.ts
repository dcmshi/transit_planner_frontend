"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StopResult } from "@/lib/api";

export interface SavedStops {
  origin: StopResult | null;
  destination: StopResult | null;
}

const STORAGE_KEY = "go-transit-last-stops";
const EMPTY: SavedStops = { origin: null, destination: null };

/**
 * Origin/destination selection persisted to localStorage.
 *
 * Storage is read after hydration (to avoid an SSR/client mismatch), and
 * writes are suppressed until that read completes — otherwise the initial
 * empty state would clobber the saved value on mount (and, under StrictMode's
 * double-invoked effects, wipe it permanently).
 */
export function useSavedStops(): [SavedStops, (stops: SavedStops) => void] {
  const [stops, setStopsState] = useState<SavedStops>(EMPTY);
  const loadedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // localStorage can only be read after hydration, so this one-time
        // sync setState is intrinsic to the pattern
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStopsState(JSON.parse(raw) as SavedStops);
      }
    } catch {
      // Ignore parse errors — fall back to empty
    }
    loadedRef.current = true;
  }, []);

  const setStops = useCallback((next: SavedStops) => {
    setStopsState(next);
    if (!loadedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota errors — persistence is best-effort
    }
  }, []);

  return [stops, setStops];
}
