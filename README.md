# GO Transit Reliability Router — Frontend

Web UI for the [GO Transit Reliability Router](https://github.com/dcmshi/transit_planner) backend. Surfaces reliability-first route planning for GO Transit buses between Toronto and Guelph — accounting for bus no-shows, service alerts, and risky transfers.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Package manager | bun |
| Styling | Tailwind CSS |
| Data fetching | TanStack Query v5 |
| Type generation | openapi-typescript |
| Testing | Vitest + Testing Library (jsdom) |

## Prerequisites

- [bun](https://bun.sh) installed
- Backend running at `http://localhost:8000` — see [transit_planner](https://github.com/dcmshi/transit_planner)

## Setup

```bash
bun install
cp .env.example .env.local   # edit if backend runs on a different port
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Regenerating API types

Run this whenever the backend schema changes:

```bash
bunx openapi-typescript http://localhost:8000/openapi.json -o src/types/api.ts
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL for the backend API |

## Testing

```bash
bun test              # run all tests once
bun run test:watch    # watch mode
```

56 tests across 9 files covering utility functions and all major components:

| File | What it covers |
|---|---|
| `src/lib/format.test.ts` | `formatDuration`, `formatGtfsTime`, `formatDistance` |
| `src/lib/explanation.test.ts` | `isExplanationAvailable`, `parseRecommendedIndex` |
| `src/lib/groupLegs.test.ts` | consecutive same-trip leg merging |
| `src/components/RiskBadge.test.tsx` | colour class per risk level |
| `src/components/ExplanationPanel.test.tsx` | available vs. Ollama-unavailable states |
| `src/components/HealthBanner.test.tsx` | all 5 health/data states |
| `src/components/StopSearch.test.tsx` | dropdown threshold, selection, clear |
| `src/components/RouteList.test.tsx` | empty state, route count, explanation panel |
| `src/components/RouteCard.test.tsx` | summary row, expand/collapse, recommended flag |

## Project structure

```
src/
  app/              # Next.js App Router pages and layout
  components/       # UI components (RouteCard, StopSearch, HealthBanner, …)
  hooks/            # TanStack Query hooks (useRoutes, useStops, useHealth)
  lib/              # Pure utility functions and API client
  types/
    api.ts          # Auto-generated from backend OpenAPI schema — do not edit
  test/             # Vitest setup file
```

## Features (v1)

- Stop search with 300 ms debounce
- Date and departure time picker (defaults to today / now)
- Route results with Low / Medium / High risk badges
- Leg-by-leg breakdown (trip and walk legs) with expand/collapse
- Transfer count and total walk distance per route
- Optional AI explanation via Ollama (`?explain=true`)
- Health banner when the backend graph is building or reliability data is missing

Maps and real-time refresh are planned for v2.
