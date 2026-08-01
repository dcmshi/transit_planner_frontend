import { test, expect } from "@playwright/test";
import { gotoApp, selectStop, stubAmbientEndpoints } from "./helpers";

/**
 * The radio itself is visually hidden and its label covers it, so a real
 * click lands on the label — which is exactly how a user switches mode.
 */
function modeOption(page: import("@playwright/test").Page, name: string) {
  return page.locator("label").filter({ hasText: name });
}

/**
 * Arrive-by mode against the real backend.
 *
 * Worth exercising live: this parameter previously returned cached answers
 * that ignored the deadline, so a stubbed test would have proved nothing.
 */

test.beforeEach(async ({ page }) => {
  await stubAmbientEndpoints(page);
  await gotoApp(page);
});

async function planArrivingBy(page: import("@playwright/test").Page, deadline: string) {
  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");
  await modeOption(page, "Arrive by").click();
  await page.getByLabel("Arrival time").fill(deadline);
  await page.getByRole("button", { name: "Find routes" }).click();
}

test("returns only itineraries that arrive before the deadline", async ({ page }) => {
  await planArrivingBy(page, "12:00");

  await expect(page.getByText(/route(s)? found/i)).toBeVisible({ timeout: 60_000 });

  // Every card's summary shows "HH:MM → HH:MM"; the arrival must beat 12:00
  const summaries = await page.getByText(/^\d{2}:\d{2} → \d{2}:\d{2}$/).allTextContents();
  expect(summaries.length).toBeGreaterThan(0);
  for (const s of summaries) {
    const arrival = s.split("→")[1].trim();
    expect(arrival.localeCompare("12:00")).toBeLessThanOrEqual(0);
  }
});

test("says nothing arrives in time rather than claiming no service exists", async ({ page }) => {
  // Service on this corridor starts well after 05:00
  await planArrivingBy(page, "05:00");

  await expect(page.getByText(/nothing arrives in time/i)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/try a later deadline/i)).toBeVisible();
  await expect(page.getByText(/No routes found between those stops/i)).toHaveCount(0);
});

test("switching to arrive-by hides the Now reset and relabels the field", async ({ page }) => {
  await expect(page.getByLabel("Departure time")).toBeVisible();
  await expect(page.getByRole("button", { name: "Now" })).toBeVisible();

  await modeOption(page, "Arrive by").click();

  await expect(page.getByLabel("Arrival time")).toBeVisible();
  await expect(page.getByRole("button", { name: "Now" })).toHaveCount(0);
});
