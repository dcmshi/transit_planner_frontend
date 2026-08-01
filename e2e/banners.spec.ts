import { test, expect } from "@playwright/test";

/**
 * Banner states that can't be produced by driving the UI — the backend has to
 * misbehave, or the alert feed has to hold known contents. Both are stubbed at
 * the network layer so these stay deterministic; the rest of the suite runs
 * against the live backend.
 */

test("shows the backend-down banner when /health is unreachable", async ({ page }) => {
  await page.route("**/health", (route) => route.abort("connectionrefused"));

  await page.goto("/");

  const banner = page.getByRole("alert").first();
  await expect(banner).toContainText("Cannot reach the backend");
  await expect(banner).toContainText("http://localhost:8000");
});

test("no backend-down banner while the backend is healthy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Cannot reach the backend")).toHaveCount(0);
});

test("alerts banner dedupes headlines and expands to the full list", async ({ page }) => {
  const alert = (id: string, header: string) => ({
    alert_id: id,
    header,
    description: "",
    affected_route_ids: [],
    affected_stop_ids: [],
    fetched_at: "2026-07-31T12:00:00Z",
  });

  await page.route("**/alerts", (route) =>
    route.fulfill({
      json: [
        alert("a1", "Elevator out of service"),
        alert("a2", "Elevator out of service"),
        alert("a3", "Route 31 detour at Guelph"),
        alert("a4", "Union Station platform closure"),
        alert("a5", "Reduced service on the Kitchener line"),
      ],
    }),
  );

  await page.goto("/");

  const banner = page.getByRole("status").filter({ hasText: "active service alerts" });
  // Five alerts, four distinct headlines
  await expect(banner).toContainText("4 active service alerts");
  await expect(banner).not.toContainText("Reduced service on the Kitchener line");

  await banner.getByRole("button", { name: "+1 more" }).click();

  await expect(banner).toContainText("Reduced service on the Kitchener line");
  await expect(banner.getByRole("listitem")).toHaveCount(4);

  await banner.getByRole("button", { name: "Show fewer" }).click();
  await expect(banner).not.toContainText("Reduced service on the Kitchener line");
});

test("hides the alerts banner when the feed is empty", async ({ page }) => {
  await page.route("**/alerts", (route) => route.fulfill({ json: [] }));

  await page.goto("/");

  await expect(page.getByText(/active service alert/)).toHaveCount(0);
});
