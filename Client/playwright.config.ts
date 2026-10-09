import { defineConfig, devices } from '@playwright/test';

// End-to-end tests for the web client against a real, isolated API.
// `npx playwright test` boots both servers itself (see webServer below) on
// their own ports, so a dev stack already running on 3000/5000 is untouched.
const WEB_PORT = 3001;
const API_PORT = 5001;

export default defineConfig({
  testDir: './e2e',
  // Journeys share one database and the API's per-IP sign-up/login rate
  // limits, so run them one at a time.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/start-api.js',
      url: `http://localhost:${API_PORT}/api/v1/categories`,
      // Playwright treats a 401 as "up" - no auth needed for the probe.
      timeout: 240_000,
      reuseExistingServer: false,
      env: { E2E_API_PORT: String(API_PORT) },
    },
    {
      command: 'npm start',
      url: `http://localhost:${WEB_PORT}`,
      timeout: 240_000,
      reuseExistingServer: false,
      env: {
        PORT: String(WEB_PORT),
        BROWSER: 'none',
        REACT_APP_BASE_URL: `http://localhost:${API_PORT}/api`,
      },
    },
  ],
});
