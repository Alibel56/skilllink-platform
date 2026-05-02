import { test, expect } from '@playwright/test';
import { loadFixtures, injectToken, waitForQueriesIdle } from '../helpers/ui.js';

test.describe('Admin', () => {
  test('admin can reach /admin and see Verify + Profiling tabs', async ({ page }) => {
    const { admin } = loadFixtures();
    test.skip(!admin, 'No admin fixture');
    await injectToken(page, admin!.token!);
    await page.goto('/admin');
    await waitForQueriesIdle(page);

    await expect(page.getByRole('heading', { name: 'Admin panel' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Verify specialists' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Performance profiling' })).toBeVisible();
  });

  test('admin can verify a specialist by ID via the form', async ({ page }) => {
    const { admin, specialist } = loadFixtures();
    test.skip(!admin, 'No admin fixture');
    await injectToken(page, admin!.token!);
    await page.goto('/admin');
    await waitForQueriesIdle(page);

    await page.getByPlaceholder('00000000-0000-…').fill(specialist.specialist_id!);

    const verifyResp = page.waitForResponse(
      (r) => r.url().includes(`/specialists/verify/${specialist.specialist_id}`) && r.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Verify specialist' }).click();
    expect((await verifyResp).status()).toBe(200);
  });

  test('admin sees profiling JSON in second tab', async ({ page }) => {
    const { admin } = loadFixtures();
    test.skip(!admin, 'No admin fixture');
    await injectToken(page, admin!.token!);
    await page.goto('/admin');
    await waitForQueriesIdle(page);

    await page.getByRole('tab', { name: 'Performance profiling' }).click();
    await expect(page.getByRole('heading', { name: 'Latency report' })).toBeVisible();
    // The <pre> block holds JSON — at minimum it shouldn't render the destructive error
    await expect(page.getByText(/forbidden|permission/i)).toHaveCount(0);
  });
});
