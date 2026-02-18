/** Format total seconds as "1h 23m" or "45m" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** Strip GTFS HH:MM:SS (which may exceed 24:00:00) to HH:MM for display */
export function formatGtfsTime(hms: string): string {
  const [h, m] = hms.split(":");
  return `${h.padStart(2, "0")}:${m}`;
}

/** Format metres as "1.2 km" or "350 m" */
export function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${Math.round(metres)} m`;
}
