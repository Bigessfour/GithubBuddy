

import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E / visual checks for the Vite dev app.
 * @see https://playwright.dev/docs/intro
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    // Match Vite's default "Local" URL so the webServer readiness check resolves reliably.
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    /** Explicit CLI flags per https://vite.dev/guide/cli — matches `baseURL` and fails if 5173 is taken. */
    command: "npx vite --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
