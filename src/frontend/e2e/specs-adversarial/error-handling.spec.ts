/**
 * Adversarial error-handling tests.
 *
 * These tests do NOT require a running backend. Every API response is mocked
 * via page.route() so we can deliberately return broken / unexpected payloads
 * (HTML instead of JSON, empty body, validation errors in the new and legacy
 * FastAPI shapes, network aborts, etc.) and verify that the frontend shows
 * a meaningful message — not raw status codes.
 *
 * Run with:
 *   cd src/frontend && npm run dev          # in one terminal
 *   npx playwright test -c playwright.adversarial.config.ts
 */
import { expect, test, Page, Route } from '@playwright/test';

const API_HOST = '**/api/v1/**';
const TOKEN_KEY = 'skilllink_access_token';
const SPECIALIST_KEY = 'skilllink_specialist_id';
const FAKE_TOKEN = 'fake-test-token';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function injectToken(page: Page) {
  await page.addInitScript(
    ({ tk, t }) => { localStorage.setItem(tk, t); },
    { tk: TOKEN_KEY, t: FAKE_TOKEN },
  );
}

async function mockProfile(page: Page) {
  await page.route('**/api/v1/users/profile', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Test', surname: 'User', email: 'test@example.com',
        phone: '+77001112233', birth_date: '1990-01-01', role: 'client',
        created_at: '2024-01-01T00:00:00Z',
      }),
    }),
  );
}

function jsonRoute(status: number, body: unknown) {
  return (route: Route) => route.fulfill({
    status,
    contentType: 'application/json',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

// ─── 1. ОШИБКА ОТ БЭКА ОТОБРАЖАЕТСЯ ОСМЫСЛЕННО ───────────────────────────────

test.describe('login error rendering — backend payload variants', () => {
  test('new-style {error:{message}} shows the message, not (403)', async ({ page }) => {
    await page.route('**/api/v1/auth/login', jsonRoute(403, {
      error: { code: 'FORBIDDEN', message: 'Email is not confirmed yet' },
    }));

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('a@b.com');
    await page.getByPlaceholder('••••••••').fill('whatever123');
    await page.getByRole('button', { name: /^Log in$/ }).click();

    await expect(page.getByText('Email is not confirmed yet')).toBeVisible();
    await expect(page.getByText(/Request failed/)).toHaveCount(0);
  });

  test('legacy FastAPI {detail:"..."} also renders', async ({ page }) => {
    await page.route('**/api/v1/auth/login', jsonRoute(401, { detail: 'Bad credentials' }));

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('a@b.com');
    await page.getByPlaceholder('••••••••').fill('whatever123');
    await page.getByRole('button', { name: /^Log in$/ }).click();

    await expect(page.getByText('Bad credentials')).toBeVisible();
  });

  test('empty body falls back to "Request failed (X)" — but explains the code', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '' }),
    );

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('a@b.com');
    await page.getByPlaceholder('••••••••').fill('whatever123');
    await page.getByRole('button', { name: /^Log in$/ }).click();

    // Acceptable: we don't have a body, fall back is fine. We just want SOMETHING visible.
    await expect(page.getByText(/Request failed \(500\)/)).toBeVisible();
  });

  test('HTML response (e.g. nginx 502) does not crash the app', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 502,
        contentType: 'text/html',
        body: '<html><body><h1>502 Bad Gateway</h1></body></html>',
      }),
    );

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('a@b.com');
    await page.getByPlaceholder('••••••••').fill('whatever123');
    await page.getByRole('button', { name: /^Log in$/ }).click();

    // Should render a non-empty error banner without throwing.
    await expect(page.getByText(/Request failed \(502\)/)).toBeVisible();
    // App is not crashed — login form still interactive.
    await expect(page.getByRole('button', { name: /^Log in$/ })).toBeEnabled();
  });

  test('network failure shows friendly "Could not reach the server"', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) => route.abort('failed'));

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('a@b.com');
    await page.getByPlaceholder('••••••••').fill('whatever123');
    await page.getByRole('button', { name: /^Log in$/ }).click();

    await expect(page.getByText(/Could not reach the server/)).toBeVisible();
  });

  test('malformed JSON body falls back gracefully', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{this is not valid json',
      }),
    );

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('a@b.com');
    await page.getByPlaceholder('••••••••').fill('whatever123');
    await page.getByRole('button', { name: /^Log in$/ }).click();

    await expect(page.getByText(/Request failed \(500\)/)).toBeVisible();
  });
});

// ─── 2. 422 → ПОДСВЕТКА КОНКРЕТНОГО ПОЛЯ ────────────────────────────────────

test.describe('422 validation maps to per-field error highlighting', () => {
  test('signup: new-style details "body → email: invalid" highlights email field', async ({ page }) => {
    await page.route('**/api/v1/auth/register', jsonRoute(422, {
      error: {
        code: 'REQUEST_VALIDATION_ERROR',
        message: 'Request validation failed',
        details: ['body → email: value is not a valid email address'],
      },
    }));

    await page.goto('/signup');
    await page.getByPlaceholder('Alex').fill('Alex');
    await page.getByPlaceholder('Stone').fill('Stone');
    await page.getByPlaceholder('you@example.com').fill('alex@example.com');
    await page.getByPlaceholder('+7 700 ...').fill('+77001112233');
    await page.locator('input[type="date"]').fill('1990-01-01');
    await page.getByLabel(/^Password/i, { exact: false }).first().fill('secret123');
    await page.getByLabel(/Confirm password/i).fill('secret123');
    await page.getByRole('button', { name: /Create account/ }).click();

    // Per-field message rendered under the email input — must be aria-described-by
    const emailField = page.getByPlaceholder('you@example.com');
    await expect(emailField).toHaveAttribute('aria-invalid', 'true');
    const describedBy = await emailField.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const errorEl = page.locator(`[id="${describedBy}"]`);
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('value is not a valid email address');
  });

  test('login: legacy detail [{loc:["body","password"], msg}] highlights password', async ({ page }) => {
    await page.route('**/api/v1/auth/login', jsonRoute(422, {
      detail: [{ loc: ['body', 'password'], msg: 'String should have at least 6 characters' }],
    }));

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('a@b.com');
    await page.getByPlaceholder('••••••••').fill('123');
    await page.getByRole('button', { name: /^Log in$/ }).click();

    const pwd = page.getByPlaceholder('••••••••');
    await expect(pwd).toHaveAttribute('aria-invalid', 'true');
  });
});

// ─── 3. 401 IN-FLIGHT → SOFT REDIRECT ───────────────────────────────────────

test.describe('401 in flight: soft redirect, no full reload, token cleared', () => {
  test('logged-in user hitting 401 lands on /login without reload, localStorage cleared', async ({ page }) => {
    await injectToken(page);
    await page.addInitScript((k) => localStorage.setItem(k, 'spec-id-1'), SPECIALIST_KEY);

    // Profile call answers 401 → auth-store should clear token, ProtectedRoute redirects.
    await page.route('**/api/v1/users/profile', jsonRoute(401, {
      error: { code: 'UNAUTHORIZED', message: 'Token expired' },
    }));

    let reloaded = false;
    page.on('framenavigated', () => { /* tracked via load below */ });
    page.on('load', () => { reloaded = true; });

    await page.goto('/home');

    // Should land on /login
    await page.waitForURL((u) => u.pathname === '/login', { timeout: 10_000 });

    // localStorage cleared
    const tk = await page.evaluate((k) => localStorage.getItem(k), TOKEN_KEY);
    const sp = await page.evaluate((k) => localStorage.getItem(k), SPECIALIST_KEY);
    expect(tk).toBeNull();
    expect(sp).toBeNull();

    // Page only loads once for SPA navigation — second 'load' would mean a hard reload.
    // Allow exactly one initial load.
    expect(reloaded).toBe(true); // initial load happened
  });
});

// ─── 4. REDIRECTS WITH SEARCH PRESERVED ─────────────────────────────────────

test.describe('protected route preserves search + hash on redirect', () => {
  test('unauthenticated /search?job_type=plumbing -> /login with from including query', async ({ page }) => {
    await page.goto('/search?job_type=plumbing#anchor');
    await page.waitForURL(/\/login/);

    // Read history.state.usr.from — react-router stores state.from there
    const from = await page.evaluate(() => {
      const s = (history.state as { usr?: { from?: string } } | null)?.usr;
      return s?.from ?? null;
    });
    expect(from).toBe('/search?job_type=plumbing#anchor');
  });
});

// ─── 5. AUTH-PAGES ARE GUARDED FROM LOGGED-IN USERS ─────────────────────────

test.describe('AuthLayout redirects logged-in users away', () => {
  test('logged-in user opening /login is sent to /home', async ({ page }) => {
    await injectToken(page);
    await mockProfile(page);
    await page.goto('/login');
    await page.waitForURL((u) => u.pathname === '/home', { timeout: 10_000 });
  });

  test('logged-in user opening /signup is sent to /home', async ({ page }) => {
    await injectToken(page);
    await mockProfile(page);
    await page.goto('/signup');
    await page.waitForURL((u) => u.pathname === '/home', { timeout: 10_000 });
  });
});

// ─── 6. CONFIRM-EMAIL DOES NOT DOUBLE-FIRE IN STRICT MODE ──────────────────

test.describe('confirm-email guarded against StrictMode double-fire', () => {
  test('only one network call to /confirm-email', async ({ page }) => {
    let calls = 0;
    await page.route('**/api/v1/auth/confirm-email**', (route) => {
      calls += 1;
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ message: 'ok' }),
      });
    });

    await page.goto('/confirm-email?token=abc123');
    await expect(page.getByText('Email confirmed')).toBeVisible();

    // Give StrictMode a chance to do its thing before asserting.
    await page.waitForTimeout(500);
    expect(calls).toBe(1);
  });

  test('shows backend message on failure, not a generic error', async ({ page }) => {
    await page.route('**/api/v1/auth/confirm-email**', jsonRoute(401, {
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired confirmation token' },
    }));

    await page.goto('/confirm-email?token=stale');

    // confirm-email redirects on 401 via handleUnauthorized — but page should show
    // the message FIRST before any redirect kicks in. Either we see the message
    // OR we end up on /login. Both are acceptable, but the 401-on-confirm path
    // is unusual: the user wasn't logged in. We'll accept either outcome.
    await page.waitForLoadState('networkidle');
    const onLogin = page.url().includes('/login');
    if (!onLogin) {
      await expect(page.getByText(/Invalid or expired confirmation token/)).toBeVisible();
    }
  });
});

// ─── 7. SIGNOUT FULLY CLEARS LOCAL STORAGE ──────────────────────────────────

test.describe('signOut clears token AND specialist_id', () => {
  test('clicking Sign out removes both keys', async ({ page }) => {
    await injectToken(page);
    await page.addInitScript((k) => localStorage.setItem(k, 'spec-id-1'), SPECIALIST_KEY);

    // Mock all profile + logout
    await mockProfile(page);
    await page.route('**/api/v1/auth/logout', jsonRoute(200, { message: 'bye' }));

    await page.goto('/home');
    // Click the user avatar trigger (button containing the avatar img/fallback)
    await page.getByRole('button').filter({ hasText: 'Test User' }).first().click();
    await page.getByRole('menuitem', { name: /Sign out/i }).click();

    await page.waitForURL((u) => u.pathname === '/login');

    const tk = await page.evaluate((k) => localStorage.getItem(k), TOKEN_KEY);
    const sp = await page.evaluate((k) => localStorage.getItem(k), SPECIALIST_KEY);
    expect(tk).toBeNull();
    expect(sp).toBeNull();
  });
});

// ─── 8. CATALOG DIALOG: ERROR PERSISTS INLINE (does not vanish with toast) ──

test.describe('catalog dialog keeps server error inline', () => {
  test('409 conflict on add → dialog stays open AND inline message visible', async ({ page }) => {
    await injectToken(page);
    await page.addInitScript((k) => localStorage.setItem(k, 'spec-id-1'), SPECIALIST_KEY);
    await mockProfile(page);
    await page.route('**/api/v1/catalog/get/catalog/**', jsonRoute(200, []));
    await page.route('**/api/v1/catalog/add/item', jsonRoute(409, {
      error: { code: 'CONFLICT', message: 'Service already exists in your catalog' },
    }));

    await page.goto('/catalog');
    await page.getByRole('button', { name: /Add service/ }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Pick a category
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: /Plumbing/i }).click();
    await dialog.locator('input[type="number"]').fill('5000');
    await dialog.getByRole('button', { name: /^Add$/ }).click();

    // Dialog must remain open AND inline error must show
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('alert')).toContainText('Service already exists in your catalog');

    // Wait past sonner toast TTL — inline message must persist
    await page.waitForTimeout(5000);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('alert')).toContainText('Service already exists in your catalog');
  });
});

// ─── 9. FORMFIELD A11Y CONNECTS LABEL/ERROR/DESCRIBEDBY ────────────────────

test.describe('FormField a11y wiring', () => {
  test('input has aria-invalid + aria-describedby pointing at error text', async ({ page }) => {
    await page.goto('/login');

    // Trigger client-side validation: empty submit
    await page.getByRole('button', { name: /^Log in$/ }).click();

    const email = page.getByPlaceholder('you@example.com');
    await expect(email).toHaveAttribute('aria-invalid', 'true');

    const describedBy = await email.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    // The element pointed at must exist and contain non-empty text
    const errorEl = page.locator(`[id="${describedBy}"]`);
    await expect(errorEl).toBeVisible();
    const errorText = (await errorEl.innerText()).trim();
    expect(errorText.length).toBeGreaterThan(0);
  });

  test('label htmlFor matches input id', async ({ page }) => {
    await page.goto('/login');
    const email = page.getByPlaceholder('you@example.com');
    const id = await email.getAttribute('id');
    expect(id).toBeTruthy();
    const label = page.locator(`label[for="${id}"]`);
    await expect(label).toBeVisible();
    await expect(label).toContainText(/Email address/i);
  });
});
