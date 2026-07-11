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

### Audit fixes — medium
- [x] **`aria-controls`** added to `StopSearch` combobox input pointing to `id="stop-listbox"` on the `<ul>` (ARIA spec requirement)
- [x] **Keyboard nav tests** (6) added to `StopSearch.test.tsx` — ArrowDown/Up bounds, Enter selects, Escape closes, `aria-activedescendant` updates
- [x] **`as any` in `useRoutePolyline.test.ts`** replaced with typed `q()` helper using `UseQueryResult<StopResult | null>`

### Audit fixes — low
- [x] **`formatGtfsTime` minute padding** — `m.padStart(2, "0")` added; new test covers single-digit minutes
- [x] **`localStorage.setItem` quota guard** — write wrapped in try-catch; silently ignored on quota errors
- [x] **`role="status"` on `LoadingRoutes`** — screen readers now announce the loading state; spinner has `aria-hidden="true"`
- [x] **`useHealth` post-healthy polling** — changed from `false` to `5 * 60_000` ms so degradation (graph rebuild, reliability drop) is detected
- [x] **`useRoutePolyline` map flash fix** — last settled GeoJSON held in a `useRef`; returned while queries are pending so map doesn't blank between route selections

**Test total: 79 across 12 files**

---

## v6 — Repo Audit Fixes (2026-07-10)

All items from the 2026-07-10 audit (see `TODO.md`) addressed:

### Bug fixes
- [x] **Persisted stops now restore into the form** — stop state lifted to `page.tsx` via new `useSavedStops` hook; `RouteForm` is controlled for origin/destination
- [x] **localStorage clobber on mount fixed** — writes suppressed until the post-hydration load completes (StrictMode-safe, regression-tested)
- [x] **`.env.example` committed** — was silently swallowed by the `.env*` gitignore pattern
- [x] **`useRoutePolyline` stale-pending fix** — unfetchable short-named stops filtered out instead of left as permanently-pending disabled queries
- [x] **`useRoutePolyline` concurrent-render safety** — render-phase ref mutation replaced with a `null`/`undefined`/GeoJSON return contract; `RouteMap` holds the previous polyline while lookups are in flight

### Behaviour & UX
- [x] **AI explanation split into its own query** — fetched once per journey, no longer re-triggered by the 5-minute background refresh
- [x] **Route selection and React keys are identity-based** (`routeKey`) — survive background refetches that reorder results
- [x] **Card select and expand decoupled** — summary click selects; a dedicated chevron button (with `aria-expanded`) toggles details
- [x] **GTFS times past midnight normalized** — `25:15` → `01:15 (+1 day)`; malformed input no longer throws
- [x] **Past travel dates rejected at submit** with an inline error
- [x] **API requests carry abort signals + 90 s timeout**

### Accessibility
- [x] **Unique per-instance ids in `StopSearch`** (`useId`) — `aria-controls`/`aria-activedescendant` no longer collide across the two comboboxes
- [x] **All form labels associated** via `htmlFor`/`id`
- [x] **Escape closes the empty "No stops found" dropdown; ArrowDown reopens a closed one**

### Infrastructure
- [x] **GitHub Actions CI** — lint, typecheck, tests on push/PR
- [x] **ESLint + `tsc --noEmit` pass** (both had pre-existing failures)
- [x] **`ErrorBoundary` logs caught errors**; `HealthBanner` shows the real API base URL
- [x] **Invalid `ignoreScripts` field removed** from package.json
- [x] **README `bun test` → `bun run test`** (plain `bun test` invokes bun's own runner, not vitest)

**Test total: 128 across 21 files**

---

## v7 — Second Audit Pass + Live Service Data (2026-07-10)

All items from the second frontend audit pass (see `TODO.md`) addressed:

### Behavior fixes
- [x] **Explanation gated on the explain flag** — unchecking "Include AI explanation" hides it again (cached for cheap re-enable)
- [x] **Editing a stop input clears the stale selection** — text and submitted stop can no longer diverge

### Robustness
- [x] **Submit validation** for empty date, empty time, past date (form is `noValidate`; backdated same-day queries deliberately allowed)
- [x] **Persisted stops validated on load** — malformed storage can't crash the map
- [x] **AbortSignal fallbacks** for browsers without `timeout`/`any`

### Polish
- [x] Memoized polyline GeoJSON (stable identity across re-renders)
- [x] `routeKeys` computed once and passed down
- [x] Deterministic e2e empty-state test (date beyond the schedule window)

### Live service data (new)
- [x] **`AlertsBanner`** — active GTFS-RT service alerts via `GET /alerts`, capped at 3 headlines + "+N more"
- [x] **Live delay display** — delayed legs show "Running ~N min late — expected HH:MM – HH:MM"

### Docs
- [x] README: e2e section, Playwright in stack table, v6/v7 feature notes
- [x] `screenshot.png` recaptured from the live app

**Test total: 149 across 22 files (+ 5 Playwright e2e)**

---

## Out of Scope (future)

- User accounts / saved journeys
- TTC integration
