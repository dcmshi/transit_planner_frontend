/**
 * Format total seconds as "1h 23m", "45m", or "40s". Sub-minute values keep
 * their seconds — short walk legs would otherwise all render as "0m".
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/**
 * Strip GTFS HH:MM:SS to HH:MM for display. GTFS times may exceed 24:00:00
 * for service past midnight — those are normalized and annotated "+1 day".
 * Malformed input is returned as-is rather than throwing mid-render.
 */
export function formatGtfsTime(hms: string): string {
  const [h, m] = hms.split(":");
  if (!h || !m) return hms;
  const hours = Number(h);
  if (Number.isNaN(hours)) return hms;
  if (hours >= 24) {
    return `${String(hours - 24).padStart(2, "0")}:${m.padStart(2, "0")} (+1 day)`;
  }
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

/** Format metres as "1.2 km" or "350 m" */
export function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${Math.round(metres)} m`;
}
