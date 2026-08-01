import { defineConfig } from "@playwright/test";

/**
 * E2E tests against the real backend stack. Prerequisites:
 *   docker compose up  (in the transit_planner backend repo)
 * The frontend dev server is started automatically (or reused if running).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: 0,
  // The backend rate-limits: measured at roughly a 30-request bucket refilling
  // a few per second. Two workers keeps the suite comfortably inside it without
  // meaningfully slowing it — wall time is dominated by route scoring, not by
  // concurrency.
  workers: 2,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bun dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
