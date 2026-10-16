import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for TheGreenFeed.
 *
 * The web server runs `next dev` with SURVEY_DEV_PREVIEW=1 so the complete
 * survey experience can be tested while the production survey stays closed
 * (publication is controlled exclusively by SURVEY_PUBLISHED, which no test
 * touches). Test runs never talk to Supabase: submission responses are mocked
 * in tests/e2e/survey.spec.ts, so no database rows are created by test runs.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      SURVEY_DEV_PREVIEW: "1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
