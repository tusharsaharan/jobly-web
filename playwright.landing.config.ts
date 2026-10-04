import { defineConfig, devices } from "@playwright/test";

/** Isolated config for landing-page e2e against a dev server you start
 *  manually (npx vite dev --port 5199). The default playwright.config.ts
 *  boots its own webServer on 8080, which may be occupied by another app. */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:5199",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  outputDir: "./test-results-landing",
});
