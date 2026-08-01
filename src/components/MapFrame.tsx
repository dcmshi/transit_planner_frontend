/**
 * The map's outer box, shared between the real map and the placeholder shown
 * while its chunk loads. RouteMap pulls in maplibre, so the placeholder can't
 * import from it without defeating the dynamic import — the geometry lives
 * here instead, where both can reach it.
 */
export const MAP_FRAME_CLASS =
  "relative h-72 w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm sm:h-96 lg:h-[480px]";

export function MapPlaceholder() {
  return <div data-testid="map-placeholder" aria-hidden="true" className={`${MAP_FRAME_CLASS} bg-gray-100`} />;
}
