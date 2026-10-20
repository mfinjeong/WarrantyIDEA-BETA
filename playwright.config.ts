import { defineConfig } from "@playwright/test";
const externalURL = process.env.UI_QA_URL || process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalURL || "http://127.0.0.1:3002";
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.spec.ts",
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    trace: "retain-on-failure",
  },
  webServer: externalURL
    ? undefined
    : {
        command: "npm run preview",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120000,
      },
});
