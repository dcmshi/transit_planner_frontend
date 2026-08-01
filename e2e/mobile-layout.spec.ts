import { test, expect, type Page } from "@playwright/test";
import { findRoutes, gotoClean, selectStop } from "./helpers";

/**
 * Layout checks at a phone viewport, against the real backend. The desktop
 * flow is covered in route-planning.spec.ts.
 */

test.use({ viewport: { width: 390, height: 844 } });

async function planGuelphToUnion(page: Page) {
  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");
  await page.getByLabel("Departure time").fill("06:00");
  await findRoutes(page);
}

test.beforeEach(async ({ page }) => {
  await gotoClean(page);
});

test("the map sits between the form and the results", async ({ page }) => {
  await planGuelphToUnion(page);

  const form = await page.getByRole("button", { name: "Find routes" }).boundingBox();
  const map = await page.getByRole("region", { name: "Route map" }).boundingBox();
  const results = await page.getByText(/route(s)? found/i).boundingBox();

  expect(map!.y).toBeGreaterThan(form!.y);
  expect(map!.y).toBeLessThan(results!.y);
});

test("nothing overflows the viewport horizontally", async ({ page }) => {
  await planGuelphToUnion(page);

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});

test("the results header wraps rather than clipping the refresh control", async ({ page }) => {
  await planGuelphToUnion(page);

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
