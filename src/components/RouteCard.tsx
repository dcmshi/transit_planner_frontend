"use client";

import { useState } from "react";
import type { ScoredRoute, TripLeg, WalkLeg } from "@/lib/api";
import { RiskBadge } from "./RiskBadge";
import { formatDuration, formatGtfsTime, formatDistance } from "@/lib/format";

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
  recommended?: boolean;
}

export function RouteCard({ route, index, recommended = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const groups = groupLegs(route.legs);

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden ${recommended ? "border-green-400 ring-1 ring-green-400" : "border-gray-200"}`}>
      {recommended && (
        <div className="bg-green-600 px-5 py-1 text-xs font-semibold text-white">
          Recommended
        </div>
      )}
      {/* Summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 w-5">#{index}</span>
          <RiskBadge label={route.risk_label} />
          <span className="text-base font-semibold text-gray-900">
            {formatDuration(route.total_travel_seconds)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {route.transfers > 0 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {route.transfers} transfer{route.transfers !== 1 ? "s" : ""}
            </span>
          )}
          {route.total_walk_metres > 0 && (
            <span className="text-xs text-gray-400">{formatDistance(route.total_walk_metres)} walk</span>
          )}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Leg groups */}
      {expanded && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
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
    <li className="px-5 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-green-700">
            Route {group.route_id}
          </span>
          <span className="text-sm font-medium text-gray-900 truncate">
            {group.from_stop_name}
            <span className="mx-1.5 text-gray-400">→</span>
            {group.to_stop_name}
          </span>
          <span className="text-xs text-gray-500">
            {formatGtfsTime(group.departure_time)} – {formatGtfsTime(group.arrival_time)}
            <span className="mx-1 text-gray-300">·</span>
            {formatDuration(group.travel_seconds)}
          </span>
          {hasStops && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-left text-xs text-green-600 hover:text-green-800"
            >
              ↳ {stopCount} stop{stopCount !== 1 ? "s" : ""}{" "}
              <span className="text-gray-400">— {expanded ? "collapse" : "expand"}</span>
            </button>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
          {group.risk && <RiskBadge label={group.risk.risk_label} />}
          {group.risk?.is_cancelled && (
            <span className="text-xs font-semibold text-red-600">Cancelled</span>
          )}
        </div>
      </div>

      {expanded && (
        <ul className="mt-3 ml-2 flex flex-col border-l-2 border-green-100">
          {[group, ...group.intermediate_stops].map((leg, i) => (
            <li key={i} className="flex justify-between py-0.5 pl-3 text-xs text-gray-600">
              <span>{leg.from_stop_name}</span>
              <span className="text-gray-400 tabular-nums">{formatGtfsTime(leg.departure_time)}</span>
            </li>
          ))}
          <li className="flex justify-between py-0.5 pl-3 text-xs font-medium text-gray-700">
            <span>{group.to_stop_name}</span>
            <span className="text-gray-400 tabular-nums">{formatGtfsTime(group.arrival_time)}</span>
          </li>
        </ul>
      )}

      {group.risk?.modifiers && group.risk.modifiers.length > 0 && (
        <p className="mt-1.5 text-xs text-gray-400 italic">{group.risk.modifiers.join(" · ")}</p>
      )}
    </li>
  );
}

function WalkLegRow({ leg }: { leg: WalkLeg }) {
  return (
    <li className="flex items-center gap-2 bg-gray-50 px-5 py-2.5 text-sm text-gray-500">
      <span className="text-base">🚶</span>
      <span>Walk {formatDistance(leg.distance_m)}</span>
      <span className="text-gray-300">·</span>
      <span className="text-xs">{leg.from_stop_name} to {leg.to_stop_name}</span>
      <span className="ml-auto text-xs text-gray-400">{formatDuration(leg.walk_seconds)}</span>
    </li>
  );
}
