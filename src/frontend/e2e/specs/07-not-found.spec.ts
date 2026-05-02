import { test, expect } from '@playwright/test';
import { loadFixtures, injectToken } from '../helpers/ui.js';

test.describe('Routing edge cases', () => {
  test('unknown URL renders 404', async ({ page }) => {
    const { client } = loadFixtures();
    await injectToken(page, client.token!);
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to home' })).toBeVisible();
  });

  test('admin route redirects non-admin to home', async ({ page }) => {
    const { client } = loadFixtures();
    await injectToken(page, client.token!);
    await page.goto('/admin');
    // App should redirect non-admins. Either land on /home or the role-guard renders nothing.
    await page.waitForURL((u) => u.pathname !== '/admin' || u.pathname === '/home', { timeout: 5000 });
    expect(page.url()).not.toMatch(/\/admin$/);
  });

  test('root redirects to /home when authed', async ({ page }) => {
    const { client } = loadFixtures();
    await injectToken(page, client.token!);
    await page.goto('/');
    await expect(page).toHaveURL(/\/home/);
  });

  test('root redirects to /login when not authed', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});
