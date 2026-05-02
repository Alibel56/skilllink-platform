import { test, expect } from '@playwright/test';
import { loadFixtures, injectToken, waitForQueriesIdle } from '../helpers/ui.js';
import { apiCreateOrder, clearRateLimits } from '../helpers/api.js';

test.describe('Orders flow', () => {
  test('client can create an order via UI', async ({ page }) => {
    const { client } = loadFixtures();
    clearRateLimits();
    await injectToken(page, client.token!);

    await page.goto('/orders/new');
    await expect(page.getByRole('heading', { name: 'Post a new order' })).toBeVisible();

    // Pick service via combobox (the only one before the budget input)
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Painting' }).click();

    await page.getByPlaceholder('5000').fill('6000');
    await page.getByPlaceholder('Describe the work you need…').fill('Repaint the hallway');
    await page.getByRole('button', { name: 'Post order' }).click();

    // Should redirect to order detail
    await page.waitForURL(/\/orders\/[0-9a-f-]+$/);
    await expect(page.getByRole('heading', { name: 'Painting' })).toBeVisible();
    await expect(page.getByText('Repaint the hallway')).toBeVisible();
    await expect(page.getByText('6,000 ₸')).toBeVisible();
  });

  test('orders list shows recently created orders', async ({ page }) => {
    const { client } = loadFixtures();
    clearRateLimits();
    await apiCreateOrder(client.token!, 'electrician', 4000, 'Test fixture order');
    await injectToken(page, client.token!);

    await page.goto('/orders');
    await waitForQueriesIdle(page);
    await expect(page.getByRole('heading', { name: 'My orders' })).toBeVisible();
    await expect(page.getByText('Electrician').first()).toBeVisible();
    await expect(page.getByText('Test fixture order').first()).toBeVisible();
  });

  test('client can chat in their order and message appears', async ({ page }) => {
    const { client } = loadFixtures();
    clearRateLimits();
    const orderId = await apiCreateOrder(client.token!, 'cleaning', 3000, 'Chat test order');
    await injectToken(page, client.token!);

    await page.goto(`/orders/${orderId}`);
    await waitForQueriesIdle(page);
    await page.getByPlaceholder('Type a message…').fill('hello specialist');
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-send') }).first().click()
      .catch(async () => {
        // Fallback: any submit button inside the chat form
        const form = page.locator('form').last();
        await form.getByRole('button').last().click();
      });
    await expect(page.getByText('hello specialist')).toBeVisible({ timeout: 8000 });
  });

  test('owner can cancel their open order', async ({ page }) => {
    const { client } = loadFixtures();
    clearRateLimits();
    const orderId = await apiCreateOrder(client.token!, 'plumbing', 3500, 'Cancel test');
    await injectToken(page, client.token!);

    await page.goto(`/orders/${orderId}`);
    await waitForQueriesIdle(page);

    await page.getByRole('button', { name: /^Cancel order$/ }).click();
    await expect(page.getByText(/Cancelled/i).first()).toBeVisible();
  });

  test('owner can delete their order via confirm dialog', async ({ page }) => {
    const { client } = loadFixtures();
    clearRateLimits();
    const orderId = await apiCreateOrder(client.token!, 'plumbing', 3500, 'Delete test');
    await injectToken(page, client.token!);

    await page.goto(`/orders/${orderId}`);
    await waitForQueriesIdle(page);

    await page.getByRole('button', { name: /^Delete order$/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /Delete this order/ })).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete' }).click();

    // Redirect to orders list after delete
    await page.waitForURL((u) => u.pathname === '/orders');
  });
});
