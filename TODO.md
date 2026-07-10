# TODO — Repo Audit (2026-07-10)

Findings from a static read-through of all source files.

**Status: all items addressed on 2026-07-10** — with regression tests where
applicable (suite grew from 79 tests / 12 files to 128 tests / 21 files, all
passing along with `eslint` and `tsc --noEmit`). Resolution notes are inline
where the fix differs from the original suggestion.

---

## High — bugs

- [x] **Persisted stops never restore into the form.** `page.tsx` loads saved
  stops in a post-mount effect, but `RouteForm` captures `defaultOrigin` /
  `defaultDestination` in `useState` initializers, which only read props on
  first render — before the load effect has fired. Result: the map markers
  restore but the origin/destination inputs stay empty and submit stays
  disabled.
  *Fixed:* stop state lifted to `page.tsx` — `RouteForm` is now controlled
  (`origin`/`destination` + change callbacks). Regression tests in
  `RouteForm.test.tsx` (props arriving after mount) and `page.test.tsx`
  (end-to-end restore from localStorage into the form).

- [x] **localStorage persist effect clobbers saved stops on mount.** The write
  effect ran on mount with the initial empty state, overwriting storage before
  the loaded value re-rendered; under StrictMode's double-invoked effects the
  second load read the clobbered value and wiped persistence on every dev
  reload.
  *Fixed:* persistence extracted into `useSavedStops`, which only writes from
  the setter and suppresses writes until the post-hydration load completes.
  Regression test renders the hook under `<StrictMode>` and asserts storage
  survives mount intact.

- [x] **`.env.example` is missing from the repo.** README setup says
  `cp .env.example .env.local`, but the `.gitignore` pattern `.env*` prevented
  it from ever being committed.
  *Fixed:* `!.env.example` exception added to `.gitignore`; file committed.

## Medium

- [x] **`useRoutePolyline` can return a stale polyline forever.** Intermediate
  stops with names under the 2-char search minimum produced permanently
  disabled — and in React Query v5, permanently *pending* — queries, so the
  settled check never passed.
  *Fixed:* unfetchable stops are filtered out of the query list entirely (their
  legs are skipped gracefully, as before). Regression test asserts no query is
  created for them and the hook still settles.

- [x] **`useRoutePolyline` writes a ref during render.**
  *Fixed:* the render-phase `lastGeojson` ref cache is gone. The hook now
  returns `null` (no route → clear), `undefined` (lookups in flight → keep
  current), or GeoJSON (settled → draw), and `RouteMap`'s effect simply skips
  `setData` while pending — same no-flash behaviour, no render-phase mutation.

- [x] **Duplicate DOM ids across the two `StopSearch` instances.**
  *Fixed:* ids namespaced with `useId()`. Test renders two instances and
  asserts distinct listbox ids and correctly-paired `aria-controls`.

- [x] **Escape can't close the "No stops found" dropdown.**
  *Fixed:* Escape handled before the empty-results guard; regression test added.

- [x] **Background auto-refresh re-runs the AI explanation.**
  *Fixed:* the explanation now lives in its own query keyed on the journey,
  fetched once (`staleTime: Infinity`, no interval/focus refetch) while the
  routes query keeps polling without the explain flag. Regression test asserts
  a routes refetch does not re-invoke the explain call.

- [x] **Form labels aren't programmatically associated.**
  *Fixed:* `htmlFor`/`id` wired for the StopSearch inputs and the Date /
  Departure time fields; tests use `getByLabelText`.

- [x] **No CI.** *Fixed:* `.github/workflows/ci.yml` runs
  `bun install --frozen-lockfile`, lint, `tsc --noEmit`, and the test suite on
  pushes to main and PRs. (Both lint and tsc had pre-existing failures that
  were also fixed: sync-setState-in-effect violations in `StopSearch`, and
  test-file casts that never compiled.)

## Low — polish & robustness

- [x] **Index keys + positional selection in `RouteList`.**
  *Fixed:* new `routeKey`/`routeKeys` helpers derive a stable identity from
  leg trip/stop ids (duplicates disambiguated); React keys and the page's
  selection state are now identity-based, so both survive reorders. Unit
  tests cover stability under reordering; page test covers selection reset on
  a new query.

- [x] **Expand toggles lack `aria-expanded`.** *Fixed:* added to both the
  details chevron and the intermediate-stops expander.

- [x] **Card click couples select + expand.** *Fixed:* the summary area is now
  a select-only button (`aria-pressed`); a separate labelled chevron button
  toggles the details. Tests assert selecting doesn't expand and
  expand/collapse never re-selects.

- [x] **`HealthBanner` prints the env var raw.** *Fixed:* `API_BASE` (with its
  localhost fallback) exported from `lib/api.ts` and reused.

- [x] **`ErrorBoundary` swallows errors silently.** *Fixed:* `componentDidCatch`
  logs the error and component stack; test added.

- [x] **`apiFetch` has no timeout and ignores React Query's abort signal.**
  *Fixed:* all api methods accept an `AbortSignal` (passed from queryFn
  context) combined via `AbortSignal.any` with a 90 s `AbortSignal.timeout`.

- [x] **`package.json` `"ignoreScripts"` is not a real field.** *Fixed:* removed
  (`trustedDependencies` already covers the intent under bun).

- [x] **GTFS times past midnight display verbatim.** *Fixed:* `formatGtfsTime`
  normalizes `25:15` → `01:15 (+1 day)` and returns malformed input as-is
  instead of throwing; tests added.

- [x] **ArrowDown doesn't reopen a closed dropdown.** *Fixed:* ArrowDown on a
  closed dropdown reopens it when the input has ≥ 2 chars; test added.

- [x] **Past-date guard is picker-only.** *Fixed:* submit-time validation shows
  an inline `role="alert"` error for past dates and clears it on change; test
  covers reject → correct → submit.

## Testing gaps

- [x] `lib/api.ts` — 404 → `{routes: []}` mapping, explain-flag query string,
  encoding, error statuses, timeout signal (`api.test.ts`).
- [x] `useStops` debounce (fake-timer test: intermediate keystrokes skipped)
  and `useHealth` interval logic (extracted as pure `healthRefetchInterval`).
- [x] `page.tsx` wiring — localStorage restore into the form, submit payload,
  selection reset on new query (`page.test.tsx` with `useSavedStops.test.tsx`
  covering load/persist/StrictMode).
- [x] `ErrorBoundary` tested; `RouteMap`'s fitBounds math extracted into
  `lib/mapBounds.ts` and unit-tested (including the east-of-destination
  corner-ordering regression from commit `19cbf4c`).

## Follow-ups (not blocking, noted during fixes)

- `README.md` said `bun test`, which invokes bun's built-in runner instead of
  vitest (26 spurious failures) — corrected to `bun run test`.
- MapLibre map rendering itself (markers, layers) remains untested — would
  need a canvas/WebGL mock; the extractable logic around it is now covered.
