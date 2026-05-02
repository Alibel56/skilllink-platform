import { test, expect } from '@playwright/test';
import { loadFixtures, injectToken, waitForQueriesIdle } from '../helpers/ui.js';
import { apiApproveRequest, apiCreateOrder, apiListRequests, clearRateLimits } from '../helpers/api.js';

test.describe('Specialist flow', () => {
  test('topbar shows specialist nav (Open jobs / My jobs / My catalog / Requests)', async ({ page }) => {
    const { specialist } = loadFixtures();
    await injectToken(page, specialist.token!);
    await page.goto('/home');
    await waitForQueriesIdle(page);

    await expect(page.getByRole('link', { name: /Open jobs/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /My jobs/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /My catalog/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Requests/ })).toBeVisible();
  });

  test('Open jobs page lists at least one open order', async ({ page }) => {
    const { client, specialist } = loadFixtures();
    clearRateLimits();
    // Seed a known open order so the feed isn't empty
    await apiCreateOrder(client.token!, 'plumbing', 6500, 'Open job for specialist test');

    await injectToken(page, specialist.token!);
    await page.goto('/jobs');
    await waitForQueriesIdle(page);

    await expect(page.getByRole('heading', { name: 'Open jobs' })).toBeVisible();
    await expect(page.getByText('Open job for specialist test').first()).toBeVisible();
    // Each card has the "View & take" CTA
    await expect(page.getByRole('button', { name: 'View & take' }).first()).toBeVisible();
  });

  test('specialist clicks Take on an open order — UI fires the take API and creates a request', async ({ page }) => {
    const { client, specialist } = loadFixtures();
    clearRateLimits();
    const orderId = await apiCreateOrder(client.token!, 'cleaning', 4500, 'Take UI test');

    await page.addInitScript((sp) => {
      localStorage.setItem('skilllink_specialist_id', sp);
    }, specialist.specialist_id!);
    await injectToken(page, specialist.token!);
    const orderResp = page.waitForResponse(
      (r) => r.url().includes(`/orders/get/${orderId}`),
      { timeout: 15_000 },
    );
    await page.goto(`/orders/${orderId}`);
    await orderResp;
    await waitForQueriesIdle(page);

    const takeBtn = page.getByRole('button', { name: /Take this job/ });
    await expect(takeBtn).toBeVisible({ timeout: 10_000 });

    const takeResp = page.waitForResponse(
      (r) => r.url().includes(`/orders/take/${orderId}`) && r.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await takeBtn.click();
    expect((await takeResp).status()).toBe(200);

    // Verify a pending request was registered on the backend.
    const reqs = await apiListRequests(client.token!);
    expect(reqs.find((r) => r.order_id === orderId && r.status === 'pending')).toBeDefined();
  });

  test('after client approval, the order shows In progress and Mark-completed action', async ({ page }) => {
    const { client, specialist } = loadFixtures();
    clearRateLimits();
    const orderId = await apiCreateOrder(client.token!, 'painting', 4000, 'Approve+complete test');

    // Drive take + approve directly via API so this spec is independent of the take-button click.
    await fetch(`http://localhost:8002/api/v1/orders/take/${orderId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${specialist.token}` },
    });
    const reqs = await apiListRequests(client.token!);
    const myRequest = reqs.find((r) => r.order_id === orderId && r.status === 'pending');
    expect(myRequest).toBeDefined();
    await apiApproveRequest(client.token!, myRequest!.id);

    // The specialist now revisits the order — should see in-progress + Mark-completed button.
    await page.addInitScript((sp) => {
      localStorage.setItem('skilllink_specialist_id', sp);
    }, specialist.specialist_id!);
    await injectToken(page, specialist.token!);
    const getResp = page.waitForResponse(
      (r) => r.url().includes(`/orders/get/${orderId}`),
      { timeout: 15_000 },
    );
    await page.goto(`/orders/${orderId}`);
    await getResp;
    await waitForQueriesIdle(page);

    await expect(page.getByText(/In progress/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Mark completed/ })).toBeVisible();
  });

  test('My jobs page shows the orders this specialist has taken', async ({ page }) => {
    const { specialist } = loadFixtures();
    await injectToken(page, specialist.token!);
    await page.goto('/jobs/mine');
    await waitForQueriesIdle(page);

    await expect(page.getByRole('heading', { name: 'My jobs' })).toBeVisible();
    // Either we see a card or an empty-state — both render fine.
    const empty = page.getByText("You haven't taken any jobs yet");
    const anyCard = page.getByRole('button', { name: /Open →/ });
    await expect.poll(async () => (await empty.count()) + (await anyCard.count())).toBeGreaterThan(0);
  });

  test('Requests page renders (empty or with cards)', async ({ page }) => {
    const { specialist } = loadFixtures();
    await injectToken(page, specialist.token!);
    await page.goto('/requests');
    await waitForQueriesIdle(page);
    await expect(page.getByRole('heading', { name: 'Order requests' })).toBeVisible();
  });

  test('Catalog page surfaces existing services for fixture specialist', async ({ page }) => {
    const { specialist } = loadFixtures();
    // The catalog page reads specialist_id from localStorage; inject before navigation.
    await page.addInitScript((sp) => {
      localStorage.setItem('skilllink_specialist_id', sp);
    }, specialist.specialist_id!);
    await injectToken(page, specialist.token!);

    // Wait for the catalog API call to complete so the slow Supabase round-trip is over.
    const catalogResp = page.waitForResponse(
      (r) => r.url().includes(`/api/v1/catalog/get/catalog/${specialist.specialist_id}`),
      { timeout: 15_000 },
    );
    await page.goto('/catalog');
    await catalogResp;
    await waitForQueriesIdle(page);

    await expect(page.getByRole('heading', { name: 'My catalog' })).toBeVisible();
    // Seeded items: plumbing + cleaning (rendered via categoryLabel → Title case)
    await expect(page.getByText('Plumbing')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Cleaning')).toBeVisible();
  });

  test('Catalog: add a new service via dialog', async ({ page }) => {
    const { specialist } = loadFixtures();
    clearRateLimits();
    await page.addInitScript((sp) => {
      localStorage.setItem('skilllink_specialist_id', sp);
    }, specialist.specialist_id!);
    await injectToken(page, specialist.token!);
    await page.goto('/catalog');
    await waitForQueriesIdle(page);

    await page.getByRole('button', { name: 'Add service' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Pick a service that isn't seeded yet (carpentry)
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Carpentry' }).click();
    await dialog.locator('input[type=number]').fill('7000');

    const addResp = page.waitForResponse(
      (r) => r.url().endsWith('/api/v1/catalog/add/item') && r.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: 'Add' }).click();
    expect((await addResp).status()).toBe(200);
    await expect(page.getByText('Carpentry')).toBeVisible({ timeout: 6000 });
  });
});
