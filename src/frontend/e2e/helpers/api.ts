import { spawnSync } from 'node:child_process';
import path from 'node:path';

export const API_BASE = process.env.API_BASE ?? 'http://localhost:8002';
const PROJECT_ROOT = path.resolve(process.cwd(), '..', '..');

export interface TestUser {
  email: string;
  password: string;
  name: string;
  surname: string;
  phone: string;
  birth_date: string;
  id?: string;
  token?: string;
  specialist_id?: string;
}

interface JsonHeaders { [k: string]: string }

async function jsonFetch<T>(p: string, init: RequestInit = {}): Promise<T> {
  const headers: JsonHeaders = {
    'Content-Type': 'application/json',
    'Connection': 'close',
    ...((init.headers as JsonHeaders) ?? {}),
  };
  let lastErr: unknown;
  // The Supabase-backed API is slow (~3s/req); keep-alive sockets sometimes
  // get closed mid-handshake. Retry a couple of times on transient errors.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${p}`, { ...init, headers, keepalive: false });
      const text = await res.text();
      let body: unknown;
      try { body = text ? JSON.parse(text) : {}; } catch { body = text; }
      if (!res.ok) {
        throw new Error(`API ${init.method ?? 'GET'} ${p} -> ${res.status}: ${text}`);
      }
      return body as T;
    } catch (e) {
      lastErr = e;
      const msg = String((e as Error).message ?? e);
      const transient = msg.includes('fetch failed') || msg.includes('other side closed') || msg.includes('UND_ERR_SOCKET');
      if (!transient || attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

/** Run a docker compose subcommand from the project root. Inputs are not user-controlled. */
function dockerCompose(args: string[]): { stdout: string; stderr: string; status: number | null } {
  const r = spawnSync('docker', ['compose', ...args], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { stdout: r.stdout ?? '', stderr: r.stderr ?? '', status: r.status };
}

/** Clear all rate-limit keys in Redis (so test bursts don't get blocked). */
export function clearRateLimits(): void {
  const lua = `local keys = redis.call('keys', 'rl:*') for i=1,#keys do redis.call('del', keys[i]) end return #keys`;
  const r = dockerCompose([
    'exec', '-T', 'redis',
    'redis-cli', 'eval', lua, '0',
  ]);
  if (r.status !== 0) {
    console.warn('clearRateLimits failed:', r.stderr);
  }
}

function pythonOnApi(script: string): string {
  const r = dockerCompose(['exec', '-T', 'api', 'python3', '-c', script]);
  if (r.status !== 0) {
    throw new Error(`pythonOnApi failed: ${r.stderr || r.stdout}`);
  }
  return r.stdout;
}

/** Force-verify user in DB so login works without going through email. */
export function dbVerifyUser(email: string, role?: 'client' | 'specialist' | 'admin'): void {
  const safeEmail = email.replace(/'/g, "''");
  const setRole = role ? `, role='${role}'` : '';
  pythonOnApi(`
import os, psycopg2
conn = psycopg2.connect(os.environ['DATABASE_URL_SYNC'])
cur = conn.cursor()
cur.execute("UPDATE users SET is_verified=TRUE${setRole} WHERE email='${safeEmail}'")
conn.commit()
`);
}

/** Mark a specialist as verified so they can publish a catalog and be searchable. */
export function dbVerifySpecialist(userId: string): void {
  // userId is a UUID — but still escape just to be defensive
  const safe = userId.replace(/'/g, "''");
  pythonOnApi(`
import os, psycopg2
conn = psycopg2.connect(os.environ['DATABASE_URL_SYNC'])
cur = conn.cursor()
cur.execute("UPDATE specialist SET is_verified=TRUE WHERE user_id='${safe}'")
conn.commit()
`);
}

/** Delete users matching email pattern (cleanup between runs). Cascades through dependent tables. */
export function dbDeleteUsers(emailPattern: string): void {
  const safe = emailPattern.replace(/'/g, "''");
  pythonOnApi(`
import os, psycopg2
conn = psycopg2.connect(os.environ['DATABASE_URL_SYNC'])
cur = conn.cursor()
cur.execute("SELECT id FROM users WHERE email LIKE '${safe}'")
ids = tuple(r[0] for r in cur.fetchall())
if ids:
    # Order matters because of FKs.
    cur.execute("SELECT id FROM specialist WHERE user_id IN %s", (ids,))
    sp_ids = tuple(r[0] for r in cur.fetchall())
    if sp_ids:
        cur.execute("DELETE FROM accreditation WHERE specialist_id IN %s", (sp_ids,))
        cur.execute("DELETE FROM catalog WHERE specialist_id IN %s", (sp_ids,))
        cur.execute("DELETE FROM rate WHERE specialist_id IN %s", (sp_ids,))
        cur.execute("DELETE FROM comments WHERE specialist_id IN %s", (sp_ids,))
        cur.execute("DELETE FROM order_requests WHERE specialist_id IN %s", (sp_ids,))
        cur.execute("UPDATE orders SET specialist_id=NULL WHERE specialist_id IN %s", (sp_ids,))
        cur.execute("DELETE FROM specialist WHERE id IN %s", (sp_ids,))
    for table in ('audit_log', 'messages', 'order_requests', 'rate', 'comments', 'user_images', 'address'):
        cur.execute(f"DELETE FROM {table} WHERE user_id IN %s" if table != 'messages' else f"DELETE FROM messages WHERE sender_id IN %s", (ids,))
    cur.execute("DELETE FROM orders WHERE user_id IN %s", (ids,))
    cur.execute("DELETE FROM users WHERE id IN %s", (ids,))
conn.commit()
print('deleted', len(ids))
`);
}

export async function apiRegister(u: TestUser): Promise<string> {
  const r = await jsonFetch<{ user_id: string }>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: u.name, surname: u.surname, email: u.email, phone: u.phone,
      birth_date: u.birth_date, password: u.password,
    }),
  });
  return r.user_id;
}

export async function apiLogin(email: string, password: string): Promise<string> {
  const r = await jsonFetch<{ access_token: string }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return r.access_token;
}

export async function apiCreateSpecialist(token: string, lat = 50.28, lon = 57.16): Promise<string> {
  const r = await jsonFetch<{ id: string }>('/api/v1/specialists/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ lat, lon }),
  });
  return r.id;
}

export async function apiAddCatalog(token: string, jobType: string, price: number): Promise<void> {
  await jsonFetch('/api/v1/catalog/add/item', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ job_type: jobType, price }),
  });
}

export async function apiListRequests(token: string): Promise<Array<{ id: string; order_id: string; status: string }>> {
  return jsonFetch('/api/v1/requests/get/all', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiApproveRequest(token: string, requestId: string): Promise<void> {
  await jsonFetch(`/api/v1/requests/approve/${requestId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiCreateOrder(
  token: string,
  jobType: string,
  price: number,
  description?: string,
): Promise<string> {
  const r = await jsonFetch<{ id: string }>('/api/v1/orders/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ job_type: jobType, price, description }),
  });
  return r.id;
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}@skilllink.kz`;
}

export function uniquePhone(): string {
  return `+7700${Math.floor(1000000 + Math.random() * 8999999)}`;
}
