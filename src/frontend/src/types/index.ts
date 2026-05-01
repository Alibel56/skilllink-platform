export type Role = 'client' | 'specialist' | 'admin';

export type Page =
  | 'welcome' | 'login' | 'signup' | 'home'
  | 'listing' | 'profile' | 'booking' | 'tracking'
  | 'confirmation' | 'feedback' | 'dashboard' | 'jobs'
  | 'bookings' | 'notifications' | 'userProfile'
  | 'contact' | 'createOffer' | 'myOffers';

// ─── Seed / UI-only types (статичные данные, не из API) ───────────────────────

export type Specialist = {
  id: number;
  name: string;
  category: string;
  title: string;
  rating: number;
  reviews: number;
  price: number;
  skills: string[];
  certifications: string[];
  verified: boolean;
  description: string;
  phone: string;
  email: string;
  portfolio: string[];
};

// ─── Backend API types ─────────────────────────────────────────────────────────
// Соответствуют Pydantic-схемам backend (src/backend/app/schemas/)

/** POST /api/v1/auth/register — UserCreate */
export type UserCreate = {
  name: string;       // имя
  surname: string;    // фамилия (обязательно)
  birth_date: string; // ISO date: "YYYY-MM-DD"
  phone: string;      // min 8 символов
  email: string;
  password: string;
};

/** GET /api/v1/users/profile, PUT /api/v1/users/update — UserDto */
export type UserDto = {
  id: string;         // UUID
  name: string;
  surname: string;
  birth_date: string;
  phone: string;
  email: string;
  role: Role;
  created_at: string;
};

/** PUT /api/v1/users/update — UserUpdate (все поля опциональны) */
export type UserUpdate = {
  name?: string;
  surname?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  password?: string;
};

/** POST /api/v1/auth/login — request body */
export type LoginRequest = {
  email: string;
  password: string;
};

/** POST /api/v1/auth/login — response */
export type LoginResponse = {
  access_token: string;
  token_type: string;
};

/** POST /api/v1/orders/create — OrderCreate */
export type OrderCreate = {
  specialist_id?: string; // UUID, опционально
  job_type: string;
  description?: string;
  price: number; // > 0
};

/** Статусы заказа (backend enum OrderStatus) */
export type OrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

/** GET /api/v1/orders/get/{order_id}, /orders/my, /orders/active — OrderDto */
export type OrderDto = {
  id: string;           // UUID
  user_id: string;      // UUID
  specialist_id?: string; // UUID
  job_type: string;
  description?: string;
  price: number;
  is_active: boolean;
  status: OrderStatus;
  created_at: string;
  completed_at?: string;
};

/** POST /api/v1/message/write — MessageCreate (body) */
export type MessageCreate = {
  message: string; // 1–2000 символов
};

/** GET /api/v1/message/get/chat/{order_id} — MessageDto */
export type MessageDto = {
  id: string;       // UUID
  order_id: string; // UUID
  sender_id: string;// UUID
  message: string;
  created_at: string;
};

/** POST /api/v1/catalog/add/item — CatalogCreate */
export type CatalogCreate = {
  job_type: string;
  price: number; // > 0
};

/** GET /api/v1/catalog/get/catalog/{specialist_id} — CatalogDto */
export type CatalogDto = {
  id: string;           // UUID
  specialist_id: string;// UUID
  job_type: string;
  price: number;
  created_at: string;
};

/** POST /api/v1/rate/create — RateCreate */
export type RateCreate = {
  rate: number;         // 1–5 (integer)
  specialist_id: string;// UUID
};

/** POST /api/v1/comment/write — CommentCreate */
export type CommentCreate = {
  comment: string;      // 1–1000 символов
  specialist_id: string;// UUID
};

/** GET /api/v1/comment/get/comments — CommentDto */
export type CommentDto = {
  id: string;
  user_id: string;
  specialist_id: string;
  comment: string;
  created_at: string;
};

// ─── Frontend-only session/UI types ───────────────────────────────────────────

/**
 * Локальный объект пользователя, хранимый в состоянии приложения.
 * Содержит поля из UserDto + дополнительные UI-поля.
 */
export type StoredUser = {
  name: string;
  surname: string;
  birth_date: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  // UI-поля, не передаются на backend
  country: string;
  city: string;
};

/**
 * Booking — локальная UI-обёртка над OrderDto для совместимости с текущим UI.
 * При интеграции с backend поля маппятся из OrderDto.
 */
export type Booking = {
  id: string;
  client: string;
  specialist: string;
  service: string;
  date: string;
  time: string;
  total: number;
  status: string;
  details: string;
};

/**
 * ChatMessage — локальная UI-обёртка над MessageDto.
 */
export type ChatMessage = {
  id: string;
  senderEmail: string;
  senderName: string;
  text: string;
  createdAt: string;
};

export type OrderChats = Record<string, ChatMessage[]>;

/**
 * ServiceOffer — локальная UI-обёртка над CatalogDto.
 * При интеграции с backend маппится из CatalogDto.
 */
export type ServiceOffer = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  specialistName: string;
  tags: string[];
};