 ---
  # CLAUDE.md

  ## Project: GO Transit Reliability Router — Frontend

  This is the web UI for the GO Transit Reliability Router backend
  (https://github.com/dcmshi/transit_planner).  The backend exposes a
  fully typed OpenAPI/FastAPI HTTP API; this repo is a standalone frontend
  that talks to it over HTTP.

  ---

  ## Problem Statement

  GO Transit bus routes between Toronto and Guelph frequently suffer from
  bus no-shows, vague service alerts, and risky transfers.  The backend
  builds reliability-first routes.  This frontend makes those results
  accessible to real users.

  ---

  ## Stack

  | Concern | Choice | Notes |
  |---|---|---|
  | Framework | **Next.js 15 (App Router)** or **SvelteKit** | Pick one at project start |
  | Package manager | **bun** or **pnpm** — not npm | Faster installs |
  | Type generation | **openapi-typescript** | Run against `GET /openapi.json`; re-run
  after any backend schema change |
  | Data fetching | **TanStack Query v5** | Cache + background refetch for `/routes` and
  `/stops` |
  | Map | **MapLibre GL JS** | Stop markers, route polylines; free tile source (e.g.
  protomaps) |
  | Styling | **Tailwind CSS** | |
  | Testing | **Vitest** + **Testing Library** | |

  ---

  ## Backend API

  Backend runs at `http://localhost:8000` in development.
  Set `NEXT_PUBLIC_API_URL` (or equivalent) via env var — never hard-code.

  ### Type generation

  ```bash
  npx openapi-typescript http://localhost:8000/openapi.json -o src/types/api.ts

  Re-run whenever the backend schema changes.

  Endpoints

  GET /stops?query=<string>

  Search stops by name substring (min 2 chars).

  // Response: StopResult[]
  {
    stop_id: string
    stop_name: string
    lat: number
    lon: number
    routes_served: string[]   // e.g. ["31", "40", "97"]
  }

  GET /routes

  ?origin=<stop_id>
  &destination=<stop_id>
  &departure_time=<HH:MM>       // optional, defaults to now
  &travel_date=<YYYY-MM-DD>     // optional, defaults to today
  &explain=<bool>               // optional, triggers LLM explanation


  // Response: RoutesResponse
  {
    routes: ScoredRoute[]
    explanation?: string        // present only when ?explain=true
  }

  // ScoredRoute
  {
    legs: (TripLeg | WalkLeg)[] // discriminated on `kind`
    total_travel_seconds: number
    transfers: number
    total_walk_metres: number
    risk_score: number          // 0–1
    risk_label: "Low" | "Medium" | "High"
  }

  // TripLeg  (kind === "trip")
  {
    kind: "trip"
    from_stop_id: string
    to_stop_id: string
    from_stop_name: string
    to_stop_name: string
    trip_id: string
    route_id: string
    service_id: string
    departure_time: string      // HH:MM:SS — may exceed 24:00:00
    arrival_time: string
    travel_seconds: number
    risk: {
      risk_score: number
      risk_label: "Low" | "Medium" | "High"
      modifiers: string[]
      is_cancelled: boolean
    } | null
  }

  // WalkLeg  (kind === "walk")
  {
    kind: "walk"
    from_stop_id: string
    to_stop_id: string
    from_stop_name: string
    to_stop_name: string
    distance_m: number
    walk_seconds: number
    risk: null
  }

  Note on departure_time: GTFS times can exceed 24:00:00 for trips
  that run past midnight.  Do not parse with Date directly — strip to
  HH:MM for display or convert seconds-past-midnight manually:
  function hmsToSeconds(hms: string): number {
    const [h, m, s] = hms.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  }

  GET /health

  Liveness + data freshness check.  Use to gate the UI with a "data not
  loaded yet" state if gtfs.graph_built === false.

  ---
  v1 MVP Scope

  - Origin / destination stop search (calls GET /stops?query=)
  - Date + departure time picker (default to today / now)
  - Route results list with risk label badges (Low / Medium / High)
  - Leg-by-leg breakdown with departure/arrival times
  - Walk leg display with distance
  - Transfer count + total walk distance summary per route
  - Optional LLM explanation toggle (?explain=true)
  - /health check on load — warn user if backend graph not built

  Out of scope (v1)

  - Maps / stop markers (add in v2)
  - Real-time auto-refresh
  - User accounts / saved journeys
  - TTC integration (backend not yet wired)

  ---
  Key Implementation Notes

  - Stop search debounce: debounce the /stops query by 300 ms to
  avoid hammering the backend on every keystroke.
  - Route caching: the backend already caches find_routes() output
  for 1 hour by (origin, dest, date, HH:MM).  TanStack Query's
  staleTime should align (e.g. staleTime: 60 * 60 * 1000).
  - Risk colour mapping:
    - Low → green
    - Medium → amber
    - High → red
  - Discriminated union: legs arrive as TripLeg | WalkLeg with
  kind as the discriminant.  Use leg.kind === "trip" guards.
  - No direct GTFS access: the frontend never talks to Metrolinx APIs
  directly — everything goes through the backend.

  ---
  Git Conventions

  - Do not include Co-Authored-By: Claude or any AI attribution
  lines in commit messages or PR bodies.

  ---
  Dev Setup

  bun install          # or pnpm install
  cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000
  bun dev              # start dev server

  # In a separate terminal — start the backend:
  # cd ../transit_planner && uv run uvicorn api.main:app --port 8000



  ---