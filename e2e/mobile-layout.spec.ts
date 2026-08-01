import { test, expect, type Page } from "@playwright/test";

/**
 * Layout checks at a phone viewport, against the real backend. The desktop
 * flow is covered in route-planning.spec.ts.
 */

test.use({ viewport: { width: 390, height: 844 } });

async function selectStop(page: Page, label: string, query: string, stopName: string) {
  const input = page.getByRole("combobox", { name: label });
  await input.fill(query);
  await page.getByRole("option", { name: stopName }).first().click();
  await expect(input).toHaveValue(stopName);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("the map sits between the form and the results", async ({ page }) => {
  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");
  await page.getByLabel("Departure time").fill("06:00");
  await page.getByRole("button", { name: "Find routes" }).click();

  await expect(page.getByText(/route(s)? found/i)).toBeVisible({ timeout: 60_000 });

  const form = await page.getByRole("button", { name: "Find routes" }).boundingBox();
  const map = await page.getByRole("region", { name: "Route map" }).boundingBox();
  const results = await page.getByText(/route(s)? found/i).boundingBox();

  expect(map!.y).toBeGreaterThan(form!.y);
  expect(map!.y).toBeLessThan(results!.y);
});

test("nothing overflows the viewport horizontally", async ({ page }) => {
  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");
  await page.getByLabel("Departure time").fill("06:00");
  await page.getByRole("button", { name: "Find routes" }).click();
  await expect(page.getByText(/route(s)? found/i)).toBeVisible({ timeout: 60_000 });

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});

test("the results header wraps rather than clipping the refresh control", async ({ page }) => {
  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");
  await page.getByLabel("Departure time").fill("06:00");
  await page.getByRole("button", { name: "Find routes" }).click();
  await expect(page.getByText(/route(s)? found/i)).toBeVisible({ timeout: 60_000 });

  const refresh = await page.getByRole("button", { name: "Refresh routes" }).boundingBox();
  expect(refresh!.x + refresh!.width).toBeLessThanOrEqual(390);
});

test("the map keeps its height on a phone", async ({ page }) => {
  const map = await page.getByRole("region", { name: "Route map" }).boundingBox();
  // h-72 below the sm breakpoint — the old hardcoded 480px overwhelmed the
  // 844px-tall viewport
  expect(map!.height).toBeGreaterThan(200);
  expect(map!.height).toBeLessThan(400);
});
