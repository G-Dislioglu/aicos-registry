import { defineConfig, devices } from '@playwright/test'

const mayaPlaywrightPort = Number(process.env.MAYA_PLAYWRIGHT_PORT || 3005)
const mayaPlaywrightBaseUrl = `http://localhost:${mayaPlaywrightPort}`
const mayaPlaywrightReadyUrl = `${mayaPlaywrightBaseUrl}/login`

export default defineConfig({
  testDir: './tests-e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: mayaPlaywrightBaseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${mayaPlaywrightPort}`,
    url: mayaPlaywrightReadyUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
