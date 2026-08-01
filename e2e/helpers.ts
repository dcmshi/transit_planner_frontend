import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Shared driving helpers for the live-backend specs.
 *
 * The backend rate-limits, and running the suite repeatedly trips it. The app
 * surfaces a 429 as an explicit failure with a retry — not as a bogus "No
 * stops found" or a silent blank — so these helpers take that retry with
 * backoff, which is what a user would do. They only engage on that surfaced
 * error state: a genuine missing stop or empty result still fails the test.
 */

export async function selectStop(page: Page, label: string, query: string, stopName: string) {
  const input = page.getByRole("combobox", { name: label });
  await input.fill(query);

  // Option accessible names include the "Routes: …" line, so match by substring
  const option = page.getByRole("option", { name: stopName }).first();
  const retry = page.getByRole("button", { name: "Try again" });

  await expect(async () => {
    if (await retry.isVisible().catch(() => false)) await retry.click();
    await expect(option).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000, intervals: [500, 2_000, 5_000] });

  await option.click();
  await expect(input).toHaveValue(stopName);
}

/**
 * Submit the form and wait for the search to settle on `expected`, retrying
 * through the error banner if the search itself is rate-limited.
 */
async function submitAndSettle(page: Page, expected: Locator) {
  await page.getByRole("button", { name: "Find routes" }).click();

  const retry = page.getByRole("alert").getByRole("button", { name: /try again/i });

  await expect(async () => {
    if (await retry.isVisible().catch(() => false)) await retry.click();
    await expect(expected).toBeVisible({ timeout: 15_000 });
  }).toPass({ timeout: 60_000, intervals: [1_000, 3_000, 5_000] });
}

/** Submit and wait for a non-empty result list. */
export function findRoutes(page: Page) {
  return submitAndSettle(page, page.getByText(/route(s)? found/i));
}

/** Submit and wait for the "no routes" empty state — not an error. */
export function findNoRoutes(page: Page) {
  return submitAndSettle(page, page.getByText(/No routes found/i));
}

/** Fresh page with no persisted stops. */
export async function gotoClean(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}
