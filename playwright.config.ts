import { defineConfig } from "@playwright/test"

const baseURL = "http://127.0.0.1:4173"

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: "line",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "serve . -l 4173 --no-clipboard",
    url: `${baseURL}/e2e/issue.html`,
    reuseExistingServer: !process.env.CI,
  },
})
