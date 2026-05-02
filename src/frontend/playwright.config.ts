import { defineConfig, devices } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5174';

export default defineConfig({
  testDir: './e2e/specs',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  globalSetup: './e2e/helpers/global-setup.ts',
});
