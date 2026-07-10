import type { StopResult } from "@/lib/api";

/**
 * Southwest/northeast bounding box for two stops, ordered correctly
 * regardless of which stop is further east or north (maplibre's fitBounds
 * zooms out to the whole world if the corners are swapped).
 */
export function stopBounds(
  a: StopResult,
  b: StopResult,
): [[number, number], [number, number]] {
  return [
    [Math.min(a.lon, b.lon), Math.min(a.lat, b.lat)],
    [Math.max(a.lon, b.lon), Math.max(a.lat, b.lat)],
  ];
}
