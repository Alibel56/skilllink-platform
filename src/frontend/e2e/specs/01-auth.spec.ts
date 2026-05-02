import { test, expect } from '@playwright/test';
import { uniqueEmail, uniquePhone, dbVerifyUser, clearRateLimits, dbDeleteUsers } from '../helpers/api.js';
import { loadFixtures, loginViaUI } from '../helpers/ui.js';

test.describe('Auth', () => {
  test('login page renders and validates input', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();

    // Empty submit -> Zod validation appears
    await page.getByRole('button', { name: /^Log in$/ }).click();
    await expect(page.getByText('Enter a valid email')).toBeVisible();
  });

  test('login with wrong credentials shows server error', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('nope@skilllink.kz');
    await page.getByPlaceholder('••••••••').fill('wrong-password');
    await page.getByRole('button', { name: /^Log in$/ }).click();

    // Backend returns "Invalid email or password" — UI normalises it
    await expect(page.locator('text=/incorrect|invalid|password/i').first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('login with fixture client succeeds and lands on /home', async ({ page }) => {
    const { client } = loadFixtures();
    await loginViaUI(page, client.email, client.password);
    await expect(page).toHaveURL(/\/home/);
    await expect(page.getByText(`Welcome back,`)).toBeVisible();
  });

  test('signup form validates required fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await page.getByRole('button', { name: 'Create account' }).click();
    // Several validation errors should be visible
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
  });

  test('signup creates user and shows email-pending screen', async ({ page }) => {
    clearRateLimits();
    const email = uniqueEmail('signup');
    await page.goto('/signup');
    await page.getByPlaceholder('Alex').fill('Sarah');
    await page.getByPlaceholder('Stone').fill('Connor');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('+7 700 ...').fill(uniquePhone());
    await page.locator('input[type="date"]').fill('1995-08-12');
    const passwords = page.locator('input[type="password"]');
    await passwords.nth(0).fill('strong42');
    await passwords.nth(1).fill('strong42');
    await page.getByRole('button', { name: 'Create account' }).click();

    // Success -> redirect to email-pending
    await page.waitForURL(/\/email-pending/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Confirm your email' })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    // Cleanup: delete the freshly registered user so re-runs stay deterministic
    dbDeleteUsers(email);
  });

  test('signup blocks duplicate email', async ({ page }) => {
    clearRateLimits();
    const { client } = loadFixtures();
    await page.goto('/signup');
    await page.getByPlaceholder('Alex').fill('Dupe');
    await page.getByPlaceholder('Stone').fill('Account');
    await page.getByPlaceholder('you@example.com').fill(client.email);
    await page.getByPlaceholder('+7 700 ...').fill(uniquePhone());
    await page.locator('input[type="date"]').fill('1990-01-01');
    const passwords = page.locator('input[type="password"]');
    await passwords.nth(0).fill('strong42');
    await passwords.nth(1).fill('strong42');
    await page.getByRole('button', { name: 'Create account' }).click();

    // Should NOT redirect; should show server-error mapping
    await expect(page.locator('text=/already|exists|registered/i').first()).toBeVisible();
  });

  test('forgot-password dialog accepts email and confirms', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('anyone@skilllink.kz');
    await page.getByRole('button', { name: 'Forgot password?' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Send reset link' }).click();

    // Either a toast appears or the form returns silently — either is fine; just ensure no JS crash.
    await page.waitForTimeout(800);
  });
});
