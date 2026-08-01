import { test, expect } from "@playwright/test";
import { findNoRoutes, findRoutes, gotoApp, selectStop, stubAmbientEndpoints } from "./helpers";

/**
 * End-to-end flow against the real backend (FastAPI + PostGIS in Docker).
 * Requires the backend at http://localhost:8000 with GTFS data loaded.
 */

test.beforeEach(async ({ page }) => {
  await stubAmbientEndpoints(page);
  await gotoApp(page);
});

test("backend is reachable and healthy", async ({ request }) => {
  const health = await request.get("http://localhost:8000/health");
  expect(health.ok()).toBe(true);
  const body = await health.json();
  expect(body.gtfs.graph_built).toBe(true);
  expect(body.reliability.records).toBeGreaterThan(0);
});

test("plans a route from Guelph Central to Union Station", async ({ page }) => {
  await expect(page).toHaveTitle(/GO Transit Reliability Router/);

  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");

  // Early departure so the schedule always has trips left in the day
  await page.getByLabel("Departure time").fill("06:00");

  await expect(page.getByRole("button", { name: "Find routes" })).toBeEnabled();
  // Route scoring against the real graph can take a while on cold cache
  await findRoutes(page);

  // At least one card with a risk badge and a duration
  const firstCard = page.getByRole("button", { name: /#1/ });
  await expect(firstCard).toBeVisible();
  await expect(page.getByText(/(Low|Medium|High) risk/).first()).toBeVisible();

  // First route is auto-selected
  await expect(firstCard).toHaveAttribute("aria-pressed", "true");

  // Expand leg details
  await page.getByRole("button", { name: "Show route details" }).first().click();
  await expect(page.getByText(/Route \S+/).first()).toBeVisible();

  // The map rendered (maplibre canvas is present)
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
});

test("selecting a different route moves the selection highlight", async ({ page }) => {
  // Oakville rather than Guelph: Guelph Central to Union yields exactly one
  // route at every time of day, so this test skipped itself and the selection
  // behaviour was never actually exercised
  await selectStop(page, "Origin", "Oakville", "Oakville GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");
  await page.getByLabel("Departure time").fill("06:00");
  await findRoutes(page);

  const cards = page.getByRole("button", { name: /#\d/ });
  const count = await cards.count();
  test.skip(count < 2, "backend returned fewer than 2 routes");

  await cards.nth(1).click();
  await expect(cards.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(cards.nth(0)).toHaveAttribute("aria-pressed", "false");
});

test("persists selected stops across a reload", async ({ page }) => {
  // Regression for the audit's High #1/#2: persisted stops must restore into
  // the form (not just the map) and must survive StrictMode double effects
  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");

  await page.reload();

  await expect(page.getByRole("combobox", { name: "Origin" })).toHaveValue("Guelph Central GO");
  await expect(page.getByRole("combobox", { name: "Destination" })).toHaveValue("Union Station GO");
  await expect(page.getByRole("button", { name: "Find routes" })).toBeEnabled();

  // …and a second reload (the old bug wiped storage on the first mount)
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Origin" })).toHaveValue("Guelph Central GO");
});

test("shows the empty state when the date is beyond the schedule window", async ({ page }) => {
  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");

  // GTFS feeds publish a few months ahead at most — a year out is reliably
  // outside the schedule window, so the backend deterministically finds
  // nothing (unlike a "quiet" stop pair, which depends on feed contents)
  const future = new Date();
  future.setFullYear(future.getFullYear() + 1);
  await page.getByLabel("Date").fill(future.toISOString().slice(0, 10));
  await page.getByLabel("Departure time").fill("09:00");
  await findNoRoutes(page);
});
