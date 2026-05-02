import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFixtures, injectToken, waitForQueriesIdle } from '../helpers/ui.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE_PNG = path.resolve(__dirname, '../fixtures/avatar.png');
const FIXTURE_PDF = path.resolve(__dirname, '../fixtures/accreditation.pdf');

test.describe('File uploads', () => {
  test('client can upload an avatar from /profile', async ({ page }) => {
    const { client } = loadFixtures();
    await injectToken(page, client.token!);
    await page.goto('/profile');
    await waitForQueriesIdle(page);

    // The upload button toggles the hidden file input; Playwright can set files on it directly.
    const uploadResp = page.waitForResponse(
      (r) => r.url().endsWith('/api/v1/files/upload/avatar') && r.request().method() === 'POST',
    );
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PNG);
    const res = await uploadResp;
    expect([200, 201]).toContain(res.status());
  });

  test('specialist can upload an accreditation document', async ({ page }) => {
    const { specialist } = loadFixtures();
    await page.addInitScript((sp) => {
      localStorage.setItem('skilllink_specialist_id', sp);
    }, specialist.specialist_id!);
    await injectToken(page, specialist.token!);
    await page.goto('/profile/accreditation');
    await waitForQueriesIdle(page);

    // The page renders an "Upload document" or "Replace" button based on whether a doc exists.
    // Either way there's an <input type="file"> we can target.
    const uploadResp = page.waitForResponse(
      (r) => r.url().endsWith('/api/v1/files/upload/accreditation') && r.request().method() === 'POST',
    );
    // Backend requires PDF for accreditation
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PDF);
    const res = await uploadResp;
    expect([200, 201]).toContain(res.status());
  });
});
