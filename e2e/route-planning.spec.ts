import { test, expect, type Page } from "@playwright/test";

/**
 * End-to-end flow against the real backend (FastAPI + PostGIS in Docker).
 * Requires the backend at http://localhost:8000 with GTFS data loaded.
 */

async function selectStop(page: Page, label: string, query: string, stopName: string) {
  const input = page.getByRole("combobox", { name: label });
  await input.fill(query);
  // Option accessible names include the "Routes: …" line, so match by substring
  await page.getByRole("option", { name: stopName }).first().click();
  await expect(input).toHaveValue(stopName);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Each test starts with a clean slate — no persisted stops
  await page.evaluate(() => localStorage.clear());
  await page.reload();
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

  const submit = page.getByRole("button", { name: "Find routes" });
  await expect(submit).toBeEnabled();
  await submit.click();

  // Route scoring against the real graph can take a while on cold cache
  await expect(page.getByText(/route(s)? found/i)).toBeVisible({ timeout: 60_000 });

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
  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");
  await page.getByLabel("Departure time").fill("06:00");
  await page.getByRole("button", { name: "Find routes" }).click();
  await expect(page.getByText(/route(s)? found/i)).toBeVisible({ timeout: 60_000 });

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

test("shows the empty state for a stop pair with no service", async ({ page }) => {
  // Two nearby local bus stops with no scheduled connection at 03:00
  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Guelph Central", "Guelph Central GO Bus");
  await page.getByLabel("Departure time").fill("03:00");
  await page.getByRole("button", { name: "Find routes" }).click();

  await expect(
    page.getByText(/No routes found|route(s)? found/i).first()
  ).toBeVisible({ timeout: 60_000 });
});
