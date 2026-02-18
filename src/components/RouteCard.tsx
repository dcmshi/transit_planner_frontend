"use client";

import { useState } from "react";
import type { ScoredRoute, TripLeg, WalkLeg } from "@/lib/api";
import { RiskBadge } from "./RiskBadge";
import { formatDuration, formatGtfsTime, formatDistance } from "@/lib/format";

// A TripLeg extended with all same-trip legs collapsed into it
type TripLegGroup = TripLeg & { intermediate_stops: TripLeg[] };
type LegGroup = TripLegGroup | WalkLeg;

function groupLegs(legs: (TripLeg | WalkLeg)[]): LegGroup[] {
  const groups: LegGroup[] = [];
  for (const leg of legs) {
    const prev = groups.at(-1);
    if (
      leg.kind === "trip" &&
      prev?.kind === "trip" &&
      prev.trip_id === leg.trip_id
    ) {
      // Same physical bus — extend the group to this stop
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

interface Props {
  route: ScoredRoute;
  index: number;
}

export function RouteCard({ route, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const groups = groupLegs(route.legs);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-400">#{index}</span>
          <RiskBadge label={route.risk_label} />
          <span className="text-sm font-medium text-gray-900">
            {formatDuration(route.total_travel_seconds)}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {route.transfers > 0 && (
            <span>{route.transfers} transfer{route.transfers !== 1 ? "s" : ""}</span>
          )}
          {route.total_walk_metres > 0 && (
            <span>{formatDistance(route.total_walk_metres)} walk</span>
          )}
          <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Leg groups */}
      {expanded && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100 px-4">
          {groups.map((group, i) =>
            group.kind === "trip" ? (
              <TripGroupRow key={i} group={group} />
            ) : (
              <WalkLegRow key={i} leg={group} />
            )
          )}
        </ul>
      )}
    </div>
  );
}

function TripGroupRow({ group }: { group: TripLegGroup }) {
  const [expanded, setExpanded] = useState(false);
  const stopCount = group.intermediate_stops.length + 1;
  const hasStops = group.intermediate_stops.length > 0;

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            🚌 Route {group.route_id}
          </span>
          <span className="text-sm text-gray-900 truncate">
            {group.from_stop_name} → {group.to_stop_name}
          </span>
          <span className="text-xs text-gray-500">
            {formatGtfsTime(group.departure_time)} – {formatGtfsTime(group.arrival_time)}
            {" · "}{formatDuration(group.travel_seconds)}
          </span>
          {hasStops && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-left text-xs text-blue-500 hover:text-blue-700"
            >
              ↳ {stopCount} stop{stopCount !== 1 ? "s" : ""} — {expanded ? "collapse" : "tap to expand"}
            </button>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          {group.risk && <RiskBadge label={group.risk.risk_label} />}
          {group.risk?.is_cancelled && (
            <span className="text-xs font-medium text-red-600">Cancelled</span>
          )}
        </div>
      </div>

      {/* Intermediate stops */}
      {expanded && (
        <ul className="mt-2 ml-4 flex flex-col gap-1 border-l-2 border-blue-100 pl-3">
          {[group, ...group.intermediate_stops].map((leg, i) => (
            <li key={i} className="flex justify-between text-xs text-gray-600">
              <span>{leg.from_stop_name}</span>
              <span className="text-gray-400">{formatGtfsTime(leg.departure_time)}</span>
            </li>
          ))}
          {/* Final destination */}
          <li className="flex justify-between text-xs text-gray-600">
            <span>{group.to_stop_name}</span>
            <span className="text-gray-400">{formatGtfsTime(group.arrival_time)}</span>
          </li>
        </ul>
      )}

      {group.risk?.modifiers && group.risk.modifiers.length > 0 && (
        <p className="mt-1 text-xs text-gray-400">{group.risk.modifiers.join(" · ")}</p>
      )}
    </li>
  );
}

function WalkLegRow({ leg }: { leg: WalkLeg }) {
  return (
    <li className="py-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>🚶</span>
        <span>
          Walk {formatDistance(leg.distance_m)} from {leg.from_stop_name} to{" "}
          {leg.to_stop_name}
        </span>
        <span className="text-xs text-gray-400">
          ({formatDuration(leg.walk_seconds)})
        </span>
      </div>
    </li>
  );
}
