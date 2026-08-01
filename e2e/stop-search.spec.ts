import { test, expect } from "@playwright/test";

/**
 * Stop lookup failure handling. The backend rate-limits, and a burst of
 * requests really does return 429 — this was found by a run of the suite
 * tripping the limiter, at which point the dropdown claimed "No stops found"
 * and the station looked like it didn't exist.
 */

test("a rate-limited lookup reports the failure rather than 'no stops found'", async ({ page }) => {
  await page.route("**/stops?*", (route) =>
    route.fulfill({ status: 429, json: { detail: "Too Many Requests" } }),
  );

  await page.goto("/");
  await page.getByRole("combobox", { name: "Origin" }).fill("Guelph Central");

  const status = page.getByRole("status").filter({ hasText: /too many requests/i });
  await expect(status).toBeVisible();
  await expect(page.getByText("No stops found")).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Origin" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("retrying a failed lookup recovers once the backend answers", async ({ page }) => {
  let failuresLeft = 2; // the initial request plus React Query's single retry

  // Fully stubbed on both paths: falling through to the live backend would
  // expose this test to the very rate limiter it is about
  await page.route("**/stops?*", async (route) => {
    if (failuresLeft > 0) {
      failuresLeft -= 1;
      await route.fulfill({ status: 429, json: { detail: "Too Many Requests" } });
      return;
    }
    await route.fulfill({
      json: [{
        stop_id: "GL",
        stop_name: "Guelph Central GO",
        lat: 43.5448,
        lon: -80.2482,
        routes_served: ["06260926-GT"],
      }],
    });
  });

  await page.goto("/");
  await page.getByRole("combobox", { name: "Origin" }).fill("Guelph Central");

  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();

  await expect(page.getByRole("option", { name: "Guelph Central GO" }).first()).toBeVisible();
});
