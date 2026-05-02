import type {
  UserDto, UserCreate, UserUpdate,
  LoginRequest, LoginResponse, ResetPasswordRequest,
  SpecialistDto, SpecialistCreate, SpecialistUpdate, SpecialistSearchParams,
  OrderDto, OrderCreate, OrderUpdate, OrderRequestDto,
  CatalogDto, CatalogCreate, CatalogUpdate,
  AddressDto, AddressCreate,
  CommentDto, CommentCreate,
  MessageDto, MessageCreate,
  RateDto, RateCreate,
} from '@/types/api';
import { TOKEN_KEY, getAuthToken, handleUnauthorized } from '@/lib/auth-store';

export { TOKEN_KEY };
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

interface BackendErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
  detail?: unknown;
  message?: string;
}

export interface FieldErrors { [field: string]: string }

function asString(x: unknown): string | undefined {
  return typeof x === 'string' && x.length > 0 ? x : undefined;
}

function readErrorText(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const d = data as BackendErrorBody;

  if (d.error && typeof d.error === 'object') {
    const m = asString(d.error.message);
    const details = Array.isArray(d.error.details) ? d.error.details : null;
    if (m && details && details.length) {
      return `${m}: ${details.map((x) => String(x)).join('; ')}`;
    }
    if (m) return m;
    if (details && details.length) return details.map((x) => String(x)).join('; ');
  }

  if (typeof d.detail === 'string') return d.detail;
  if (Array.isArray(d.detail)) {
    return d.detail
      .map((i) => {
        if (typeof i === 'string') return i;
        const o = i as { msg?: string; loc?: Array<string | number> };
        const path = Array.isArray(o.loc)
          ? o.loc.filter((p) => p !== 'body').join('.')
          : '';
        const msg = asString(o.msg) ?? JSON.stringify(i);
        return path ? `${path}: ${msg}` : msg;
      })
      .join(', ');
  }
  if (typeof d.message === 'string') return d.message;
  return fallback;
}

export function readFieldErrors(err: unknown): FieldErrors | null {
  if (!(err instanceof ApiError) || err.status !== 422) return null;
  const raw = err.raw as BackendErrorBody | null;
  if (!raw || typeof raw !== 'object') return null;
  const out: FieldErrors = {};

  const newDetails = Array.isArray(raw.error?.details) ? raw.error!.details : null;
  if (newDetails) {
    for (const line of newDetails) {
      if (typeof line !== 'string') continue;
      const m = /^(.+?):\s*(.+)$/.exec(line);
      if (!m) continue;
      const path = m[1].split(/\s*→\s*|\s*->\s*|\./).filter((p) => p && p !== 'body');
      const field = path[path.length - 1]?.trim();
      if (field) out[field] = m[2].trim();
    }
  }

  if (Array.isArray(raw.detail)) {
    for (const item of raw.detail) {
      if (!item || typeof item !== 'object') continue;
      const o = item as { loc?: Array<string | number>; msg?: string };
      if (!Array.isArray(o.loc) || !o.msg) continue;
      const field = String(o.loc[o.loc.length - 1]);
      out[field] = o.msg;
    }
  }

  return Object.keys(out).length ? out : null;
}

export class ApiError extends Error {
  status: number;
  raw: unknown;
  constructor(message: string, status: number, raw: unknown) {
    super(message);
    this.status = status;
    this.raw = raw;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const t = token !== undefined ? token : getAuthToken();
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (t) headers.set('Authorization', `Bearer ${t}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection.', 0, null);
  }

  const ct = res.headers.get('content-type') || '';
  const data: unknown = ct.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (res.status === 401) {
    handleUnauthorized();
    throw new ApiError(
      readErrorText(data, 'Session expired. Please log in again.'),
      401,
      data,
    );
  }

  if (!res.ok) {
    throw new ApiError(readErrorText(data, `Request failed (${res.status})`), res.status, data);
  }
  return data as T;
}

function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : '';
}

export const auth = {
  register: (data: UserCreate) =>
    apiRequest<{ message: string; user_id: string }>('/api/v1/auth/register', {
      method: 'POST', body: JSON.stringify(data),
    }, null),
  confirmEmail: (token: string) =>
    apiRequest<{ message: string }>(
      `/api/v1/auth/confirm-email${qs({ token })}`, { method: 'GET' }, null),
  login: (data: LoginRequest) =>
    apiRequest<LoginResponse>('/api/v1/auth/login', {
      method: 'POST', body: JSON.stringify(data),
    }, null),
  logout: () => apiRequest<{ message: string }>('/api/v1/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>(
      `/api/v1/auth/forgot-password${qs({ email })}`, { method: 'POST' }, null),
  resetPassword: (token: string, body: ResetPasswordRequest) =>
    apiRequest<{ message: string }>(
      `/api/v1/auth/reset-password${qs({ token })}`, {
        method: 'POST', body: JSON.stringify(body),
      }, null),
};

export const users = {
  profile: () => apiRequest<UserDto>('/api/v1/users/profile'),
  update: (data: UserUpdate) =>
    apiRequest<UserDto>('/api/v1/users/update', {
      method: 'PUT', body: JSON.stringify(data),
    }),
  delete: () => apiRequest<{ message: string }>('/api/v1/users/delete', { method: 'DELETE' }),
};

export const specialists = {
  create: (data: SpecialistCreate) =>
    apiRequest<SpecialistDto>('/api/v1/specialists/create', {
      method: 'POST', body: JSON.stringify(data),
    }),
  me: () => apiRequest<SpecialistDto>('/api/v1/specialists/me'),
  get: (id: string) => apiRequest<SpecialistDto>(`/api/v1/specialists/get/${id}`),
  list: (limit = 100, offset = 0) =>
    apiRequest<SpecialistDto[]>(`/api/v1/specialists/list${qs({ limit, offset })}`),
  update: (data: SpecialistUpdate) =>
    apiRequest<SpecialistDto>('/api/v1/specialists/update', {
      method: 'PUT', body: JSON.stringify(data),
    }),
  deactivate: (id: string) =>
    apiRequest<SpecialistDto>(`/api/v1/specialists/deactivate/${id}`, { method: 'PATCH' }),
  activate: (id: string) =>
    apiRequest<SpecialistDto>(`/api/v1/specialists/activate/${id}`, { method: 'PATCH' }),
  delete: () =>
    apiRequest<{ message: string }>('/api/v1/specialists/delete', { method: 'DELETE' }),
  verify: (id: string) =>
    apiRequest<SpecialistDto>(`/api/v1/specialists/verify/${id}`, { method: 'PATCH' }),
  search: (p: SpecialistSearchParams) =>
    apiRequest<SpecialistDto[]>(`/api/v1/specialists/search${qs({
      lat: p.lat, lon: p.lon, k: p.k, job_type: p.job_type, max_price: p.max_price,
    })}`),
};

export const orders = {
  create: (data: OrderCreate) =>
    apiRequest<OrderDto>('/api/v1/orders/create', {
      method: 'POST', body: JSON.stringify(data),
    }),
  get: (id: string) => apiRequest<OrderDto>(`/api/v1/orders/get/${id}`),
  my: () => apiRequest<OrderDto[]>('/api/v1/orders/my'),
  active: () => apiRequest<OrderDto[]>('/api/v1/orders/active'),
  specialistMy: () => apiRequest<OrderDto[]>('/api/v1/orders/specialist/my'),
  update: (id: string, data: OrderUpdate) =>
    apiRequest<OrderDto>(`/api/v1/orders/update/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),
  take: (id: string) =>
    apiRequest<OrderDto>(`/api/v1/orders/take/${id}`, { method: 'POST' }),
  complete: (id: string) =>
    apiRequest<OrderDto>(`/api/v1/orders/complete/${id}`, { method: 'POST' }),
  cancel: (id: string) =>
    apiRequest<OrderDto>(`/api/v1/orders/cancel/${id}`, { method: 'POST' }),
  delete: (id: string) =>
    apiRequest<{ message: string }>(`/api/v1/orders/delete/${id}`, { method: 'DELETE' }),
};

export const requests = {
  all: () => apiRequest<OrderRequestDto[]>('/api/v1/requests/get/all'),
  approve: (id: string) =>
    apiRequest<OrderRequestDto>(`/api/v1/requests/approve/${id}`, { method: 'PUT' }),
};

export const catalog = {
  add: (data: CatalogCreate) =>
    apiRequest<CatalogDto>('/api/v1/catalog/add/item', {
      method: 'POST', body: JSON.stringify(data),
    }),
  get: (specialistId: string) =>
    apiRequest<CatalogDto[]>(`/api/v1/catalog/get/catalog/${specialistId}`),
  update: (catalogId: string, data: CatalogUpdate) =>
    apiRequest<CatalogDto>(`/api/v1/catalog/update/${catalogId}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),
  delete: (catalogId: string) =>
    apiRequest<{ message: string }>(`/api/v1/catalog/delete/${catalogId}`, { method: 'DELETE' }),
};

export const address = {
  add: (data: AddressCreate) =>
    apiRequest<AddressDto>('/api/v1/address/add/address', {
      method: 'POST', body: JSON.stringify(data),
    }),
  get: () => apiRequest<AddressDto>('/api/v1/address/get/address'),
  delete: () => apiRequest<{ message: string }>('/api/v1/address/delete/address', { method: 'DELETE' }),
};

export const comments = {
  write: (specialistId: string, data: CommentCreate) =>
    apiRequest<CommentDto>(`/api/v1/comment/write/${specialistId}`, {
      method: 'POST', body: JSON.stringify(data),
    }),
  list: (specialistId: string) =>
    apiRequest<CommentDto[]>(`/api/v1/comment/get/comments/${specialistId}`),
  delete: (specialistId: string) =>
    apiRequest<{ message: string }>(`/api/v1/comment/delete/${specialistId}`, { method: 'DELETE' }),
};

export const messages = {
  write: (orderId: string, data: MessageCreate) =>
    apiRequest<MessageDto>(`/api/v1/message/write${qs({ order_id: orderId })}`, {
      method: 'POST', body: JSON.stringify(data),
    }),
  chat: (orderId: string) =>
    apiRequest<MessageDto[]>(`/api/v1/message/get/chat/${orderId}`),
};

export const rates = {
  create: (specialistId: string, data: RateCreate) =>
    apiRequest<RateDto>(`/api/v1/rate/create/${specialistId}`, {
      method: 'POST', body: JSON.stringify(data),
    }),
  list: (specialistId: string) =>
    apiRequest<RateDto[]>(`/api/v1/rate/get/rate/${specialistId}`),
  delete: (specialistId: string) =>
    apiRequest<{ message: string }>(`/api/v1/rate/delete/${specialistId}`, { method: 'DELETE' }),
};

export const files = {
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiRequest<{ message: string; url?: string }>('/api/v1/files/upload/avatar', {
      method: 'POST', body: fd,
    });
  },
  avatarUrl: (userId: string) => `${API_BASE}/api/v1/files/get/avatar/${userId}`,
  deleteAvatar: (userId: string) =>
    apiRequest<{ message: string }>(`/api/v1/files/delete/avatar/${userId}`, { method: 'DELETE' }),
  uploadAccreditation: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiRequest<{ message: string }>('/api/v1/files/upload/accreditation', {
      method: 'POST', body: fd,
    });
  },
  getAccreditation: () =>
    apiRequest<unknown>('/api/v1/files/get/accreditation'),
  deleteAccreditation: () =>
    apiRequest<{ message: string }>('/api/v1/files/delete/accreditation', { method: 'DELETE' }),
};

export const admin = {
  profiling: () => apiRequest<unknown>('/api/v1/admin/profiling'),
};
