# GO Transit Reliability Router — Frontend Progress

## Completed

- [x] Scaffold Next.js 16 (App Router) + TypeScript + Tailwind CSS + Turbopack
- [x] Package manager: bun
- [x] Generate API types from backend OpenAPI schema → `src/types/api.ts`
- [x] Install TanStack Query v5 + devtools
- [x] `QueryClientProvider` wired into root layout (`src/app/providers.tsx`)
- [x] `staleTime: 1hr` on QueryClient (matches backend cache TTL)
- [x] `.env.example` + `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

## Up Next

- [x] `/health` check — fetch on load, show warning banner if `gtfs.graph_built === false`
- [x] Stop search — debounced combobox (300ms) hitting `GET /stops?query=`
- [x] Route form — origin/destination pickers + date + departure time inputs
- [x] Results list — risk badge (Low/Medium/High), total travel time, transfer count per route
- [x] Leg breakdown — trip legs grouped by trip_id, walk legs with distance, expandable stops

---

## Out of Scope (v1)

- Maps / stop markers (v2, MapLibre GL JS)
- Real-time auto-refresh
- User accounts / saved journeys
- TTC integration
