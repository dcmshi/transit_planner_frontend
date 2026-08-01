"use client";

import { useState } from "react";
import type { ScoredRoute, WalkLeg } from "@/lib/api";
import { groupLegs, type TripLegGroup } from "@/lib/groupLegs";
import { RiskBadge } from "./RiskBadge";
import { formatDuration, formatGtfsTime, formatDistance } from "@/lib/format";
import { routeLabel } from "@/lib/routeName";
import { routeTimes } from "@/lib/routeTimes";
import { WalkIcon } from "./icons";
import { RiskBasisPanel } from "./RiskBasisPanel";

interface Props {
  route: ScoredRoute;
  index: number;
  recommended?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function RouteCard({ route, index, recommended = false, isSelected, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);
  const groups = groupLegs(route.legs);
  const times = routeTimes(route);

  // Green is the brand accent and belongs to "Recommended"; selection uses a
  // neutral dark ring so a card can be both without two accents competing
  const borderClass = isSelected
    ? "border-n-900 ring-1 ring-n-900"
    : recommended
    ? "border-brand"
    : "border-n-200";

  return (
    <div
      data-testid="route-card"
      // State as data, not colour — the styling above is free to change
      data-selected={isSelected ? "true" : "false"}
      data-recommended={recommended ? "true" : "false"}
      className={`rounded-xl border bg-n-0 shadow-sm overflow-hidden ${borderClass}`}
    >
      {recommended && (
        <div className="bg-brand px-5 py-1 text-xs font-semibold text-white">
          Recommended
        </div>
      )}
      {/* Summary row — selecting a route and expanding its details are
          separate actions so collapsing never re-selects */}
      <div className="flex w-full items-stretch hover:bg-n-50 transition-colors">
        <button
          type="button"
          onClick={() => onSelect?.()}
          aria-pressed={isSelected}
          className="flex min-h-11 flex-1 items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xs font-semibold text-n-400 w-5">#{index}</span>
            <RiskBadge label={route.risk_label} />
            <span className="text-base font-semibold text-n-900">
              {formatDuration(route.total_travel_seconds)}
            </span>
            {times && (
              <span className="text-sm tabular-nums text-n-500">
                {formatGtfsTime(times.departure)} → {formatGtfsTime(times.arrival)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-n-500">
            {route.transfers > 0 && (
              <span className="rounded-full bg-n-100 px-2 py-0.5 text-xs font-medium text-n-600">
                {route.transfers} transfer{route.transfers !== 1 ? "s" : ""}
              </span>
            )}
            {route.total_walk_metres > 0 && (
              <span className="text-xs text-n-400">{formatDistance(route.total_walk_metres)} walk</span>
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide route details" : "Show route details"}
          className="flex min-h-11 min-w-11 items-center justify-center px-4 text-n-500 hover:text-n-800"
        >
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Leg groups */}
      {expanded && (
        <ul className="divide-y divide-n-100 border-t border-n-100">
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
  const label = routeLabel(group.route_id);

  return (
    <li className="px-5 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          {label.prominent && (
            <span data-route-label="prominent" className="text-xs font-bold uppercase tracking-wider text-accent-ink">
              {label.text}
            </span>
          )}
          <span className="text-sm font-medium text-n-900 truncate">
            {group.from_stop_name}
            <span className="mx-1.5 text-n-400">→</span>
            {group.to_stop_name}
          </span>
          <span className="text-xs text-n-500">
            {formatGtfsTime(group.departure_time)} – {formatGtfsTime(group.arrival_time)}
            <span className="mx-1 text-n-300">·</span>
            {formatDuration(group.travel_seconds)}
          </span>
          {!label.prominent && (
            <span data-route-label="demoted" className="text-xs text-n-400">{label.text}</span>
          )}
          {typeof group.live_delay_seconds === "number" &&
            group.live_delay_seconds >= 60 &&
            group.expected_departure && (
              <span className="text-xs font-medium text-warn-ink-soft">
                Running ~{Math.round(group.live_delay_seconds / 60)} min late — expected{" "}
                {formatGtfsTime(group.expected_departure)}
                {group.expected_arrival ? ` – ${formatGtfsTime(group.expected_arrival)}` : ""}
              </span>
            )}
          {hasStops && (
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-1 text-left text-xs text-accent-ink hover:text-accent-ink-strong"
            >
              ↳ {stopCount} stop{stopCount !== 1 ? "s" : ""}{" "}
              <span className="text-n-400">— {expanded ? "collapse" : "expand"}</span>
            </button>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
          {group.risk && <RiskBadge label={group.risk.risk_label} />}
          {group.risk?.is_cancelled && (
            <span className="text-xs font-semibold text-danger-ink-soft">Cancelled</span>
          )}
        </div>
      </div>

      {expanded && (
        <ul className="mt-3 ml-2 flex flex-col border-l-2 border-accent-edge">
          {[group, ...group.intermediate_stops].map((leg, i) => (
            <li key={i} className="flex justify-between py-0.5 pl-3 text-xs text-n-600">
              <span>{leg.from_stop_name}</span>
              <span className="text-n-400 tabular-nums">{formatGtfsTime(leg.departure_time)}</span>
            </li>
          ))}
          <li className="flex justify-between py-0.5 pl-3 text-xs font-medium text-n-700">
            <span>{group.to_stop_name}</span>
            <span className="text-n-400 tabular-nums">{formatGtfsTime(group.arrival_time)}</span>
          </li>
        </ul>
      )}

      {group.risk?.modifiers && group.risk.modifiers.length > 0 && (
        <p className="mt-1.5 text-xs text-n-400 italic">{group.risk.modifiers.join(" · ")}</p>
      )}

      {group.risk && <RiskBasisPanel risk={group.risk} />}
    </li>
  );
}

function WalkLegRow({ leg }: { leg: WalkLeg }) {
  return (
    <li className="flex items-center gap-2 bg-n-50 px-5 py-2.5 text-sm text-n-500">
      <WalkIcon />
      <span>Walk {formatDistance(leg.distance_m)}</span>
      <span className="text-n-300">·</span>
      <span className="text-xs">{leg.from_stop_name} to {leg.to_stop_name}</span>
      <span className="ml-auto text-xs text-n-400">{formatDuration(leg.walk_seconds)}</span>
    </li>
  );
}
