// Generated from /api/v1 OpenAPI schema
export type UUID = string;
export type ISODateTime = string;
export type ISODate = string;

export type UserRole = 'client' | 'specialist' | 'admin';
export type OrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface UserDto {
  id: UUID;
  name: string;
  surname: string;
  birth_date: ISODate;
  phone: string;
  email: string;
  role: UserRole;
  created_at: ISODateTime;
}

export interface UserCreate {
  name: string;
  surname: string;
  birth_date: ISODate;
  phone: string;
  email: string;
  password: string;
}

export interface UserUpdate {
  name?: string;
  surname?: string;
  birth_date?: ISODate;
  phone?: string;
  email?: string;
}

export interface LoginRequest { email: string; password: string }
export interface LoginResponse { access_token: string; token_type: string }
export interface ResetPasswordRequest { new_password: string; confirm_password: string }

export interface SpecialistDto {
  id: UUID;
  user_id: UUID;
  h3_index: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: ISODateTime;
  name?: string | null;
  surname?: string | null;
}
export interface SpecialistCreate { lat: number; lon: number }
export interface SpecialistUpdate {
  lat?: number;
  lon?: number;
  is_active?: boolean;
}
export interface SpecialistSearchParams {
  lat: number;
  lon: number;
  k?: number;
  job_type?: string;
  max_price?: number;
}

export interface OrderDto {
  id: UUID;
  user_id: UUID;
  specialist_id: UUID | null;
  job_type: string;
  description: string | null;
  price: number;
  is_active: boolean;
  status: OrderStatus;
  created_at: ISODateTime;
  completed_at: ISODateTime | null;
}
export interface OrderCreate {
  specialist_id?: UUID | null;
  job_type: string;
  description?: string | null;
  price: number;
}
export interface OrderUpdate {
  job_type?: string;
  description?: string | null;
  price?: number;
  is_active?: boolean;
}

export interface OrderRequestDto {
  id: UUID;
  user_id: UUID;
  specialist_id: UUID;
  order_id: UUID;
  status: RequestStatus;
  created_at: ISODateTime;
}

export interface CatalogDto {
  id: UUID;
  specialist_id: UUID;
  job_type: string;
  price: number;
  created_at: ISODateTime;
}
export interface CatalogCreate { job_type: string; price: number }
export interface CatalogUpdate { job_type?: string; price?: number }

export interface AddressDto {
  id: UUID;
  user_id: UUID;
  country: string;
  city: string;
  street: string;
  h3_index: string;
  created_at: ISODateTime;
}
export interface AddressCreate {
  country: string;
  city: string;
  street: string;
  lat: number;
  lon: number;
}

export interface CommentDto {
  id: UUID;
  user_id: UUID;
  specialist_id: UUID;
  comment: string;
  created_at: ISODateTime;
}
export interface CommentCreate { comment: string }

export interface MessageDto {
  id: UUID;
  order_id: UUID;
  sender_id: UUID;
  message: string;
  created_at: ISODateTime;
}
export interface MessageCreate { message: string }

export interface RateDto {
  id: UUID;
  user_id: UUID;
  specialist_id: UUID;
  rate: number;
  created_at: ISODateTime;
}
export interface RateCreate { rate: number }

export interface ApiError {
  detail?: string | Array<{ msg: string }>;
  message?: string;
}
