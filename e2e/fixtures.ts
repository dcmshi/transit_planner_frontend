/**
 * Canned backend payloads for specs that exercise the UI rather than the
 * backend — layout, error handling, banner states. Keeping them off the live
 * API makes their assertions deterministic and keeps the suite well inside the
 * backend's rate limit, which route-planning.spec.ts spends on real
 * integration coverage.
 */

export const GUELPH = {
  stop_id: "GL",
  stop_name: "Guelph Central GO",
  lat: 43.5448,
  lon: -80.2482,
  routes_served: ["06260926-GT"],
};

export const UNION = {
  stop_id: "UN",
  stop_name: "Union Station GO",
  lat: 43.645195,
  lon: -79.3806,
  routes_served: ["06260926-GT", "06260926-LW"],
};

export const BRAMALEA = {
  stop_id: "BE",
  stop_name: "Bramalea GO",
  lat: 43.7005,
  lon: -79.7207,
  routes_served: ["06260926-GT"],
};

const STOPS = [GUELPH, UNION, BRAMALEA];

/** Mimics the backend's substring search over stop names. */
export function searchStops(query: string) {
  const q = query.trim().toLowerCase();
  return q.length < 2 ? [] : STOPS.filter((s) => s.stop_name.toLowerCase().includes(q));
}

function tripLeg(from: typeof GUELPH, to: typeof GUELPH, departure: string, arrival: string) {
  return {
    kind: "trip" as const,
    from_stop_id: from.stop_id,
    to_stop_id: to.stop_id,
    from_stop_name: from.stop_name,
    to_stop_name: to.stop_name,
    from_lat: from.lat,
    from_lon: from.lon,
    to_lat: to.lat,
    to_lon: to.lon,
    trip_id: `${from.stop_id}-${to.stop_id}`,
    route_id: "06260926-GT",
    service_id: "20260801",
    departure_time: departure,
    arrival_time: arrival,
    travel_seconds: 2400,
    // A bend, so the fixture exercises track geometry rather than a chord
    geometry: [
      [from.lon, from.lat],
      [(from.lon + to.lon) / 2, Math.max(from.lat, to.lat) + 0.02],
      [to.lon, to.lat],
    ],
    risk: { risk_score: 0.2, risk_label: "Low", modifiers: [], is_cancelled: false },
  };
}

/** Two routes, so the results header and its refresh control both render. */
export const ROUTES_RESPONSE = {
  routes: [
    {
      legs: [
        tripLeg(GUELPH, BRAMALEA, "06:26:00", "07:06:00"),
        tripLeg(BRAMALEA, UNION, "07:08:00", "07:47:00"),
      ],
      total_travel_seconds: 4860,
      transfers: 1,
      total_walk_metres: 120,
      risk_score: 0.2,
      risk_label: "Low",
    },
    {
      legs: [tripLeg(GUELPH, UNION, "07:26:00", "08:52:00")],
      total_travel_seconds: 5160,
      transfers: 0,
      total_walk_metres: 0,
      risk_score: 0.5,
      risk_label: "Medium",
    },
  ],
};
