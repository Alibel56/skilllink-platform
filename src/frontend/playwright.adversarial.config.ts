import { defineConfig, devices } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5174';

export default defineConfig({
  testDir: './e2e/specs-adversarial',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
