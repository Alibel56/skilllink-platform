import { test, expect } from '@playwright/test';
import { loadFixtures, injectToken } from '../helpers/ui.js';

test.describe('Home', () => {
  test('hero, categories, how-it-works render for authed client', async ({ page }) => {
    const { client } = loadFixtures();
    await injectToken(page, client.token!);
    await page.goto('/home');

    await expect(page.getByText(/Welcome back,/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Find a specialist/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Plumbing/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Electrician/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Verified specialists' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Are you a specialist?' })).toBeVisible();
  });

  test('clicking a category navigates to filtered search', async ({ page }) => {
    const { client } = loadFixtures();
    await injectToken(page, client.token!);
    await page.goto('/home');

    await page.getByRole('link', { name: /Cleaning/ }).click();
    await expect(page).toHaveURL(/\/search\?job_type=cleaning/);
  });

  test('topbar shows user info and dropdown opens', async ({ page }) => {
    const { client } = loadFixtures();
    await injectToken(page, client.token!);
    await page.goto('/home');

    await expect(page.getByText('E2E Client')).toBeVisible();
    // Open the avatar dropdown by clicking on the trigger button
    await page.getByText('E2E Client').click();
    await expect(page.getByRole('menuitem', { name: /My profile/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Sign out/ })).toBeVisible();
  });

  test('unauthed visit redirects to /login', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });
});
