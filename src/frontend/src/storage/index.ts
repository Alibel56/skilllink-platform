import type { Booking, OrderChats, UserCreate, LoginRequest, LoginResponse, UserDto, UserUpdate, OrderCreate, OrderDto, MessageCreate, MessageDto } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Конфигурация
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = '/api/v1';

// ─────────────────────────────────────────────────────────────────────────────
// Токен (JWT)
// ─────────────────────────────────────────────────────────────────────────────

export const getToken = (): string | null =>
  localStorage.getItem('access_token');

export const setToken = (token: string): void =>
  localStorage.setItem('access_token', token);

export const removeToken = (): void =>
  localStorage.removeItem('access_token');

const authHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth API  — POST /api/v1/auth/register | /auth/login | /auth/logout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Регистрация.
 * Backend: POST /api/v1/auth/register
 * Body (UserCreate): name, surname, birth_date, phone, email, password
 * Response: { message: string, user_id: string }
 */
export const apiRegister = async (data: UserCreate): Promise<{ message: string; user_id: string }> => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Registration failed: ${res.status}`);
  }
  return res.json();
};

/**
 * Логин.
 * Backend: POST /api/v1/auth/login
 * Body (LoginRequest): email, password
 * Response: { access_token, token_type }
 */
export const apiLogin = async (data: LoginRequest): Promise<LoginResponse> => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Invalid email or password');
  }
  return res.json();
};

/**
 * Выход.
 * Backend: POST /api/v1/auth/logout  (Bearer token required)
 */
export const apiLogout = async (): Promise<void> => {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: authHeaders(),
  });
};

/**
 * Сброс пароля (forgot-password).
 * Backend: POST /api/v1/auth/forgot-password?email=...
 */
export const apiForgotPassword = async (email: string): Promise<void> => {
  await fetch(`${BASE_URL}/auth/forgot-password?email=${encodeURIComponent(email)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// User API  — GET /api/v1/users/profile | PUT /api/v1/users/update
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Получить текущего пользователя.
 * Backend: GET /api/v1/users/profile  (Bearer token required)
 * Response: UserDto { id, name, surname, birth_date, phone, email, role, created_at }
 */
export const apiGetProfile = async (): Promise<UserDto> => {
  const res = await fetch(`${BASE_URL}/users/profile`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to get profile: ${res.status}`);
  return res.json();
};

/**
 * Обновить профиль пользователя.
 * Backend: PUT /api/v1/users/update  (Bearer token required)
 * Body (UserUpdate): name?, surname?, birth_date?, phone?, email?, password?
 * Response: UserDto
 */
export const apiUpdateProfile = async (data: UserUpdate): Promise<UserDto> => {
  const res = await fetch(`${BASE_URL}/users/update`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to update profile: ${res.status}`);
  }
  return res.json();
};

/**
 * Удалить аккаунт.
 * Backend: DELETE /api/v1/users/delete  (Bearer token required)
 */
export const apiDeleteUser = async (): Promise<void> => {
  await fetch(`${BASE_URL}/users/delete`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Orders API  — /api/v1/orders/...
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Создать заказ.
 * Backend: POST /api/v1/orders/create  (Bearer token required)
 * Body (OrderCreate): specialist_id?, job_type, description?, price
 * Response: OrderDto
 */
export const apiCreateOrder = async (data: OrderCreate): Promise<OrderDto> => {
  const res = await fetch(`${BASE_URL}/orders/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to create order: ${res.status}`);
  }
  return res.json();
};

/**
 * Получить свои заказы (для клиента).
 * Backend: GET /api/v1/orders/my  (require_client)
 * Response: OrderDto[]
 */
export const apiGetMyOrders = async (): Promise<OrderDto[]> => {
  const res = await fetch(`${BASE_URL}/orders/my`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to get orders: ${res.status}`);
  return res.json();
};

/**
 * Отменить заказ.
 * Backend: POST /api/v1/orders/cancel/{order_id}  (require_client)
 * Response: { message: string }
 */
export const apiCancelOrder = async (orderId: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/orders/cancel/${orderId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to cancel order: ${res.status}`);
  }
};

/**
 * Завершить заказ (клиент подтверждает выполнение).
 * Backend: POST /api/v1/orders/complete/{order_id}  (require_client)
 */
export const apiCompleteOrder = async (orderId: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/orders/complete/${orderId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to complete order: ${res.status}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Messages API  — /api/v1/message/...
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Отправить сообщение.
 * Backend: POST /api/v1/message/write?order_id={uuid}  (Bearer token required)
 * Body (MessageCreate): { message: string }
 * Response: MessageDto
 *
 * ВАЖНО: order_id передаётся как query-параметр, НЕ в теле запроса.
 */
export const apiSendMessage = async (orderId: string, message: string): Promise<MessageDto> => {
  const res = await fetch(`${BASE_URL}/message/write?order_id=${orderId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message } satisfies MessageCreate),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to send message: ${res.status}`);
  }
  return res.json();
};

/**
 * Получить чат по заказу.
 * Backend: GET /api/v1/message/get/chat/{order_id}  (Bearer token required)
 * Response: MessageDto[]
 */
export const apiGetChat = async (orderId: string): Promise<MessageDto[]> => {
  const res = await fetch(`${BASE_URL}/message/get/chat/${orderId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to get chat: ${res.status}`);
  return res.json();
};

// ─────────────────────────────────────────────────────────────────────────────
// Rate API  — /api/v1/rate/...
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Оставить оценку специалисту.
 * Backend: POST /api/v1/rate/create  (require_client)
 * Body (RateCreate): { rate: number (1-5), specialist_id: UUID }
 */
export const apiRateSpecialist = async (specialistId: string, rate: number): Promise<void> => {
  const res = await fetch(`${BASE_URL}/rate/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ rate, specialist_id: specialistId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to rate specialist: ${res.status}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Comment API  — /api/v1/comment/...
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Написать комментарий специалисту.
 * Backend: POST /api/v1/comment/write  (require_client)
 * Body (CommentCreate): { comment: string, specialist_id: UUID }
 */
export const apiWriteComment = async (specialistId: string, comment: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/comment/write`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ comment, specialist_id: specialistId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to submit comment: ${res.status}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Specialists API  — /api/v1/specialists/...
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Поиск специалистов рядом.
 * Backend: GET /api/v1/specialists/search?lat=&lon=&k=&job_type=&max_price=  (require_client)
 */
export const apiSearchSpecialists = async (params: {
  lat: number;
  lon: number;
  k?: number;
  job_type?: string;
  max_price?: number;
}): Promise<unknown[]> => {
  const query = new URLSearchParams();
  query.set('lat', String(params.lat));
  query.set('lon', String(params.lon));
  if (params.k !== undefined) query.set('k', String(params.k));
  if (params.job_type) query.set('job_type', params.job_type);
  if (params.max_price !== undefined) query.set('max_price', String(params.max_price));

  const res = await fetch(`${BASE_URL}/specialists/search?${query}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to search specialists: ${res.status}`);
  return res.json();
};

// ─────────────────────────────────────────────────────────────────────────────
// Совместимость — localStorage helpers (UI-state, НЕ авторизация)
// Используются только для локального кеша bookings/chats пока нет WebSocket.
// ─────────────────────────────────────────────────────────────────────────────

export const getBookings = (): Booking[] =>
  JSON.parse(localStorage.getItem('bookings') || '[]');

export const saveBookings = (bookings: Booking[]) =>
  localStorage.setItem('bookings', JSON.stringify(bookings));

export const getOrderChats = (): OrderChats =>
  JSON.parse(localStorage.getItem('orderChats') || '{}');

export const saveOrderChats = (chats: OrderChats) =>
  localStorage.setItem('orderChats', JSON.stringify(chats));

// ─────────────────────────────────────────────────────────────────────────────
// Устаревшие функции — оставлены для совместимости с существующим UI-кодом.
// При полном переходе на backend заменить на API-вызовы выше.
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Используйте apiLogin() + apiGetProfile() */
export const getUsers = (): import('../types').StoredUser[] =>
  JSON.parse(localStorage.getItem('users') || '[]');

/** @deprecated Используйте apiRegister() */
export const saveUsers = (users: import('../types').StoredUser[]) =>
  localStorage.setItem('users', JSON.stringify(users));

/** @deprecated Используйте apiRegister() */
export const registerUser = (newUser: import('../types').StoredUser) => {
  const users = getUsers();
  if (users.some(u => u.email === newUser.email)) throw new Error('User already exists');
  users.push(newUser);
  saveUsers(users);
};