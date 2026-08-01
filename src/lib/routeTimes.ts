import type { ScoredRoute, TripLeg } from "@/lib/api";

export interface RouteTimes {
  departure: string;
  arrival: string;
}

/**
 * Scheduled departure and arrival for a whole route, taken from its first and
 * last trip legs. Walk legs carry no clock times, so a route that starts or
 * ends on foot reports when its first vehicle leaves and its last one lands.
 * Returns null for a route with no trip legs at all.
 */
export function routeTimes(route: ScoredRoute): RouteTimes | null {
  const trips = route.legs.filter((leg): leg is TripLeg => leg.kind === "trip");
  if (trips.length === 0) return null;
  return {
    departure: trips[0].departure_time,
    arrival: trips[trips.length - 1].arrival_time,
  };
}
