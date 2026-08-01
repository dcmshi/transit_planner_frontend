/**
 * The API exposes only `route_id` — there is no route_short_name or
 * route_long_name to build a real line name from. Short alphanumeric ids
 * ("31", "LW") read as a line designation riders recognise and are worth
 * headlining; anything longer is an internal identifier that belongs in a
 * muted caption rather than above the stops it connects.
 */
const LINE_DESIGNATION = /^[A-Za-z0-9]{1,4}$/;

export interface RouteLabel {
  text: string;
  /** Whether the label is rider-facing enough to headline the leg. */
  prominent: boolean;
}

export function routeLabel(routeId: string): RouteLabel {
  const id = routeId.trim();
  if (!id) return { text: "Unknown route", prominent: false };
  if (LINE_DESIGNATION.test(id)) return { text: `Route ${id}`, prominent: true };
  return { text: `Route ID ${id}`, prominent: false };
}
