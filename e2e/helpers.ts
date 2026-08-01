import { expect, type Locator, type Page } from "@playwright/test";
import { ROUTES_RESPONSE, searchStops } from "./fixtures";

/**
 * Shared driving helpers for the end-to-end specs.
 *
 * The backend rate-limits — measured at roughly a 30-request bucket refilling
 * a few per second. These helpers deliberately do NOT retry through a 429:
 * it is reported immediately, by name, so the limiter stays visible instead of
 * being papered over. Staying under it is handled by spending the budget only
 * where it buys something — route-planning.spec.ts drives the real backend,
 * while specs about the UI itself serve their data from fixtures.
 */

/**
 * The stop dropdown's failure box. Several regions carry role="status" — the
 * alerts banner and the pending-explanation notice — so key on the retry
 * button, which only this one has.
 */
function stopLookupFailure(page: Page): Locator {
  return page
    .getByRole("status")
    .filter({ has: page.getByRole("button", { name: "Try again" }) });
}

/** The route search error banner (HealthBanner is role="alert" too, but has no button). */
function routeSearchFailure(page: Page): Locator {
  return page
    .getByRole("alert")
    .filter({ has: page.getByRole("button", { name: /try again/i }) });
}

/** Settle as soon as either outcome appears, rather than waiting out a timeout. */
async function raceVisible(win: Locator, fail: Locator, timeout: number) {
  await Promise.race([
    win.waitFor({ state: "visible", timeout }),
    fail.waitFor({ state: "visible", timeout }),
  ]).catch(() => {
    // Neither appeared; the assertion that follows reports it properly
  });
}

async function describe(locator: Locator): Promise<string> {
  return (await locator.innerText()).replace(/\s+/g, " ").trim();
}

/**
 * Stub the endpoints every page load hits regardless of what a test is doing.
 *
 * /health and /alerts fire on every navigation and contribute nothing to the
 * planning specs — they have dedicated coverage in banners.spec.ts. Removing
 * them takes the ambient cost of a page load from two backend requests to
 * zero, which is most of what was tripping the rate limiter.
 */
export async function stubAmbientEndpoints(page: Page) {
  await page.route("**/health", (route) =>
    route.fulfill({
      json: {
        status: "ok",
        gtfs: { graph_built: true, last_built_at: "2026-08-01T00:00:00Z" },
        reliability: { records: 1 },
      },
    }),
  );
  await page.route("**/alerts", (route) => route.fulfill({ json: [] }));
}

/**
 * Serve the whole planning flow from fixtures.
 *
 * For specs about the UI rather than the backend — layout in particular —
 * this makes geometry assertions deterministic and keeps their request cost
 * at zero, leaving the rate-limit budget for the integration spec.
 */
export async function stubPlanningData(page: Page) {
  await stubAmbientEndpoints(page);
  await page.route("**/stops?*", (route) => {
    const query = new URL(route.request().url()).searchParams.get("query") ?? "";
    return route.fulfill({ json: searchStops(query) });
  });
  await page.route("**/routes?*", (route) => route.fulfill({ json: ROUTES_RESPONSE }));
}

/**
 * Open the app.
 *
 * Playwright gives each test its own browser context, so localStorage already
 * starts empty — the clear-and-reload this used to do only bought a second
 * page load, and with it a second round of backend calls.
 */
export async function gotoApp(page: Page) {
  await page.goto("/");
}

export async function selectStop(page: Page, label: string, query: string, stopName: string) {
  const input = page.getByRole("combobox", { name: label });
  await input.fill(query);

  // Option accessible names include the "Routes: …" line, so match by substring
  const option = page.getByRole("option", { name: stopName }).first();
  const failure = stopLookupFailure(page);

  await raceVisible(option, failure, 15_000);
  if (await failure.isVisible().catch(() => false)) {
    throw new Error(`Stop lookup for "${query}" failed: ${await describe(failure)}`);
  }

  await expect(option).toBeVisible();
  await option.click();
  await expect(input).toHaveValue(stopName);
}

/** Submit the form and wait for the search to settle on `expected`. */
async function submitAndSettle(page: Page, expected: Locator) {
  await page.getByRole("button", { name: "Find routes" }).click();

  const failure = routeSearchFailure(page);
  // Route scoring against the real graph can take a while on a cold cache
  await raceVisible(expected, failure, 60_000);
  if (await failure.isVisible().catch(() => false)) {
    throw new Error(`Route search failed: ${await describe(failure)}`);
  }

  await expect(expected).toBeVisible();
}

/** Submit and wait for a non-empty result list. */
export function findRoutes(page: Page) {
  return submitAndSettle(page, page.getByText(/route(s)? found/i));
}

/** Submit and wait for the "no routes" empty state — not an error. */
export function findNoRoutes(page: Page) {
  return submitAndSettle(page, page.getByText(/No routes found/i));
}
