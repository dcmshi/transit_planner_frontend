# TODO — Repo Audit (2026-07-10)

Findings from a static read-through of all source files.

**First pass: all items addressed on 2026-07-10** — with regression tests
where applicable (suite grew from 79 tests / 12 files to 128 tests / 21
files, all passing along with `eslint` and `tsc --noEmit`). Resolution notes
are inline where the fix differs from the original suggestion.

**Second pass (same day, post-refactor + e2e):** re-read of the current code
including the first pass's own changes. Baseline verified green (lint, tsc,
128 unit tests, 5 e2e). **All items below addressed on 2026-07-10** — suite
now 149 unit tests / 22 files plus the e2e suite; resolution notes inline.

---

## Second pass — findings (2026-07-10, all addressed)

### Behavior

- [x] **Stale AI explanation shown after unchecking "Include AI
  explanation".** A disabled React Query still exposes its cached data, so
  the panel survived turning the checkbox off.
  *Fixed:* `useRoutes` gates the returned explanation on
  `params?.explain === true`; the cache stays warm, so re-checking the box
  restores it without a new LLM call. Regression tests cover off → null and
  back on → cached value, no extra fetch.

- [x] **Editing a StopSearch input after selecting keeps the stale
  selection.** *Fixed:* any edit that diverges from the selected stop's name
  clears the selection (`onChange(null)`), and the value-sync only overwrites
  the text when a stop is *set* — so the user's typing is never wiped.
  Regression test asserts both the cleared selection and the preserved text.

### Robustness

- [x] **Date/time inputs have unvalidated edge states.** *Fixed:* submit
  validation requires both fields with specific messages ("Please choose a
  travel date." / "Please choose a departure time."), keeps the past-date
  check, and the form is `noValidate` so our messages own the UX (native
  min-bubbles would also have blocked deliberate backdated same-day queries).
  Tests cover empty date, empty time, past date, and the allowed past-time
  today case.

- [x] **`useSavedStops` trusts the persisted shape.** *Fixed:* `sanitizeStop`
  accepts a stop only with string `stop_id`/`stop_name` and numeric
  `lat`/`lon`, defaults `routes_served`, and drops anything else — a
  malformed entry can no longer crash the map on every visit. Tests cover
  missing coords, missing `routes_served`, and non-object values.

- [x] **`AbortSignal.any` / `AbortSignal.timeout` have no fallback.**
  *Fixed:* `withTimeout` degrades gracefully — no `timeout` support → plain
  caller signal (no timeout), no `any` support → caller signal wins over the
  timeout. Tests simulate both missing statics.

### Polish / minor

- [x] **`RouteMap` re-applies polyline data on every page render.**
  *Fixed:* `useRoutePolyline` memoizes its GeoJSON on route identity,
  settlement state, and a fingerprint of the resolved coordinates — stable
  object identity across unrelated re-renders. Identity regression test
  added.

- [x] **`routeKeys` computed twice per render.** *Fixed:* `page.tsx` passes
  its computed keys to `RouteList` via a new optional `routeKeys` prop
  (RouteList still computes them as a fallback when rendered standalone).

- [x] **Backdating the time on today's date shows already-departed trips.**
  *Resolved as intentional:* the time input gets `min` (a picker nudge) when
  the date is today, but submits are deliberately not blocked — the backend
  returns the rest of the day's schedule from the chosen time, the e2e suite
  relies on deterministic backdated queries, and a hard block would also have
  made the past-date test flaky at midnight. Documented in the form comment
  and covered by an "allows a past departure time today" test.

- [x] **The e2e empty-state test can't fail.** *Fixed:* the test now queries
  a date one year out — reliably beyond any GTFS schedule window — and
  asserts the "No routes found" empty state specifically.

### Docs

- [x] **README e2e coverage** — added an end-to-end section (`bun run
  test:e2e`, backend prerequisite, one-time `npx playwright install
  chromium`, not wired into CI) and Playwright in the stack table.
- [x] **`screenshot.png` refreshed** — captured from the live app via
  Playwright (form, route card, polyline map, and the new alerts banner).

### Enhancement

- [x] **Live service data surfaced.** `GET /alerts` now feeds an
  `AlertsBanner` under the health banner (capped at 3 headlines + "+N more" —
  the live feed carries 20+ standing alerts, which dogfooding caught
  swallowing the page), and delayed legs show "Running ~N min late — expected
  HH:MM – HH:MM" from the per-leg GTFS-RT fields (`groupLegs` carries the
  boarding leg's expected departure and the final leg's expected arrival
  through merges). New `useAlerts` hook; tests for the banner states,
  truncation, delay line, sub-minute suppression, and group merging.

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
