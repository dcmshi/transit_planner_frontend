import { test, expect } from "@playwright/test";
import { findRoutes, gotoApp, selectStop, stubAmbientEndpoints } from "./helpers";

/**
 * The risk explainer against real scoring data. Worth running live: the
 * counters come from the same lookup the server scored against, so a stub
 * would only prove the component renders its own fixture.
 */

test.beforeEach(async ({ page }) => {
  await stubAmbientEndpoints(page);
  await gotoApp(page);
});

test("explains a leg's risk score from data already on the page", async ({ page }) => {
  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");
  await page.getByLabel("Departure time").fill("06:00");
  await findRoutes(page);

  await page.getByRole("button", { name: "Show route details" }).first().click();

  const why = page.getByRole("button", { name: /why (low|medium|high) risk\?/i }).first();
  await expect(why).toBeVisible();
  await expect(why).toHaveAttribute("aria-expanded", "false");

  // Opening it must not hit the backend — the counters ride along on the leg
  const calls: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes(":8000")) calls.push(r.url());
  });
  await why.click();

  await expect(why).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Based on").first()).toBeVisible();
  await expect(page.getByText(/of \d+ scheduled/).first()).toBeVisible();
  expect(calls).toEqual([]);
});
