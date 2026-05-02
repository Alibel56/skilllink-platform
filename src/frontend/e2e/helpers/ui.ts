import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TestUser } from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_PATH = path.resolve(__dirname, '../fixtures/users.json');

export function loadFixtures(): { client: TestUser; specialist: TestUser; admin?: TestUser } {
  return JSON.parse(readFileSync(FIXTURES_PATH, 'utf8'));
}

export async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /^Log in$/ }).click();
  await page.waitForURL((u) => u.pathname === '/home');
}

export async function injectToken(page: Page, token: string): Promise<void> {
  // Set token before any app code runs so authed pages render directly.
  await page.addInitScript((t) => {
    localStorage.setItem('skilllink_access_token', t);
  }, token);
}

/** Wait for the page to leave its loading skeletons by checking that *no* TanStack Query is fetching. */
export async function waitForQueriesIdle(page: Page, timeoutMs = 10_000): Promise<void> {
  await page.waitForFunction(
    () => {
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      return skeletons.length === 0;
    },
    null,
    { timeout: timeoutMs },
  );
}

export function within(root: Locator) {
  return {
    button: (name: string | RegExp) => root.getByRole('button', { name }),
    link: (name: string | RegExp) => root.getByRole('link', { name }),
    text: (text: string | RegExp) => root.getByText(text),
  };
}

/** Common heading assertion. */
export async function expectHeading(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.getByRole('heading', { name: text })).toBeVisible();
}
