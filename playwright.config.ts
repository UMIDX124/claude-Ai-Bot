import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT ?? "3101";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "dot" : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-small", use: { ...devices["iPhone 13"] } },
  ],
  webServer: process.env.PLAYWRIGHT_EXTERNAL
    ? undefined
    : {
        command: `pnpm dotenv -e .env.local -- next dev --port ${PORT}`,
        url: `${BASE_URL}/api/health`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
