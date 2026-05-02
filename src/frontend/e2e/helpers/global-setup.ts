import {
  clearRateLimits, dbDeleteUsers, dbVerifyUser, dbVerifySpecialist,
  apiRegister, apiLogin, apiCreateSpecialist, apiAddCatalog,
  TestUser,
} from './api.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const FIXTURES_PATH = path.resolve(FIXTURES_DIR, 'users.json');

export const FIXTURE_CLIENT: TestUser = {
  email: 'e2e-client@skilllink.kz',
  password: 'pass1234',
  name: 'E2E', surname: 'Client',
  phone: '+77001112233', birth_date: '1990-05-15',
};

export const FIXTURE_SPECIALIST: TestUser = {
  email: 'e2e-pro@skilllink.kz',
  password: 'pass1234',
  name: 'E2E', surname: 'Pro',
  phone: '+77002223344', birth_date: '1988-03-20',
};

export const FIXTURE_ADMIN: TestUser = {
  email: 'e2e-admin@skilllink.kz',
  password: 'pass1234',
  name: 'E2E', surname: 'Admin',
  phone: '+77003334455', birth_date: '1985-07-10',
};

async function ensureUser(u: TestUser): Promise<TestUser> {
  // Try register; ignore if user already exists (will be reused via DB-verify + login)
  try {
    u.id = await apiRegister(u);
  } catch (e) {
    const m = (e as Error).message;
    if (!m.toLowerCase().includes('already')) {
      // Re-throw on unexpected errors
      throw e;
    }
  }
  dbVerifyUser(u.email);
  u.token = await apiLogin(u.email, u.password);
  return u;
}

async function ensureSpecialistFixture(): Promise<TestUser> {
  const u = await ensureUser({ ...FIXTURE_SPECIALIST });
  // Try to register them as a specialist
  try {
    u.specialist_id = await apiCreateSpecialist(u.token!, 50.28, 57.16);
  } catch (e) {
    const m = (e as Error).message;
    if (!m.toLowerCase().includes('already')) throw e;
  }
  if (u.specialist_id) {
    if (u.id) dbVerifySpecialist(u.id);
    // Add a couple of catalog items (idempotent — backend rejects duplicates)
    for (const [job, price] of [['plumbing', 5500], ['cleaning', 4200]] as const) {
      try { await apiAddCatalog(u.token!, job, price); } catch { /* dup ok */ }
    }
  }
  // The /specialists/create endpoint does NOT promote user role; do it directly so
  // the user can hit specialist-guarded endpoints (take/complete/requests/catalog CRUD).
  dbVerifyUser(u.email, 'specialist');
  // Reissue token because the role inside JWT might be picked up server-side from DB lookup.
  u.token = await apiLogin(u.email, u.password);
  return u;
}

async function ensureAdminFixture(): Promise<TestUser> {
  const u = { ...FIXTURE_ADMIN };
  try { u.id = await apiRegister(u); }
  catch (e) {
    const m = (e as Error).message;
    if (!m.toLowerCase().includes('already')) throw e;
  }
  dbVerifyUser(u.email, 'admin');
  u.token = await apiLogin(u.email, u.password);
  return u;
}

export default async function globalSetup() {
  console.log('[e2e] Clearing rate limits…');
  clearRateLimits();

  console.log('[e2e] Wiping previous test users…');
  dbDeleteUsers('e2e-%@skilllink.kz');

  console.log('[e2e] Creating fixture client…');
  const client = await ensureUser({ ...FIXTURE_CLIENT });

  console.log('[e2e] Creating fixture specialist + catalog…');
  const specialist = await ensureSpecialistFixture();

  console.log('[e2e] Creating fixture admin…');
  const admin = await ensureAdminFixture();

  mkdirSync(FIXTURES_DIR, { recursive: true });
  writeFileSync(
    FIXTURES_PATH,
    JSON.stringify({ client, specialist, admin }, null, 2),
  );

  console.log('[e2e] Setup complete:');
  console.log(`  client     = ${client.email} (id=${client.id})`);
  console.log(`  specialist = ${specialist.email} (id=${specialist.id}, sp=${specialist.specialist_id})`);
  console.log(`  admin      = ${admin.email} (id=${admin.id})`);
}
