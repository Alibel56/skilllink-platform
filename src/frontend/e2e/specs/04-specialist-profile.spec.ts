import { test, expect } from '@playwright/test';
import { loadFixtures, injectToken, waitForQueriesIdle } from '../helpers/ui.js';

test.describe('Specialist profile', () => {
  test('shows hero, badges, and services', async ({ page }) => {
    const { client, specialist } = loadFixtures();
    if (!specialist.specialist_id) test.skip();
    await injectToken(page, client.token!);

    // Wait for the specialist GET to complete so the heading renders before we assert.
    const specResp = page.waitForResponse(
      (r) => r.url().includes(`/api/v1/specialists/get/${specialist.specialist_id}`),
      { timeout: 15_000 },
    );
    await page.goto(`/specialists/${specialist.specialist_id}`);
    await specResp;
    await waitForQueriesIdle(page);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Specialist');
    await expect(page.getByText('Verified').first()).toBeVisible();
    await expect(page.getByText('Available').first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Services/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Reviews/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Rate/ })).toBeVisible();
    // Two seeded services
    await expect(page.getByText('plumbing')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('cleaning')).toBeVisible();
  });

  test('Reviews tab renders form and Rate tab renders interactive stars', async ({ page }) => {
    const { client, specialist } = loadFixtures();
    if (!specialist.specialist_id) test.skip();
    await injectToken(page, client.token!);

    const specResp = page.waitForResponse(
      (r) => r.url().includes(`/api/v1/specialists/get/${specialist.specialist_id}`),
      { timeout: 15_000 },
    );
    await page.goto(`/specialists/${specialist.specialist_id}`);
    await specResp;
    await waitForQueriesIdle(page);

    await page.getByRole('tab', { name: /^Reviews/ }).click();
    await expect(page.getByPlaceholder('Share your experience…')).toBeVisible();

    await page.getByRole('tab', { name: /^Rate/ }).click();
    const ratePanel = page.getByRole('tabpanel').filter({ hasText: 'Rate this specialist' });
    const stars = ratePanel.getByRole('button', { name: /stars$/ });
    await expect(stars).toHaveCount(5);
  });

  test('Book button navigates to new-order page with prefilled query params', async ({ page }) => {
    const { client, specialist } = loadFixtures();
    if (!specialist.specialist_id) test.skip();
    await injectToken(page, client.token!);
    await page.goto(`/specialists/${specialist.specialist_id}`);
    await waitForQueriesIdle(page);

    await page.getByRole('button', { name: /^Book this specialist$/ }).click();
    await page.waitForURL(/\/orders\/new/);
    await expect(page).toHaveURL(new RegExp(`specialist_id=${specialist.specialist_id}`));
  });
});
