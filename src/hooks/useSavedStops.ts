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
 * Accept a persisted stop only if it has the fields the map and form
 * actually dereference — a malformed entry (old schema, manual edit) would
 * otherwise crash maplibre's Marker.setLngLat on every visit.
 */
function sanitizeStop(value: unknown): StopResult | null {
  if (typeof value !== "object" || value === null) return null;
  const s = value as Partial<StopResult>;
  if (
    typeof s.stop_id !== "string" ||
    typeof s.stop_name !== "string" ||
    typeof s.lat !== "number" ||
    typeof s.lon !== "number"
  ) {
    return null;
  }
  return {
    stop_id: s.stop_id,
    stop_name: s.stop_name,
    lat: s.lat,
    lon: s.lon,
    routes_served: Array.isArray(s.routes_served)
      ? s.routes_served.filter((r): r is string => typeof r === "string")
      : [],
  };
}

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
        const parsed = JSON.parse(raw) as Partial<SavedStops> | null;
        // localStorage can only be read after hydration, so this one-time
        // sync setState is intrinsic to the pattern
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStopsState({
          origin: sanitizeStop(parsed?.origin),
          destination: sanitizeStop(parsed?.destination),
        });
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
