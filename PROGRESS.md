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

---

## Backlog

### Bug fixes

- [ ] **`todayDate()` uses UTC date** (`RouteForm.tsx`) — `new Date().toISOString().slice(0, 10)` returns the UTC date; in EST after 7 pm it defaults to tomorrow. Fix: `new Date().toLocaleDateString('en-CA')` (returns `YYYY-MM-DD` in local time)
- [ ] **`package.json` name is `"scaffold-tmp"`** — rename to `"go-transit-reliability-router"`
- [ ] **Unused `TripLeg` import** (`RouteCard.tsx` line 4) — `TripLeg` is imported but never referenced; remove it

### Accessibility

- [ ] **StopSearch keyboard navigation** (`StopSearch.tsx`) — dropdown has no `keydown` handlers; users cannot navigate with ArrowUp / ArrowDown, confirm with Enter, or dismiss with Escape. The `listbox` + `option` ARIA roles are already correct — just needs key event wiring
- [ ] **Missing `role="combobox"`** (`StopSearch.tsx`) — `aria-expanded` is only valid on the `combobox` role but the `<input>` has no explicit role (implicit `textbox` does not support `aria-expanded`). Fix: add `role="combobox"` to the `<input>` alongside the existing `aria-autocomplete="list"`

### Test coverage

- [ ] **`RouteForm` has no tests** — highest-value gap; should cover: default date/time initialisation, submit blocked when stops are null, `onSubmit` payload shape, `onStopsChange` callback, explain checkbox toggle
- [ ] **`LoadingRoutes` has no tests** — add a basic render test
- [ ] **`useRoutePolyline` has no tests** — complex GeoJSON-building logic; should cover: known coords used for origin/destination, intermediate stops resolved from fetched data, legs with missing coords skipped, correct `kind` and `riskLabel` properties on features
- [ ] **No hook-level tests at all** (`useRoutes`, `useHealth`, `useStops`) — consider at minimum smoke tests verifying query keys, `staleTime`, and `enabled` conditions

### Code quality / tech debt

- [ ] **`as any` in test mocks** (`HealthBanner.test.tsx`, `StopSearch.test.tsx`) — replace with `{ data: ..., isError: ..., isPending: ... } satisfies Partial<ReturnType<typeof useHealth>>` (or equivalent) to get type-checked mocks without casting
- [ ] **Date input has no `min` attribute** (`RouteForm.tsx` line 80) — nothing prevents selecting a date in the past; add `min={todayDate()}` to the date `<input>`

### Features

- [ ] **Error boundary** — no `<ErrorBoundary>` in `layout.tsx`; an unhandled render error anywhere in the tree currently produces a blank page with no recovery path
- [ ] **Persist last query** — store the last-used origin, destination, date and time in `localStorage` and restore them on next visit; reduces friction for commuters who run the same journey daily

---

## Out of Scope (future)

- User accounts / saved journeys
- TTC integration
