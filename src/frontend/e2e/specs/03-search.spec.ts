import { test, expect } from '@playwright/test';
import { loadFixtures, injectToken, waitForQueriesIdle } from '../helpers/ui.js';

test.describe('Search', () => {
  test('lists fixture specialist near default coordinates', async ({ page }) => {
    const { client, specialist } = loadFixtures();
    await injectToken(page, client.token!);
    await page.goto('/search');
    await waitForQueriesIdle(page);

    // The card title shows "Specialist <prefix>"
    const prefix = (specialist.specialist_id ?? '').slice(0, 6);
    if (!prefix) test.skip();
    await expect(page.getByText(`Specialist ${prefix}`)).toBeVisible();
    await expect(page.getByText('Available').first()).toBeVisible();
  });

  test('filtering by service updates the URL and result set', async ({ page }) => {
    const { client } = loadFixtures();
    await injectToken(page, client.token!);
    await page.goto('/search');
    await waitForQueriesIdle(page);

    // Open the Service combobox and pick "Plumbing"
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Plumbing' }).click();
    await expect(page).toHaveURL(/job_type=plumbing/);
  });

  test('result count select updates URL', async ({ page }) => {
    const { client } = loadFixtures();
    await injectToken(page, client.token!);
    await page.goto('/search');

    const comboboxes = page.getByRole('combobox');
    await comboboxes.last().click();
    await page.getByRole('option', { name: 'Top 20' }).click();
    await expect(page).toHaveURL(/k=20/);
  });

  test('empty result shows empty-state when no specialists nearby', async ({ page }) => {
    const { client } = loadFixtures();
    await injectToken(page, client.token!);
    // Search far from where the fixture pro is registered
    await page.goto('/search?lat=0&lon=0&k=5');
    await waitForQueriesIdle(page);

    await expect(page.getByText('No specialists found')).toBeVisible();
  });
});
