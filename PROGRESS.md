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

## v2 — Map

- [x] Install `maplibre-gl` (v5)
- [x] `RouteMap` component — MapLibre map with OpenFreeMap liberty tiles (no API key)
- [x] Green origin marker / red destination marker; updates reactively on stop selection
- [x] `fitBounds` when both stops set; `flyTo` when only one stop set
- [x] Side-by-side layout: form+results left, sticky map right (480 px tall)
- [x] Stacks vertically on viewports narrower than `lg` breakpoint
- [x] Layout widened to `max-w-5xl`; dynamic import with `ssr: false`

---

## v3 — Auto-Refresh

- [x] `refetchInterval: 5 min` on `useRoutes` — background refetch while results are shown
- [x] `refetchOnWindowFocus: true` — silent refresh when user returns to the tab
- [x] Separate `isInitialLoading` vs `isRefreshing` states — results stay visible during background refetch
- [x] "Updated at HH:MM" timestamp in route list header
- [x] Spinning refresh button — disabled + animated while refetching

---

## v4 — Route Polylines

- [x] `useRoutePolyline` hook — resolves coordinates for all leg stops; origin/destination from existing state; intermediate stops fetched via `GET /stops?query=name` matched by `stop_id`, cached with `staleTime: Infinity`
- [x] GeoJSON source (`route-polyline`) + two line layers added to map on load
- [x] Trip legs drawn as solid coloured lines (green/amber/red by risk); walk legs as dashed grey
- [x] Route selection state in `page.tsx` — first route auto-selected; resets on new query
- [x] `RouteCard` — blue ring on selected card; `onSelect` fires on header click
- [x] `RouteList` — forwards `selectedRouteIndex` + `onSelectRoute` to each card
- [x] All new props optional — 56/56 existing tests pass

---

## v5 — Quality & Accessibility

### Bug fixes
- [x] **`todayDate()` uses UTC date** — fixed with `new Date().toLocaleDateString('en-CA')`
- [x] **`package.json` name was `"scaffold-tmp"`** — renamed to `"go-transit-reliability-router"`
- [x] **Unused `TripLeg` import** in `RouteCard.tsx` — removed

### Accessibility
- [x] **`role="combobox"`** added to `StopSearch` input — `aria-expanded` now valid
- [x] **Keyboard navigation** in `StopSearch` — ArrowUp/Down navigate list, Enter selects, Escape closes; `aria-activedescendant` tracks focused option

### Test coverage
- [x] **`RouteForm` tests** (7) — render, submit gating, payload shape, explain flag, `onStopsChange`, local date default
- [x] **`LoadingRoutes` tests** (2) — spinner and loading text
- [x] **`useRoutePolyline` tests** (7) — GeoJSON output, coord resolution, missing-coord skip, leg kind/riskLabel
- [x] **`as any` casts** in `HealthBanner.test.tsx` and `StopSearch.test.tsx` replaced with `ReturnType<typeof hook>`
- [x] **Date `min` attribute** added to date input to prevent past-date selection

### Features
- [x] **Error boundary** — `<ErrorBoundary>` wraps all children in `layout.tsx`; shows a reload prompt on unhandled render errors
- [x] **Persist last stops** — origin and destination persisted in `localStorage` under `"go-transit-last-stops"` and restored on next visit

**Test total: 72 across 12 files**

---

## Out of Scope (future)

- User accounts / saved journeys
- TTC integration
