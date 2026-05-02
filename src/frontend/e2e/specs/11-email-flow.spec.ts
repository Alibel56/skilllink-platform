import { test, expect } from '@playwright/test';

test.describe('Email confirmation page', () => {
  test('missing token shows error state', async ({ page }) => {
    await page.goto('/confirm-email');
    await expect(page.getByRole('heading', { name: 'Confirmation failed' })).toBeVisible();
    await expect(page.getByText(/missing confirmation token/i)).toBeVisible();
  });

  test('invalid/expired token shows error state', async ({ page }) => {
    await page.goto('/confirm-email?token=this-token-does-not-exist-12345');
    // The endpoint returns 401/404 — UI maps to error state
    await expect(page.getByRole('heading', { name: 'Confirmation failed' })).toBeVisible({ timeout: 10_000 });
    // CTA back to signup
    await expect(page.getByRole('link', { name: 'Back to signup' })).toBeVisible();
  });

  test('reset-password page without token shows guard', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: 'Invalid reset link' })).toBeVisible();
  });

  test('reset-password page with token renders form', async ({ page }) => {
    await page.goto('/reset-password?token=does-not-matter-for-render');
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
    // Two password inputs
    await expect(page.locator('input[type="password"]')).toHaveCount(2);
  });
});
