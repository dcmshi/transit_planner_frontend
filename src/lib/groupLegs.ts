import type { TripLeg, WalkLeg } from "@/lib/api";

export type TripLegGroup = TripLeg & { intermediate_stops: TripLeg[] };
export type LegGroup = TripLegGroup | WalkLeg;

export function groupLegs(legs: (TripLeg | WalkLeg)[]): LegGroup[] {
  const groups: LegGroup[] = [];
  for (const leg of legs) {
    const prev = groups.at(-1);
    if (
      leg.kind === "trip" &&
      prev?.kind === "trip" &&
      prev.trip_id === leg.trip_id
    ) {
      prev.to_stop_name = leg.to_stop_name;
      prev.arrival_time = leg.arrival_time;
      prev.travel_seconds += leg.travel_seconds;
      prev.intermediate_stops.push(leg);
    } else {
      groups.push(
        leg.kind === "trip"
          ? { ...leg, intermediate_stops: [] }
          : { ...leg }
      );
    }
  }
  return groups;
}
