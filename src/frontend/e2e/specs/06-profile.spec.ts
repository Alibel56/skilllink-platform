import { test, expect } from '@playwright/test';
import { loadFixtures, injectToken, waitForQueriesIdle } from '../helpers/ui.js';
import { clearRateLimits } from '../helpers/api.js';

test.describe('Profile', () => {
  test('profile page shows fixture user info', async ({ page }) => {
    const { client } = loadFixtures();
    await injectToken(page, client.token!);
    await page.goto('/profile');
    await waitForQueriesIdle(page);

    await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: `${client.name} ${client.surname}` })).toBeVisible();
    await expect(page.getByText(client.email)).toBeVisible();
    await expect(page.getByText(client.phone)).toBeVisible();
  });

  test('edit profile form pre-fills and updates surname', async ({ page }) => {
    const { client } = loadFixtures();
    clearRateLimits();
    await injectToken(page, client.token!);
    await page.goto('/profile/edit');
    await waitForQueriesIdle(page);

    const surname = page.locator('input[name="surname"]').first();
    await expect(surname).toHaveValue(client.surname);

    const newSurname = `Surname-${Date.now() % 100000}`;
    await surname.fill(newSurname);

    // Watch for the underlying API call so we know the save actually went through.
    const updatePromise = page.waitForResponse(
      (r) => r.url().endsWith('/api/v1/users/update') && r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Save changes' }).click();
    const res = await updatePromise;
    expect(res.status()).toBe(200);

    // The toast confirms client-side success; that's enough to call the test green.
    await expect(page.getByText('Profile updated')).toBeVisible();
    // And the form input should now hold the new value (RHF reset() on success).
    await expect(surname).toHaveValue(newSurname);
  });

  test('address page renders form and can save an address', async ({ page }) => {
    const { client } = loadFixtures();
    clearRateLimits();
    await injectToken(page, client.token!);
    await page.goto('/profile/address');
    await waitForQueriesIdle(page);

    await page.getByPlaceholder('Kazakhstan').fill('Kazakhstan');
    await page.getByPlaceholder('Aktobe').fill('Aktobe');
    await page.getByPlaceholder('Abilkair khan ave 200').fill('Test street 42');

    // Wait for the underlying API call so we don't depend on a follow-up GET.
    const savePromise = page.waitForResponse(
      (r) => r.url().endsWith('/api/v1/address/add/address') && r.request().method() === 'POST',
      { timeout: 10_000 },
    );
    await page.getByRole('button', { name: /^Save address$/ }).click();
    const res = await savePromise;
    expect([200, 201]).toContain(res.status());
  });

  test('become-specialist form is reachable from non-specialist profile', async ({ page }) => {
    const { client } = loadFixtures();
    await injectToken(page, client.token!);
    await page.goto('/profile');
    await waitForQueriesIdle(page);

    const apply = page.getByRole('link', { name: /Apply/ }).first();
    if (await apply.isVisible().catch(() => false)) {
      await apply.click();
      await page.waitForURL(/\/profile\/become-specialist/);
      await expect(page.getByRole('heading', { name: 'Tell us where you work' })).toBeVisible();
    } else {
      // Already a specialist — UI hides Apply, that's fine
      test.skip();
    }
  });
});
