/// <reference types="vite/client" />
import { useMemo, useState, useEffect, type ReactNode } from 'react';
import type * as React from 'react';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, ArrowLeft, Bell, Calendar, CheckCircle2, Clock,
  DollarSign, Filter, Hammer, Mail, MapPin, Paintbrush, Phone,
  Search, ShieldCheck, Sparkles, Star, Wrench, Zap, Fan, Briefcase, X, Plus, Trash2,
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Role = 'client' | 'specialist' | 'admin';
type Page =
  | 'resetPassword' | 'welcome' | 'login' | 'signup' | 'home'
  | 'listing' | 'profile' | 'booking' | 'tracking' | 'confirmation'
  | 'feedback' | 'dashboard' | 'jobs' | 'bookings' | 'notifications'
  | 'emailPending' | 'userProfile' | 'contact' | 'createOffer'
  | 'myOffers' | 'adminPanel' | 'requests';

type ApiRole = 'client' | 'specialist' | 'admin' | string;

type ApiUser = {
  id: string;
  name: string;
  surname: string;
  birth_date: string;
  phone: string;
  email: string;
  role: ApiRole;
  created_at?: string;
};

type ApiLoginResponse = {
  access_token: string;
  token_type: string;
};

type ApiSpecialist = {
  id: string;
  user_id: string;
  h3_index: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
};

type ApiCatalog = {
  id: string;
  specialist_id: string;
  job_type: string;
  price: number;
  created_at: string;
};

type ApiOrder = {
  id: string;
  user_id: string;
  specialist_id?: string | null;
  job_type: string;
  description?: string | null;
  price: number;
  is_active: boolean;
  status: string;
  created_at: string;
  completed_at?: string | null;
};

type ApiMessage = {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type ApiRequest = {
  id: string;
  order_id: string;
  specialist_id: string;
  status: string;
  created_at: string;
};

type FrontendUser = {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  birth_date: string;
  role: Role;
};

type Booking = {
  id: string;
  client: string;
  specialist: string;
  service: string;
  date: string;
  time: string;
  total: number;
  status: string;
  details: string;
  userId: string;
  specialistId: string | null;
  rawStatus: string;
  createdAt: string;
};

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

type CatalogItem = {
  id: string;
  specialistId: string;
  jobType: string;
  price: number;
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'skilllink_access_token';
const DEFAULT_LAT = 50.2839;
const DEFAULT_LON = 57.166;

const categories = [
  { id: 'plumbing', label: 'Plumbing', icon: Wrench, description: 'Leak repairs and pipe installation' },
  { id: 'electrician', label: 'Electrician', icon: Zap, description: 'Safe wiring and lighting' },
  { id: 'cleaning', label: 'Cleaning', icon: Sparkles, description: 'Deep home cleaning' },
  { id: 'ac', label: 'AC Repair', icon: Fan, description: 'Cooling repair and maintenance' },
  { id: 'carpentry', label: 'Carpentry', icon: Hammer, description: 'Custom woodwork and furniture' },
  { id: 'painting', label: 'Painting', icon: Paintbrush, description: 'Interior finishes and color design' },
];

const pageTitles: Record<Page, string> = {
  resetPassword: 'Reset Password', welcome: 'Welcome', login: 'Login',
  signup: 'Sign Up', emailPending: 'Confirm Your Email', home: 'Home',
  listing: 'Specialists', profile: 'Specialist Profile', booking: 'Book Service',
  tracking: 'Order Tracking', confirmation: 'Booking Confirmed', feedback: 'Leave Review',
  dashboard: 'Dashboard', jobs: 'Jobs', bookings: 'My Bookings',
  notifications: 'Notifications', userProfile: 'My Profile', contact: 'Chat',
  createOffer: 'Create Offer', myOffers: 'My Catalog', adminPanel: 'Admin Panel',
  requests: 'Specialist Requests',
};

// ─── UTILS ───────────────────────────────────────────────────────────────────

function normalizeRole(role: ApiRole): Role {
  const v = String(role).toLowerCase();
  if (v.includes('specialist')) return 'specialist';
  if (v.includes('admin')) return 'admin';
  return 'client';
}

function categoryLabel(jobType: string) {
  return categories.find((c) => c.id === jobType)?.label ?? jobType;
}

function mapOrderStatus(status: string) {
  const v = String(status).toLowerCase();
  if (v.includes('cancel')) return 'Cancelled';
  if (v.includes('complete')) return 'Completed';
  if (v.includes('progress')) return 'In Progress';
  if (v.includes('open') || v.includes('pending')) return 'Pending';
  return status || 'Pending';
}

function apiErrorText(data: any, fallback: string) {
  if (!data) return fallback;
  let raw = '';
  if (typeof data.detail === 'string') raw = data.detail;
  else if (Array.isArray(data.detail)) raw = data.detail.map((i: any) => i.msg || i).join(', ');
  else if (typeof data.message === 'string') raw = data.message;
  else raw = fallback;
  const lower = raw.toLowerCase();
  if (lower.includes('already exists') || lower.includes('already registered') || lower.includes('unique')) return 'An account with this email already exists.';
  if (lower.includes('not verified') || lower.includes('email not confirmed')) return 'Please confirm your email before logging in.';
  if (lower.includes('invalid credentials') || lower.includes('incorrect password') || lower.includes('unauthorized')) return 'Incorrect email or password.';
  if (lower.includes('not found')) return 'Not found. Please check your input.';
  if (lower.includes('token') && lower.includes('expired')) return 'Your session has expired. Please log in again.';
  if (lower.includes('failed to fetch') || lower.includes('network')) return 'Could not connect to the server.';
  if (lower.includes('forbidden') || lower.includes('403')) return 'You do not have permission to perform this action.';
  return raw || fallback;
}

async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const t = token !== undefined ? token : localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (t) headers.set('Authorization', `Bearer ${t}`);
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => null);
  if (!res.ok) throw new Error(apiErrorText(data, `Request failed (${res.status})`));
  return data as T;
}

function orderToBooking(order: ApiOrder, userId: string): Booking {
  const created = order.created_at ? new Date(order.created_at) : new Date();
  return {
    id: order.id,
    client: order.user_id === userId ? 'Me' : `Client ${order.user_id.slice(0, 6)}`,
    specialist: order.specialist_id ? `Specialist ${order.specialist_id.slice(0, 6)}` : 'Not assigned',
    service: categoryLabel(order.job_type),
    date: created.toISOString().slice(0, 10),
    time: created.toTimeString().slice(0, 5),
    total: Number(order.price),
    status: mapOrderStatus(order.status),
    details: order.description || 'No description',
    userId: order.user_id,
    specialistId: order.specialist_id ?? null,
    rawStatus: order.status,
    createdAt: order.created_at,
  };
}

function getGPS(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve({ lat: DEFAULT_LAT, lon: DEFAULT_LON }); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => resolve({ lat: DEFAULT_LAT, lon: DEFAULT_LON }),
      { enableHighAccuracy: false, timeout: 3000 },
    );
  });
}

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

function Button({
  children, variant = 'primary', onClick, className = '', type = 'button', style, disabled,
}: {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void; className?: string; type?: 'button' | 'submit';
  style?: React.CSSProperties; disabled?: boolean;
}) {
  return (
    <button type={type} className={`btn btn-${variant} ${className}`.trim()} onClick={onClick} style={style} disabled={disabled}>
      {children}
    </button>
  );
}

function InputField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ''}`.trim()} />;
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`textarea ${props.className ?? ''}`.trim()} />;
}

function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'soft' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Avatar({ name, onClick }: { name: string; onClick?: () => void }) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="avatar" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {initials || '?'}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={16} className={i < Math.round(value) ? 'star active' : 'star'} />
      ))}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="section-header"><h2>{title}</h2>{action}</div>;
}

function IconBadge({ children }: { children: ReactNode }) {
  return <div className="icon-badge">{children}</div>;
}

function StepTracker({ status }: { status: string }) {
  if (status === 'Cancelled') {
    return <div className="soft-box" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>This order was cancelled.</div>;
  }
  const steps = ['Pending', 'Accepted', 'In Progress', 'Completed'];
  const idx = steps.indexOf(status);
  return (
    <div className="steps-grid">
      {steps.map((step, i) => {
        const done = i < idx || status === 'Completed';
        const active = i === idx;
        return (
          <div key={step} className="step-item">
            <div className={`step-circle ${done ? 'done' : active ? 'active' : ''}`}>
              {done ? <CheckCircle2 size={18} /> : i + 1}
            </div>
            <span>{step}</span>
          </div>
        );
      })}
    </div>
  );
}

function BottomNav({ role, active, onNavigate }: { role: Role; active: string; onNavigate: (t: string) => void }) {
  const items = role === 'client'
    ? ['home', 'bookings', 'notifications', 'profile']
    : ['dashboard', 'jobs', 'myOffers', 'profile'];
  return (
    <div className="bottom-nav-wrap">
      <div className="bottom-nav">
        {items.map((item) => (
          <button key={item} className={`bottom-nav-item ${active === item ? 'active' : ''}`} onClick={() => onNavigate(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  // ── Auth / User ──
  const [user, setUser] = useState<FrontendUser>({ id: '', name: '', surname: '', email: '', phone: '', birth_date: '', role: 'client' });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [page, setPage] = useState<Page>('welcome');
  const [role, setRole] = useState<Role>('client');
  const [isApiBusy, setIsApiBusy] = useState(false);
  const [apiNotice, setApiNotice] = useState('');

  // ── Signup ──
  const [signupName, setSignupName] = useState('');
  const [signupSurname, setSignupSurname] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupDob, setSignupDob] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupRole, setSignupRole] = useState<'client' | 'specialist'>('client');
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  // ── Login ──
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // ── Reset password ──
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ── Bookings / Orders ──
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('00:00');
  const [bookingJobType, setBookingJobType] = useState('');
  const [bookingDescription, setBookingDescription] = useState('');
  const [bookingPrice, setBookingPrice] = useState('');
  const [bookingSpecialistId, setBookingSpecialistId] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ── Chat ──
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // ── Specialists ──
  const [specialists, setSpecialists] = useState<ApiSpecialist[]>([]);
  const [specialistsLoading, setSpecialistsLoading] = useState(false);
  const [searchK, setSearchK] = useState('10');
  const [searchJobType, setSearchJobType] = useState('');
  const [searchMaxPrice, setSearchMaxPrice] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string | null>(null);
  const [specialistCatalogs, setSpecialistCatalogs] = useState<Record<string, ApiCatalog[]>>({});

  // ── My Specialist Profile ──
  const [mySpecialist, setMySpecialist] = useState<ApiSpecialist | null>(null);
  const [specialistLoading, setSpecialistLoading] = useState(false);
  const [specialistError, setSpecialistError] = useState('');
  const [isEditingSpecialist, setIsEditingSpecialist] = useState(false);
  const [editSpLat, setEditSpLat] = useState('');
  const [editSpLon, setEditSpLon] = useState('');
  const [editSpIsActive, setEditSpIsActive] = useState(true);
  const [editSpSuccess, setEditSpSuccess] = useState('');
  const [editSpError, setEditSpError] = useState('');
  const [showDeleteSpecialistConfirm, setShowDeleteSpecialistConfirm] = useState(false);
  const [deleteSpecialistLoading, setDeleteSpecialistLoading] = useState(false);

  // ── Catalog (My Offers) ──
  const [myCatalog, setMyCatalog] = useState<ApiCatalog[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [newCatalogJobType, setNewCatalogJobType] = useState('');
  const [newCatalogPrice, setNewCatalogPrice] = useState('');
  const [createCatalogLoading, setCreateCatalogLoading] = useState(false);
  const [createCatalogError, setCreateCatalogError] = useState('');

  // ── Requests ──
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // ── Review / Feedback ──
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSpecialistId, setReviewSpecialistId] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // ── Edit Profile ──
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSurname, setEditSurname] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editSuccess, setEditSuccess] = useState('');
  const [showEditNewPass, setShowEditNewPass] = useState(false);
  const [showEditConfirmPass, setShowEditConfirmPass] = useState(false);

  // ── Delete Account ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Logout ──
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ── Notifications (local) ──
  const [notifications, setNotifications] = useState<{ id: number; text: string }[]>([{ id: 1, text: 'Welcome to SkillLink!' }]);
  const [unreadCount, setUnreadCount] = useState(1);

  // ── Admin ──
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminSpecialists, setAdminSpecialists] = useState<ApiSpecialist[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminNotice, setAdminNotice] = useState('');
  const [adminSearchLat, setAdminSearchLat] = useState(String(DEFAULT_LAT));
  const [adminSearchLon, setAdminSearchLon] = useState(String(DEFAULT_LON));
  const [adminSearchK, setAdminSearchK] = useState('50');
  const ADMIN_PASSWORD = 'admin1234';

  // ─── COMPUTED ──────────────────────────────────────────────────────────────

  const selectedBooking = useMemo(() =>
    bookings.find((b) => b.id === selectedBookingId) ?? null,
    [bookings, selectedBookingId],
  );

  const selectedSpecialist = useMemo(() =>
    specialists.find((s) => s.id === selectedSpecialistId) ?? null,
    [specialists, selectedSpecialistId],
  );

  const selectedSpecialistCatalog = useMemo(() =>
    selectedSpecialistId ? (specialistCatalogs[selectedSpecialistId] ?? []) : [],
    [specialistCatalogs, selectedSpecialistId],
  );

  const myBookings = useMemo(() =>
    role === 'specialist'
      ? bookings.filter((b) => b.specialistId === mySpecialist?.id)
      : bookings.filter((b) => b.userId === user.id),
    [bookings, role, user.id, mySpecialist],
  );

  const activeJobs = useMemo(() =>
    bookings.filter((b) => b.status === 'Pending' && b.specialistId === null),
    [bookings],
  );

  const completedCount = myBookings.filter((b) => b.status === 'Completed').length;
  const totalEarnings = myBookings.filter((b) => b.status === 'Completed').reduce((s, b) => s + b.total, 0);

  const filteredSpecialists = useMemo(() => {
    return specialists.filter((s) => {
      if (searchJobType && searchJobType !== 'all') {
        const cat = specialistCatalogs[s.id] ?? [];
        if (!cat.some((c) => c.job_type === searchJobType)) return false;
      }
      return true;
    });
  }, [specialists, specialistCatalogs, searchJobType]);

  // ─── INITIALIZATION ────────────────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const path = window.location.pathname;

    if (token && path.includes('reset-password')) {
      setResetToken(token);
      setPage('resetPassword');
      return;
    }

    if (token && path.includes('confirm-email')) {
      void (async () => {
        try {
          await apiRequest<{ message: string }>(`/api/v1/auth/confirm-email?token=${encodeURIComponent(token)}`, { method: 'GET' }, null);
          setAuthNotice('Email confirmed successfully. You can now log in.');
        } catch (e) {
          setLoginError(true);
          setLoginErrorMsg(e instanceof Error ? e.message : 'Email confirmation failed.');
        } finally {
          setPage('login');
          window.history.replaceState({}, '', '/');
        }
      })();
      return;
    }

    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setAuthToken(savedToken);
      void hydrateSession(savedToken);
    }
  }, []);

  useEffect(() => {
    if (page === 'notifications') setUnreadCount(0);
  }, [page]);

  // ─── SESSION ───────────────────────────────────────────────────────────────

  const toFrontendUser = (api: ApiUser): FrontendUser => ({
    id: api.id,
    name: api.name ?? '',
    surname: api.surname ?? '',
    email: api.email,
    phone: api.phone,
    birth_date: api.birth_date,
    role: normalizeRole(api.role),
  });

  const hydrateSession = async (token: string) => {
    setIsApiBusy(true);
    try {
      const apiUser = await apiRequest<ApiUser>('/api/v1/users/profile', {}, token);
      const fu = toFrontendUser(apiUser);
      setUser(fu);
      setRole(fu.role);

      if (fu.role === 'specialist') {
        await loadMySpecialistProfile(token, fu.id);
        await loadSpecialistOrders(token);
        setPage('dashboard');
      } else {
        await loadNearbySpecialists(token);
        await loadClientOrders(token, fu.id);
        setPage('home');
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken('');
      setPage('login');
    } finally {
      setIsApiBusy(false);
    }
  };

  // ─── SPECIALISTS ───────────────────────────────────────────────────────────

  const loadNearbySpecialists = async (token: string) => {
    setSpecialistsLoading(true);
    try {
      const loc = await getGPS();
      const k = parseInt(searchK) || 10;
      let url = `/api/v1/specialists/search?lat=${loc.lat}&lon=${loc.lon}&k=${k}`;
      if (searchJobType && searchJobType !== 'all') url += `&job_type=${encodeURIComponent(searchJobType)}`;
      if (searchMaxPrice) url += `&max_price=${searchMaxPrice}`;
      const rows = await apiRequest<ApiSpecialist[]>(url, {}, token);
      setSpecialists(rows);
      // Load catalogs for display
      for (const sp of rows.slice(0, 6)) {
        try {
          const cat = await apiRequest<ApiCatalog[]>(`/api/v1/catalog/get/catalog/${sp.id}`, {}, token);
          setSpecialistCatalogs((prev) => ({ ...prev, [sp.id]: cat }));
        } catch { /* skip */ }
      }
    } catch { /* keep empty */ }
    finally { setSpecialistsLoading(false); }
  };

  const loadMySpecialistProfile = async (token: string, userId: string) => {
    setSpecialistLoading(true);
    try {
      const loc = await getGPS();
      const rows = await apiRequest<ApiSpecialist[]>(
        `/api/v1/specialists/search?lat=${loc.lat}&lon=${loc.lon}&k=50`, {}, token,
      );
      const mine = rows.find((s) => s.user_id === userId) ?? null;
      setMySpecialist(mine);
      if (mine) {
        const cat = await apiRequest<ApiCatalog[]>(`/api/v1/catalog/get/catalog/${mine.id}`, {}, token);
        setMyCatalog(cat);
      }
    } catch { /* skip */ }
    finally { setSpecialistLoading(false); }
  };

  const createSpecialist = async () => {
    setSpecialistLoading(true);
    setSpecialistError('');
    try {
      const loc = editSpLat && editSpLon
        ? { lat: parseFloat(editSpLat), lon: parseFloat(editSpLon) }
        : await getGPS();
      const created = await apiRequest<ApiSpecialist>('/api/v1/specialists/create', {
        method: 'POST', body: JSON.stringify({ lat: loc.lat, lon: loc.lon }),
      }, authToken);
      setMySpecialist(created);
    } catch (e) {
      setSpecialistError(e instanceof Error ? e.message : 'Failed to create specialist profile');
    } finally {
      setSpecialistLoading(false);
    }
  };

  const updateSpecialist = async () => {
    setEditSpError('');
    setEditSpSuccess('');
    try {
      const body: Record<string, unknown> = { is_active: editSpIsActive };
      if (editSpLat) body.lat = parseFloat(editSpLat);
      if (editSpLon) body.lon = parseFloat(editSpLon);
      const updated = await apiRequest<ApiSpecialist>('/api/v1/specialists/update', {
        method: 'PUT', body: JSON.stringify(body),
      }, authToken);
      setMySpecialist(updated);
      setEditSpSuccess('Profile updated!');
      setTimeout(() => { setIsEditingSpecialist(false); setEditSpSuccess(''); }, 1500);
    } catch (e) {
      setEditSpError(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const deleteSpecialist = async () => {
    setDeleteSpecialistLoading(true);
    try {
      await apiRequest<{ message: string }>('/api/v1/specialists/delete', { method: 'DELETE' }, authToken);
      setMySpecialist(null);
      setMyCatalog([]);
    } catch { /* ignore */ }
    finally {
      setDeleteSpecialistLoading(false);
      setShowDeleteSpecialistConfirm(false);
      setIsEditingSpecialist(false);
    }
  };

  // ─── CATALOG ───────────────────────────────────────────────────────────────

  const loadMyCatalog = async () => {
    if (!mySpecialist) return;
    setCatalogLoading(true);
    try {
      const cat = await apiRequest<ApiCatalog[]>(`/api/v1/catalog/get/catalog/${mySpecialist.id}`, {}, authToken);
      setMyCatalog(cat);
    } catch { /* skip */ }
    finally { setCatalogLoading(false); }
  };

  const createCatalogItem = async () => {
    if (!newCatalogJobType || !newCatalogPrice) {
      setCreateCatalogError('Please select a job type and enter a price');
      return;
    }
    setCreateCatalogLoading(true);
    setCreateCatalogError('');
    try {
      const created = await apiRequest<ApiCatalog>('/api/v1/catalog/add/item', {
        method: 'POST',
        body: JSON.stringify({ job_type: newCatalogJobType, price: parseFloat(newCatalogPrice) }),
      }, authToken);
      setMyCatalog((prev) => [...prev, created]);
      setNewCatalogJobType('');
      setNewCatalogPrice('');
    } catch (e) {
      setCreateCatalogError(e instanceof Error ? e.message : 'Failed to create catalog item');
    } finally {
      setCreateCatalogLoading(false);
    }
  };

  const deleteCatalogItem = async (catalogId: string) => {
    try {
      await apiRequest<{ message: string }>(`/api/v1/catalog/delete/${catalogId}`, { method: 'DELETE' }, authToken);
      setMyCatalog((prev) => prev.filter((c) => c.id !== catalogId));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const loadSpecialistCatalog = async (specialistId: string) => {
    if (specialistCatalogs[specialistId]) return;
    try {
      const cat = await apiRequest<ApiCatalog[]>(`/api/v1/catalog/get/catalog/${specialistId}`, {}, authToken);
      setSpecialistCatalogs((prev) => ({ ...prev, [specialistId]: cat }));
    } catch { /* skip */ }
  };

  // ─── ORDERS ────────────────────────────────────────────────────────────────

  const loadClientOrders = async (token: string, userId: string) => {
    setOrdersLoading(true);
    try {
      const orders = await apiRequest<ApiOrder[]>('/api/v1/orders/my', {}, token);
      setBookings(orders.map((o) => orderToBooking(o, userId)));
    } catch { setBookings([]); }
    finally { setOrdersLoading(false); }
  };

  const loadSpecialistOrders = async (token: string) => {
    setOrdersLoading(true);
    try {
      const [mine, active] = await Promise.allSettled([
        apiRequest<ApiOrder[]>('/api/v1/orders/specialist/my', {}, token),
        apiRequest<ApiOrder[]>('/api/v1/orders/active', {}, token),
      ]);
      const mineOrders = mine.status === 'fulfilled' ? mine.value : [];
      const activeOrders = active.status === 'fulfilled' ? active.value : [];
      const seen = new Set(mineOrders.map((o) => o.id));
      const all = [...mineOrders, ...activeOrders.filter((o) => !seen.has(o.id))];
      setBookings(all.map((o) => orderToBooking(o, '')));
    } catch { setBookings([]); }
    finally { setOrdersLoading(false); }
  };

  const createOrder = async () => {
    if (!bookingJobType) { alert('Please select a job type'); return; }
    const price = parseFloat(bookingPrice);
    if (!price || price <= 0) { alert('Please enter a valid price'); return; }

    setBookingLoading(true);
    try {
      const body: Record<string, unknown> = {
        job_type: bookingJobType,
        price,
        description: bookingDescription || undefined,
      };
      if (bookingSpecialistId) body.specialist_id = bookingSpecialistId;

      const created = await apiRequest<ApiOrder>('/api/v1/orders/create', {
        method: 'POST', body: JSON.stringify(body),
      }, authToken);

      const booking = orderToBooking(created, user.id);
      setBookings((prev) => [booking, ...prev]);
      setSelectedBookingId(booking.id);
      setBookingJobType('');
      setBookingDescription('');
      setBookingPrice('');
      setBookingSpecialistId(null);
      setNotifications((prev) => [{ id: Date.now(), text: `Order created: ${booking.service}` }, ...prev]);
      setUnreadCount((n) => n + 1);
      setPage('confirmation');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Order was not created');
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await apiRequest<{ message: string }>(`/api/v1/orders/cancel/${orderId}`, { method: 'POST' }, authToken);
      setBookings((prev) => prev.map((b) => b.id === orderId ? { ...b, status: 'Cancelled' } : b));
    } catch (e) { alert(e instanceof Error ? e.message : 'Could not cancel order'); }
  };

  const completeOrder = async (orderId: string) => {
    try {
      await apiRequest<{ message: string }>(`/api/v1/orders/complete/${orderId}`, { method: 'POST' }, authToken);
      setBookings((prev) => prev.map((b) => b.id === orderId ? { ...b, status: 'Completed' } : b));
    } catch (e) { alert(e instanceof Error ? e.message : 'Could not complete order'); }
  };

  const takeOrder = async (orderId: string) => {
    try {
      await apiRequest<{ message: string }>(`/api/v1/orders/take/${orderId}`, { method: 'POST' }, authToken);
      setBookings((prev) => prev.map((b) => b.id === orderId ? { ...b, status: 'Accepted' } : b));
      setApiNotice('Request sent! Waiting for client approval.');
    } catch (e) { alert(e instanceof Error ? e.message : 'Could not take order'); }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await apiRequest<{ message: string }>(`/api/v1/orders/delete/${orderId}`, { method: 'DELETE' }, authToken);
      setBookings((prev) => prev.filter((b) => b.id !== orderId));
    } catch (e) { alert(e instanceof Error ? e.message : 'Could not delete order'); }
  };

  // ─── REQUESTS ──────────────────────────────────────────────────────────────

  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const reqs = await apiRequest<ApiRequest[]>('/api/v1/requests/get/all', {}, authToken);
      setRequests(reqs);
    } catch { setRequests([]); }
    finally { setRequestsLoading(false); }
  };

  const approveRequest = async (requestId: string) => {
    try {
      await apiRequest<{ message: string }>(`/api/v1/requests/approve/${requestId}`, { method: 'PUT' }, authToken);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setBookings((prev) => prev.map((b) => {
        const req = requests.find((r) => r.id === requestId);
        if (req && b.id === req.order_id) return { ...b, status: 'In Progress' };
        return b;
      }));
      setApiNotice('Specialist request approved!');
    } catch (e) { alert(e instanceof Error ? e.message : 'Could not approve request'); }
  };

  // ─── CHAT ──────────────────────────────────────────────────────────────────

  const loadChat = async (orderId: string) => {
    setChatLoading(true);
    try {
      const msgs = await apiRequest<ApiMessage[]>(`/api/v1/message/get/chat/${orderId}`, {}, authToken);
      setChatMessages(msgs.map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_id === user.id ? (user.name || 'Me') : 'Other',
        text: m.message,
        createdAt: m.created_at,
      })));
    } catch { setChatMessages([]); }
    finally { setChatLoading(false); }
  };

  const sendMessage = async () => {
    if (!selectedBookingId || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    try {
      const created = await apiRequest<ApiMessage>('/api/v1/message/write', {
        method: 'POST',
        body: JSON.stringify({ message: text, order_id: selectedBookingId }),
      }, authToken);
      setChatMessages((prev) => [...prev, {
        id: created.id, senderId: created.sender_id,
        senderName: user.name || 'Me', text: created.message, createdAt: created.created_at,
      }]);
    } catch (e) {
      // Optimistic local fallback
      setChatMessages((prev) => [...prev, {
        id: `LOCAL-${Date.now()}`, senderId: user.id,
        senderName: user.name || 'Me', text, createdAt: new Date().toISOString(),
      }]);
    }
  };

  useEffect(() => {
    if (selectedBookingId && page === 'contact') {
      void loadChat(selectedBookingId);
    }
  }, [selectedBookingId, page]);

  // ─── REVIEW ────────────────────────────────────────────────────────────────

  const submitReview = async () => {
    if (!reviewSpecialistId) return;
    setReviewLoading(true);
    try {
      await Promise.all([
        apiRequest(`/api/v1/comment/write/${reviewSpecialistId}`, {
          method: 'POST', body: JSON.stringify({ comment: reviewComment, specialist_id: reviewSpecialistId }),
        }, authToken),
        apiRequest(`/api/v1/rate/create/${reviewSpecialistId}`, {
          method: 'POST', body: JSON.stringify({ rate: reviewRating, specialist_id: reviewSpecialistId }),
        }, authToken),
      ]);
      setReviewComment('');
      setReviewRating(5);
      setPage(role === 'client' ? 'bookings' : 'dashboard');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Review submission failed');
    } finally {
      setReviewLoading(false);
    }
  };

  // ─── AUTH ──────────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    setLoginError(false);
    setLoginErrorMsg('');
    if (!loginEmail || !loginPassword) { setLoginError(true); setLoginErrorMsg('Please fill in all fields'); return; }
    if (!loginEmail.includes('@')) { setLoginError(true); setLoginErrorMsg('Invalid email'); return; }
    setIsApiBusy(true);
    try {
      const res = await apiRequest<ApiLoginResponse>('/api/v1/auth/login', {
        method: 'POST', body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      }, null);
      localStorage.setItem(TOKEN_KEY, res.access_token);
      setAuthToken(res.access_token);
      await hydrateSession(res.access_token);
    } catch (e) {
      setLoginError(true);
      setLoginErrorMsg(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setIsApiBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = loginEmail.trim();
    setForgotError('');
    setForgotSent(false);
    if (!email || !email.includes('@')) { setForgotError('Enter a valid email address first'); return; }
    setForgotLoading(true);
    try {
      await apiRequest<{ message: string }>(`/api/v1/auth/forgot-password?email=${encodeURIComponent(email)}`, { method: 'POST' }, null);
      setForgotSent(true);
    } catch (e) {
      setForgotError(e instanceof Error ? e.message : 'Server error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSignup = async () => {
    const errors: Record<string, string> = {};
    if (!signupName.trim()) errors.name = 'First name is required';
    if (!signupSurname.trim()) errors.surname = 'Last name is required';
    if (!signupEmail.trim() || !signupEmail.includes('@')) errors.email = 'Valid email is required';
    if (!signupPhone.trim() || signupPhone.replace(/\D/g, '').length < 7) errors.phone = 'Valid phone is required';
    if (!signupDob) errors.dob = 'Date of birth is required';
    if (!signupPassword || signupPassword.length < 6) errors.password = 'Min 6 characters';
    else if (!/\d/.test(signupPassword)) errors.password = 'Must contain at least one number';
    if (signupPassword !== signupConfirm) errors.confirm = 'Passwords do not match';
    setSignupErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await apiRequest<{ message: string; user_id: string }>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: signupName.trim(), surname: signupSurname.trim(),
          email: signupEmail.trim(), phone: signupPhone.trim(),
          birth_date: signupDob, password: signupPassword,
          role: signupRole,
        }),
      }, null);

      if (signupRole === 'specialist') {
        localStorage.setItem(`skilllink_desired_role:${signupEmail.trim()}`, 'specialist');
      }
      setPage('emailPending');
    } catch (e) {
      setSignupErrors({ email: e instanceof Error ? e.message : 'Registration failed' });
    }
  };

  const handleLogout = async () => {
    try {
      if (authToken) await apiRequest<{ message: string }>('/api/v1/auth/logout', { method: 'POST' }, authToken);
    } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken('');
    setUser({ id: '', name: '', surname: '', email: '', phone: '', birth_date: '', role: 'client' });
    setBookings([]);
    setMySpecialist(null);
    setMyCatalog([]);
    setSpecialists([]);
    setPage('login');
  };

  // ─── EDIT PROFILE ──────────────────────────────────────────────────────────

  const openEditProfile = () => {
    setEditName(user.name);
    setEditSurname(user.surname);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditBirthDate(user.birth_date);
    setEditNewPassword('');
    setEditConfirmPassword('');
    setEditErrors({});
    setEditSuccess('');
    setIsEditingProfile(true);
  };

  const saveProfile = async () => {
    const errors: Record<string, string> = {};
    if (!editName.trim()) errors.name = 'First name is required';
    if (!editSurname.trim()) errors.surname = 'Last name is required';
    if (!editEmail.trim() || !editEmail.includes('@')) errors.email = 'Valid email is required';
    if (!editPhone.trim() || editPhone.replace(/\D/g, '').length < 7) errors.phone = 'Valid phone is required';
    if (editNewPassword) {
      if (editNewPassword.length < 6) errors.newPassword = 'Min 6 characters';
      else if (!/\d/.test(editNewPassword)) errors.newPassword = 'Must contain at least one number';
      if (editNewPassword !== editConfirmPassword) errors.confirmPassword = 'Passwords do not match';
    }
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const body: Record<string, unknown> = {
        name: editName.trim(), surname: editSurname.trim(),
        email: editEmail.trim(), phone: editPhone.trim(),
      };
      if (editBirthDate) body.birth_date = editBirthDate;
      if (editNewPassword) body.password = editNewPassword;

      const updated = await apiRequest<ApiUser>('/api/v1/users/update', { method: 'PUT', body: JSON.stringify(body) }, authToken);
      const fu = toFrontendUser(updated);
      setUser(fu);
      setRole(fu.role);
      setEditSuccess('Profile updated successfully!');
      setTimeout(() => { setIsEditingProfile(false); setEditSuccess(''); }, 1500);
    } catch (e) {
      setEditErrors({ email: e instanceof Error ? e.message : 'Update failed' });
    }
  };

  // ─── ADMIN ─────────────────────────────────────────────────────────────────

  const adminLoadSpecialists = async () => {
    setAdminLoading(true);
    setAdminNotice('');
    try {
      const lat = parseFloat(adminSearchLat) || DEFAULT_LAT;
      const lon = parseFloat(adminSearchLon) || DEFAULT_LON;
      const k = parseInt(adminSearchK) || 50;
      const rows = await apiRequest<ApiSpecialist[]>(`/api/v1/specialists/search?lat=${lat}&lon=${lon}&k=${k}`, {}, authToken);
      setAdminSpecialists(rows);
      if (rows.length === 0) setAdminNotice('No specialists found. Try broader coordinates.');
    } catch (e) {
      setAdminNotice(e instanceof Error ? e.message : 'Failed to load specialists');
    } finally {
      setAdminLoading(false);
    }
  };

  const adminVerify = async (id: string) => {
    try {
      await apiRequest<ApiSpecialist>(`/api/v1/specialists/verify/${id}`, { method: 'PATCH' }, authToken);
      setAdminSpecialists((prev) => prev.map((s) => s.id === id ? { ...s, is_verified: true } : s));
      setAdminNotice('✅ Specialist verified');
    } catch (e) { setAdminNotice(e instanceof Error ? e.message : 'Failed'); }
  };

  const adminDeactivate = async (id: string) => {
    try {
      await apiRequest<ApiSpecialist>(`/api/v1/specialists/deactivate/${id}`, { method: 'PATCH' }, authToken);
      setAdminSpecialists((prev) => prev.map((s) => s.id === id ? { ...s, is_active: false } : s));
      setAdminNotice('🔴 Specialist deactivated');
    } catch (e) { setAdminNotice(e instanceof Error ? e.message : 'Failed'); }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────

  const isAuthPage = ['welcome', 'login', 'signup', 'resetPassword', 'emailPending'].includes(page);

  const topBar = !isAuthPage && (
    <div className="topbar">
      <div className="container topbar-inner">
        <div className="topbar-left">
          {!['home', 'dashboard', 'bookings', 'notifications', 'jobs', 'userProfile'].includes(page) && (
            <Button variant="secondary" className="icon-btn" onClick={() => setPage(role === 'client' ? 'home' : 'dashboard')}>
              <ArrowLeft size={18} />
            </Button>
          )}
          <div>
            <h1>{pageTitles[page]}</h1>
            <p>SkillLink service marketplace</p>
          </div>
        </div>
        <div className="topbar-right">
          <button className="notif-btn" onClick={() => { setPage('notifications'); setUnreadCount(0); }}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-dot">{unreadCount}</span>}
          </button>
          <Avatar name={user.name || user.email || 'U'} onClick={() => setPage('userProfile')} />
        </div>
      </div>
    </div>
  );

  if (isApiBusy) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
          <p className="muted">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {topBar}
      <main className="container page-content">
        {apiNotice && !isAuthPage && (
          <div className="soft-blue-box" style={{ marginBottom: '16px' }}>
            {apiNotice}
            <button onClick={() => setApiNotice('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {/* ── WELCOME ── */}
        {page === 'welcome' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hero-layout">
            <div className="hero-left">
              <Badge tone="soft">Service Marketplace</Badge>
              <h1 className="hero-main-title">Find trusted specialists<br />for every job.</h1>
              <p className="hero-main-text">Book verified professionals for plumbing, electrical, cleaning and home repair services.</p>
              <div className="button-row hero-buttons">
                <Button onClick={() => setPage('login')}>Get Started</Button>
                <Button variant="secondary" onClick={() => setPage('signup')}>Join Now</Button>
              </div>
            </div>
            <div className="hero-right">
              <div className="hero-cards-grid">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <motion.div key={cat.id} className="floating-card-grid" whileHover={{ y: -4 }} transition={{ duration: 0.2 }} onClick={() => setPage('login')} style={{ cursor: 'pointer' }}>
                      <IconBadge><Icon size={20} /></IconBadge>
                      <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '15px' }}>{cat.label}</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{cat.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── LOGIN ── */}
        {page === 'login' && (
          <div className="centered-page">
            <Card className="auth-card">
              <h2>Welcome Back</h2>
              <p className="muted">Log in to continue using SkillLink</p>
              <div className="stack gap-16">
                <InputField placeholder="Email Address" value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setForgotSent(false); setForgotError(''); setAuthNotice(''); }} />
                <InputField type="password" placeholder="Password" value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              </div>
              <div className="between-row" style={{ marginTop: '8px' }}>
                <button className="link-btn" onClick={handleForgotPassword} disabled={forgotLoading}>
                  {forgotLoading ? 'Sending...' : 'Forgot Password?'}
                </button>
                {!forgotSent && !forgotError && (
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>Enter email above first</p>
                )}
              </div>
              {authNotice && <p style={{ color: 'green', marginTop: '10px', fontSize: '14px' }}>{authNotice}</p>}
              {loginError && <p style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>{loginErrorMsg}</p>}
              {forgotError && <p style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>{forgotError}</p>}
              {forgotSent && <p style={{ color: 'green', marginTop: '10px', fontSize: '14px' }}>Reset link sent to <strong>{loginEmail}</strong> if account exists.</p>}
              <Button className="full-width" onClick={handleLogin}>Log In</Button>
              <p className="center-text muted">Don't have an account? <button className="link-btn" onClick={() => setPage('signup')}>Sign Up</button></p>
            </Card>
          </div>
        )}

        {/* ── SIGNUP ── */}
        {page === 'signup' && (
          <div className="centered-page">
            <Card className="auth-card">
              <h2>Create Account</h2>
              <p className="muted">Join SkillLink as a client or specialist</p>
              <div className="stack gap-16">
                <InputField placeholder="First Name" value={signupName} onChange={(e) => setSignupName(e.target.value)} />
                {signupErrors.name && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.name}</p>}
                <InputField placeholder="Last Name" value={signupSurname} onChange={(e) => setSignupSurname(e.target.value)} />
                {signupErrors.surname && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.surname}</p>}
                <InputField placeholder="Email Address" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                {signupErrors.email && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.email}</p>}
                <InputField placeholder="Phone Number" value={signupPhone} maxLength={16}
                  onChange={(e) => setSignupPhone(e.target.value.replace(/[^\d+\s\-]/g, ''))} />
                {signupErrors.phone && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.phone}</p>}
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '0' }}>Date of Birth</p>
                <InputField type="date" value={signupDob}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  onChange={(e) => setSignupDob(e.target.value)} />
                {signupErrors.dob && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.dob}</p>}
                <div style={{ position: 'relative' }}>
                  <InputField type={showSignupPass ? 'text' : 'password'} placeholder="Password" value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)} style={{ paddingRight: '42px' }} />
                  <button type="button" onClick={() => setShowSignupPass((v) => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                    {showSignupPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {signupErrors.password && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.password}</p>}
                <div style={{ position: 'relative' }}>
                  <InputField type={showSignupConfirm ? 'text' : 'password'} placeholder="Repeat Password" value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)} style={{ paddingRight: '42px' }} />
                  <button type="button" onClick={() => setShowSignupConfirm((v) => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                    {showSignupConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {signupErrors.confirm && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.confirm}</p>}
                <select className="select" value={signupRole} onChange={(e) => setSignupRole(e.target.value as 'client' | 'specialist')}>
                  <option value="client">Client — I want to hire specialists</option>
                  <option value="specialist">Specialist — I offer services</option>
                </select>
              </div>
              <Button className="full-width" onClick={handleSignup}>Register</Button>
              <p className="center-text muted">Already have an account? <button className="link-btn" onClick={() => setPage('login')}>Log In</button></p>
            </Card>
          </div>
        )}

        {/* ── EMAIL PENDING ── */}
        {page === 'emailPending' && (
          <div className="centered-page">
            <Card className="auth-card">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
                <h2>Check your email</h2>
                <p className="muted" style={{ marginTop: '8px' }}>
                  We sent a confirmation link to <strong>{signupEmail}</strong>.<br />
                  Please confirm your email to activate your account.
                </p>
                <Button className="full-width" style={{ marginTop: '24px' }} onClick={() => setPage('login')}>Go to Login</Button>
              </div>
            </Card>
          </div>
        )}

        {/* ── RESET PASSWORD ── */}
        {page === 'resetPassword' && (
          <div className="centered-page">
            <Card className="auth-card">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h2>Set New Password</h2>
                <p className="muted">Enter your new password below.</p>
              </div>
              {resetSuccess ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'green', marginTop: '16px' }}>Password changed successfully!</p>
                  <Button className="full-width" style={{ marginTop: '16px' }} onClick={() => setPage('login')}>Go to Login</Button>
                </div>
              ) : (
                <div className="stack gap-16" style={{ marginTop: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <InputField type={showResetPass ? 'text' : 'password'} placeholder="New Password" value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)} style={{ paddingRight: '42px' }} />
                    <button type="button" onClick={() => setShowResetPass((v) => !v)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                      {showResetPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <InputField type={showResetConfirm ? 'text' : 'password'} placeholder="Confirm New Password" value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)} style={{ paddingRight: '42px' }} />
                    <button type="button" onClick={() => setShowResetConfirm((v) => !v)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                      {showResetConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {resetError && <p style={{ color: 'red', fontSize: '13px' }}>{resetError}</p>}
                  <Button className="full-width" onClick={async () => {
                    setResetError('');
                    if (!resetNewPassword) { setResetError('Enter a new password'); return; }
                    if (resetNewPassword.length < 6) { setResetError('Min 6 characters'); return; }
                    if (!/\d/.test(resetNewPassword)) { setResetError('Must contain at least one number'); return; }
                    if (resetNewPassword !== resetConfirmPassword) { setResetError('Passwords do not match'); return; }
                    if (!resetToken) { setResetError('Reset token is missing. Open the reset link again.'); return; }
                    try {
                      await apiRequest<{ message: string }>(`/api/v1/auth/reset-password?token=${encodeURIComponent(resetToken)}`, {
                        method: 'POST', body: JSON.stringify({ new_password: resetNewPassword, confirm_password: resetConfirmPassword }),
                      }, null);
                      setResetSuccess(true);
                      window.history.replaceState({}, '', '/');
                    } catch (e) {
                      setResetError(e instanceof Error ? e.message : 'Reset failed. Link may have expired.');
                    }
                  }}>
                    Save New Password
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── HOME (CLIENT) ── */}
        {page === 'home' && (
          <div className="stack gap-32" style={{ marginTop: '20px' }}>
            <section className="banner">
              <div>
                <p className="banner-eyebrow">Hello, {user.name || 'there'}</p>
                <h2>What service do you need today?</h2>
                <p className="banner-text">Find and book verified specialists near you.</p>
              </div>
              <div className="searchbar large-search">
                <Search size={18} />
                <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search services..." />
                <Button variant="secondary" className="small-btn" onClick={() => { void loadNearbySpecialists(authToken); setPage('listing'); }}>
                  <Search size={16} /> Search
                </Button>
              </div>
            </section>

            <section>
              <SectionHeader title="Service Categories" />
              <div className="cards-grid three-cols">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <motion.button whileHover={{ y: -3 }} key={cat.id} className="category-card"
                      onClick={() => { setSearchJobType(cat.id); setPage('listing'); void loadNearbySpecialists(authToken); }}>
                      <IconBadge><Icon size={24} /></IconBadge>
                      <h3>{cat.label}</h3>
                      <p>{cat.description}</p>
                    </motion.button>
                  );
                })}
              </div>
            </section>

            <section>
              <SectionHeader title="Nearby Specialists" action={<Button variant="secondary" onClick={() => { void loadNearbySpecialists(authToken); setPage('listing'); }}>View All</Button>} />
              {specialistsLoading ? (
                <p className="muted">Loading specialists...</p>
              ) : specialists.length === 0 ? (
                <div className="soft-box">
                  <p className="muted">No specialists found nearby.</p>
                  <Button style={{ marginTop: '12px' }} onClick={() => void loadNearbySpecialists(authToken)}>Try Again</Button>
                </div>
              ) : (
                <div className="cards-grid three-cols">
                  {specialists.slice(0, 6).map((sp) => {
                    const cat = specialistCatalogs[sp.id] ?? [];
                    const minPrice = cat.length > 0 ? Math.min(...cat.map((c) => c.price)) : null;
                    return (
                      <Card key={sp.id}>
                        <div className="specialist-head" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <Avatar name={`S${sp.id.slice(0, 2)}`} />
                          <div style={{ flex: 1 }}>
                            <div className="name-row">
                              <h3 style={{ margin: 0 }}>Specialist {sp.id.slice(0, 6)}</h3>
                              {sp.is_verified && <ShieldCheck size={16} className="blue-icon" />}
                            </div>
                            <p className="muted small-text">{sp.is_active ? '🟢 Active' : '🔴 Inactive'}</p>
                          </div>
                          {minPrice !== null && <Badge tone="soft">From ${minPrice}</Badge>}
                        </div>
                        <div className="tag-row">
                          {cat.slice(0, 3).map((c) => <Badge key={c.id}>{categoryLabel(c.job_type)}</Badge>)}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <Button variant="secondary" className="flex-1" onClick={() => { setSelectedSpecialistId(sp.id); void loadSpecialistCatalog(sp.id); setPage('profile'); }}>
                            View Profile
                          </Button>
                          <Button className="flex-1" onClick={() => { setBookingSpecialistId(sp.id); setPage('booking'); }}>
                            Hire
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Quick Order */}
            <section>
              <SectionHeader title="Post a Job" />
              <Card>
                <p className="muted small-text" style={{ marginBottom: '16px' }}>
                  Post a job order and let specialists come to you, or create an order for a specific specialist.
                </p>
                <Button onClick={() => setPage('booking')}>📋 Create Order</Button>
              </Card>
            </section>
          </div>
        )}

        {/* ── LISTING ── */}
        {page === 'listing' && (
          <div className="stack gap-24">
            <div className="toolbar">
              <div className="searchbar">
                <Search size={18} />
                <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search specialists" />
              </div>
              <div className="filters-row">
                <select className="select" value={searchJobType} onChange={(e) => setSearchJobType(e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <InputField type="number" placeholder="Max price" value={searchMaxPrice}
                  onChange={(e) => setSearchMaxPrice(e.target.value)} style={{ width: '120px' }} />
                <Button onClick={() => void loadNearbySpecialists(authToken)}>
                  {specialistsLoading ? 'Searching...' : <><Search size={16} /> Search</>}
                </Button>
              </div>
            </div>
            {specialists.length === 0 && !specialistsLoading && (
              <div className="soft-box">No specialists found. Try adjusting your filters.</div>
            )}
            <div className="cards-grid two-cols">
              {specialists.map((sp) => {
                const cat = specialistCatalogs[sp.id] ?? [];
                const minPrice = cat.length > 0 ? Math.min(...cat.map((c) => c.price)) : null;
                return (
                  <Card key={sp.id}>
                    <div className="listing-card">
                      <div className="listing-main">
                        <Avatar name={`S${sp.id.slice(0, 2)}`} />
                        <div>
                          <div className="name-row">
                            <h3>Specialist {sp.id.slice(0, 8)}</h3>
                            {sp.is_verified && <ShieldCheck size={16} className="blue-icon" />}
                          </div>
                          <p className="muted">{sp.is_active ? '🟢 Active' : '🔴 Inactive'} · {sp.is_verified ? 'Verified' : 'Unverified'}</p>
                          <div className="tag-row">
                            {cat.slice(0, 3).map((c) => <Badge key={c.id}>{categoryLabel(c.job_type)}</Badge>)}
                          </div>
                          <p className="muted small-text mt-12">H3 Zone: {sp.h3_index}</p>
                        </div>
                      </div>
                      <div className="listing-actions">
                        {minPrice !== null && <Badge tone="soft">From ${minPrice}</Badge>}
                        <Button variant="secondary" onClick={() => { setSelectedSpecialistId(sp.id); void loadSpecialistCatalog(sp.id); setPage('profile'); }}>
                          View Profile
                        </Button>
                        <Button onClick={() => { setBookingSpecialistId(sp.id); setPage('booking'); }}>Hire</Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SPECIALIST PROFILE ── */}
        {page === 'profile' && selectedSpecialist && (
          <div className="profile-grid">
            <Card>
              <div className="profile-top">
                <Avatar name={`S${selectedSpecialist.id.slice(0, 2)}`} />
                <div className="profile-main">
                  <div className="name-row">
                    <h2>Specialist {selectedSpecialist.id.slice(0, 8)}</h2>
                    {selectedSpecialist.is_verified && <Badge tone="soft">Verified</Badge>}
                  </div>
                  <p className="profile-role">{selectedSpecialist.is_active ? '🟢 Active' : '🔴 Inactive'}</p>
                  <p className="muted mt-12">H3 Zone: {selectedSpecialist.h3_index}</p>
                  <p className="muted small-text">Member since: {new Date(selectedSpecialist.created_at).toLocaleDateString()}</p>
                </div>
                <Card className="price-card">
                  <p className="muted">Services offered</p>
                  <h2 className="price-hero">{selectedSpecialistCatalog.length}</h2>
                  <Button className="full-width" onClick={() => { setBookingSpecialistId(selectedSpecialist.id); setPage('booking'); }}>
                    Hire Now
                  </Button>
                </Card>
              </div>
            </Card>
            <div className="side-stack">
              <Card>
                <h3>Service Catalog</h3>
                {selectedSpecialistCatalog.length === 0 ? (
                  <p className="muted mt-12">No services listed yet.</p>
                ) : (
                  <div className="stack gap-12 mt-12">
                    {selectedSpecialistCatalog.map((item) => (
                      <div key={item.id} className="job-row">
                        <div>
                          <strong>{categoryLabel(item.job_type)}</strong>
                        </div>
                        <Badge tone="soft">${item.price}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── BOOKING ── */}
        {page === 'booking' && (
          <div className="booking-grid">
            <Card>
              <h2>Create Order</h2>
              {bookingSpecialistId && (
                <div className="soft-box mt-16">
                  <p className="muted small-text">Booking specialist: {bookingSpecialistId.slice(0, 8)}...</p>
                </div>
              )}
              <div className="mt-16">
                <label className="field-label">Job Type *</label>
                <select className="select" value={bookingJobType} onChange={(e) => setBookingJobType(e.target.value)}>
                  <option value="">Select a service category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="mt-16">
                <label className="field-label">Price ($) *</label>
                <InputField type="number" placeholder="e.g. 50" value={bookingPrice}
                  onChange={(e) => setBookingPrice(e.target.value)} />
              </div>
              <div className="mt-16">
                <label className="field-label">Description (optional)</label>
                <TextArea value={bookingDescription} onChange={(e) => setBookingDescription(e.target.value)}
                  placeholder="Describe what you need..." />
              </div>
              <Button className="full-width mt-16" onClick={createOrder} disabled={bookingLoading}>
                {bookingLoading ? 'Creating...' : 'Confirm Order'}
              </Button>
            </Card>
            <Card>
              <h2>Order Summary</h2>
              <div className="soft-box mt-16">
                <p className="muted small-text">Your order will be posted and specialists can apply. If you've selected a specialist, they will be notified directly.</p>
              </div>
              {bookingJobType && (
                <div className="summary-row mt-16">
                  <span>Service</span><span>{categoryLabel(bookingJobType)}</span>
                </div>
              )}
              {bookingPrice && (
                <div className="summary-row summary-total">
                  <span>Your Budget</span><span>${bookingPrice}</span>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── CONFIRMATION ── */}
        {page === 'confirmation' && (
          <div className="centered-page wide">
            <Card className="success-card">
              <div className="success-icon"><CheckCircle2 size={40} /></div>
              <h2>Order Created!</h2>
              <p className="muted">Your service request has been placed successfully.</p>
              {selectedBooking && (
                <div className="soft-box mt-16 left-text">
                  <p><strong>Order ID:</strong> {selectedBooking.id}</p>
                  <p><strong>Service:</strong> {selectedBooking.service}</p>
                  <p><strong>Price:</strong> ${selectedBooking.total}</p>
                  <p><strong>Status:</strong> {selectedBooking.status}</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'center' }}>
                <Button onClick={() => setPage('tracking')}>Track Order</Button>
                <Button variant="secondary" onClick={() => setPage('home')}>Back to Home</Button>
              </div>
            </Card>
          </div>
        )}

        {/* ── TRACKING ── */}
        {page === 'tracking' && (
          <div className="booking-grid">
            <Card>
              <h2>Track Order</h2>
              {!selectedBooking ? (
                <div className="empty-state">
                  <h3>No Order Selected</h3>
                  <p className="muted">Choose a booking to track.</p>
                  <Button onClick={() => setPage('bookings')}>Go to My Bookings</Button>
                </div>
              ) : (
                <>
                  <div className="soft-box mt-16">
                    <p><strong>Order ID:</strong> {selectedBooking.id}</p>
                    <p><strong>Service:</strong> {selectedBooking.service}</p>
                    <p><strong>Specialist:</strong> {selectedBooking.specialist}</p>
                    <p><strong>Date:</strong> {selectedBooking.date}</p>
                    <p><strong>Status:</strong> {selectedBooking.status}</p>
                    <p><strong>Price:</strong> ${selectedBooking.total}</p>
                  </div>
                  <div className="mt-16"><StepTracker status={selectedBooking.status} /></div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                    {(selectedBooking.status === 'Pending' || selectedBooking.status === 'Accepted') && role === 'client' && (
                      <Button style={{ background: '#dc2626' }} onClick={() => cancelOrder(selectedBooking.id)}>Cancel Order</Button>
                    )}
                    {selectedBooking.status === 'In Progress' && role === 'client' && (
                      <Button onClick={() => completeOrder(selectedBooking.id)}>✅ Mark Complete</Button>
                    )}
                    {selectedBooking.status === 'Accepted' && role === 'client' && (
                      <Button variant="secondary" onClick={() => setPage('requests')}>📋 View Requests</Button>
                    )}
                    <Button variant="secondary" onClick={() => setPage('contact')}>💬 Chat</Button>
                    {(selectedBooking.status === 'Cancelled' || selectedBooking.status === 'Completed') && role === 'client' && (
                      <Button variant="secondary" style={{ color: '#dc2626' }} onClick={() => {
                        if (confirm('Delete this order?')) { deleteOrder(selectedBooking.id); setPage('bookings'); }
                      }}>🗑️ Delete Order</Button>
                    )}
                  </div>
                  {selectedBooking.status === 'Completed' && (
                    <div className="success-box mt-16">
                      Service completed! You can now leave a review.
                      <div className="mt-12">
                        <Button onClick={() => { setReviewSpecialistId(selectedBooking.specialistId); setPage('feedback'); }}>
                          Leave Review
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
            <Card>
              <h2>Status Timeline</h2>
              <div className="stack gap-12 mt-16">
                <div className="soft-box">Pending — order is open, waiting for a specialist.</div>
                <div className="soft-box">Accepted — a specialist has sent a request.</div>
                <div className="soft-box">In Progress — request approved, work in progress.</div>
                <div className="soft-box">Completed — service finished and confirmed.</div>
              </div>
            </Card>
          </div>
        )}

        {/* ── REQUESTS (Specialist requests on orders) ── */}
        {page === 'requests' && (
          <Card>
            <SectionHeader title="Specialist Requests" action={<Button variant="secondary" onClick={loadRequests}>Refresh</Button>} />
            {requestsLoading ? (
              <p className="muted">Loading requests...</p>
            ) : requests.length === 0 ? (
              <div className="empty-state">
                <h3>No Requests Yet</h3>
                <p className="muted">Specialists have not applied to your orders yet.</p>
              </div>
            ) : (
              <div className="stack gap-12">
                {requests.map((req) => (
                  <div key={req.id} className="job-row">
                    <div>
                      <strong>Specialist {req.specialist_id.slice(0, 8)}</strong>
                      <p className="muted small-text">Order: {req.order_id.slice(0, 8)}...</p>
                      <p className="muted small-text">Status: {req.status}</p>
                      <p className="muted small-text">Applied: {new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      {req.status !== 'approved' && (
                        <Button onClick={() => approveRequest(req.id)}>✅ Approve</Button>
                      )}
                      {req.status === 'approved' && <Badge tone="success">Approved</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── FEEDBACK ── */}
        {page === 'feedback' && (
          <div className="centered-page wide">
            <Card className="auth-card wide-card">
              <h2>Leave a Review</h2>
              {reviewSpecialistId ? (
                <>
                  <div className="soft-box mt-16">
                    <p className="muted small-text">Reviewing specialist: {reviewSpecialistId.slice(0, 8)}...</p>
                  </div>
                  <div className="mt-16">
                    <label className="field-label">Rate Your Experience</label>
                    <div className="star-picker">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} className="star-btn" onClick={() => setReviewRating(i + 1)}>
                          <Star size={30} className={i < reviewRating ? 'star active' : 'star'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-16">
                    <label className="field-label">Comment</label>
                    <TextArea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your feedback..." />
                  </div>
                  <Button className="full-width mt-16" onClick={submitReview} disabled={reviewLoading}>
                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </>
              ) : (
                <div className="empty-state">
                  <p className="muted">No specialist selected for review.</p>
                  <Button onClick={() => setPage('bookings')}>Go to Bookings</Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── BOOKINGS (CLIENT) ── */}
        {page === 'bookings' && (
          <Card>
            <SectionHeader title="My Bookings" action={
              <Button variant="secondary" onClick={() => void loadClientOrders(authToken, user.id)}>Refresh</Button>
            } />
            {ordersLoading ? (
              <p className="muted">Loading orders...</p>
            ) : myBookings.length === 0 ? (
              <div className="empty-state">
                <h3>No Bookings Yet</h3>
                <p className="muted">Start by booking a specialist.</p>
                <Button onClick={() => setPage('home')}>Explore Services</Button>
              </div>
            ) : (
              <div className="stack gap-12">
                {myBookings.map((b) => (
                  <div key={b.id} className="job-row">
                    <div>
                      <strong>{b.service}</strong>
                      <p className="muted small-text">Specialist: {b.specialist}</p>
                      <p className="muted small-text">{b.date}</p>
                      <p className="muted small-text">Total: ${b.total}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <Badge tone="soft">{b.status}</Badge>
                      <Button variant="secondary" onClick={() => { setSelectedBookingId(b.id); setPage('tracking'); }}>Track</Button>
                      {b.status === 'Pending' && (
                        <Button variant="secondary" onClick={() => { setSelectedBookingId(b.id); setPage('requests'); void loadRequests(); }}>
                          📋 Requests
                        </Button>
                      )}
                      {(b.status === 'Cancelled' || b.status === 'Completed') && (
                        <Button variant="secondary" style={{ color: '#dc2626' }}
                          onClick={() => { if (confirm('Delete this order?')) deleteOrder(b.id); }}>
                          🗑️ Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── NOTIFICATIONS ── */}
        {page === 'notifications' && (
          <Card>
            <SectionHeader title="Notifications" />
            <div className="stack gap-12">
              {notifications.map((item) => (
                <div key={item.id} className="notice-row">
                  <IconBadge><Bell size={18} /></IconBadge>
                  <div>
                    <strong>Notification</strong>
                    <p className="muted mt-8">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── CONTACT / CHAT ── */}
        {page === 'contact' && (
          <Card>
            {!selectedBooking ? (
              <div className="empty-state">
                <h3>No Chat Available</h3>
                <p className="muted">Select an order to open its chat.</p>
                <Button variant="secondary" onClick={() => setPage(role === 'specialist' ? 'jobs' : 'bookings')}>Go Back</Button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ marginBottom: '6px' }}>Order Chat</h2>
                    <p className="muted small-text">Order: {selectedBooking.id.slice(0, 8)} · {selectedBooking.service}</p>
                  </div>
                  <Badge tone="soft">{selectedBooking.status}</Badge>
                </div>
                <div className="chat-box">
                  {chatLoading ? (
                    <div className="soft-box">Loading messages...</div>
                  ) : chatMessages.length === 0 ? (
                    <div className="soft-box">No messages yet. Start the conversation.</div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className={`message ${msg.senderId === user.id ? 'user' : 'specialist'}`}>
                        <div>{msg.text}</div>
                        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '6px' }}>{msg.senderName}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="chat-input">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type message..." />
                  <Button onClick={sendMessage}>Send</Button>
                </div>
              </>
            )}
          </Card>
        )}

        {/* ── DASHBOARD (SPECIALIST) ── */}
        {page === 'dashboard' && (
          <div className="stack gap-32">
            <div className="cards-grid four-cols">
              {[
                { label: 'Catalog Items', value: String(myCatalog.length), icon: Briefcase },
                { label: 'Total Orders', value: String(myBookings.length), icon: Calendar },
                { label: 'Completed', value: String(completedCount), icon: CheckCircle2 },
                { label: 'Total Earned', value: `$${totalEarnings}`, icon: DollarSign },
              ].map(({ label, value, icon: Icon }) => (
                <Card key={label}>
                  <div className="metric-card">
                    <div>
                      <p className="muted small-text">{label}</p>
                      <h2>{value}</h2>
                    </div>
                    <IconBadge><Icon size={22} /></IconBadge>
                  </div>
                </Card>
              ))}
            </div>

            {mySpecialist && (
              <Card>
                <SectionHeader title="My Specialist Profile" />
                <div className="soft-box mt-16">
                  <p className="muted small-text">Status: {mySpecialist.is_active ? '🟢 Active' : '🔴 Inactive'} · {mySpecialist.is_verified ? '✅ Verified' : '⏳ Awaiting verification'}</p>
                  <p className="muted small-text">H3 Zone: {mySpecialist.h3_index}</p>
                </div>
                <Button variant="secondary" style={{ marginTop: '12px' }} onClick={() => { setEditSpIsActive(mySpecialist.is_active); setIsEditingSpecialist(true); }}>
                  Edit Profile
                </Button>
              </Card>
            )}

            {!mySpecialist && !specialistLoading && (
              <Card>
                <SectionHeader title="Create Specialist Profile" />
                <p className="muted">You need a specialist profile to receive jobs.</p>
                <Button style={{ marginTop: '12px' }} onClick={() => setIsEditingSpecialist(true)}>Create Profile</Button>
              </Card>
            )}

            <Card>
              <SectionHeader title="Active Job Orders" action={
                <Button variant="secondary" onClick={() => void loadSpecialistOrders(authToken)}>Refresh</Button>
              } />
              <div className="stack gap-12">
                {bookings.filter((b) => b.status === 'Pending' && !b.specialistId).length === 0 ? (
                  <div className="soft-box">No active job orders available.</div>
                ) : (
                  bookings.filter((b) => b.status === 'Pending' && !b.specialistId).map((job) => (
                    <div key={job.id} className="job-row">
                      <div>
                        <strong>{job.service}</strong>
                        <p className="muted small-text">Price: ${job.total}</p>
                        <p className="muted small-text">{job.details?.slice(0, 80)}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Button onClick={() => takeOrder(job.id)}>📋 Apply</Button>
                        <Button variant="secondary" onClick={() => { setSelectedBookingId(job.id); setPage('contact'); }}>💬 Chat</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <SectionHeader title="My Jobs" action={<Button variant="secondary" onClick={() => setPage('jobs')}>View All</Button>} />
              <div className="stack gap-12">
                {myBookings.slice(0, 3).length === 0 ? (
                  <div className="soft-box">No jobs yet.</div>
                ) : (
                  myBookings.slice(0, 3).map((job) => (
                    <div key={job.id} className="job-row">
                      <div>
                        <strong>{job.service}</strong>
                        <p className="muted small-text">{job.date}</p>
                      </div>
                      <Badge tone="soft">{job.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ── JOBS (SPECIALIST) ── */}
        {page === 'jobs' && (
          <Card>
            <SectionHeader title="My Jobs" action={
              <Button variant="secondary" onClick={() => void loadSpecialistOrders(authToken)}>Refresh</Button>
            } />
            {myBookings.length === 0 ? (
              <div className="empty-state">
                <h3>No Jobs Yet</h3>
                <p className="muted">Browse and apply to available orders from the Dashboard.</p>
                <Button variant="secondary" onClick={() => setPage('dashboard')}>Back to Dashboard</Button>
              </div>
            ) : (
              <div className="stack gap-12">
                {myBookings.map((job) => (
                  <div key={job.id} className="job-row">
                    <div>
                      <strong>{job.service}</strong>
                      <p className="muted small-text">Order ID: {job.id.slice(0, 8)}...</p>
                      <p className="muted small-text">Client: {job.client}</p>
                      <p className="muted small-text">Date: {job.date}</p>
                      <p className="muted small-text">Details: {job.details}</p>
                      <p className="muted small-text">Price: ${job.total}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                      <Badge tone="soft">{job.status}</Badge>
                      {job.status === 'Pending' && (
                        <Button onClick={() => takeOrder(job.id)}>📋 Apply</Button>
                      )}
                      {job.status === 'Accepted' && <Badge tone="success">⏳ Awaiting Approval</Badge>}
                      {job.status === 'In Progress' && <Badge tone="soft">🔧 In Progress</Badge>}
                      {job.status === 'Completed' && <Badge tone="success">✅ Done</Badge>}
                      <Button variant="secondary" onClick={() => { setSelectedBookingId(job.id); setPage('contact'); }}>💬 Chat</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── MY CATALOG (SPECIALIST) ── */}
        {page === 'myOffers' && (
          <div className="stack gap-24">
            <Card>
              <SectionHeader title="Add Catalog Item" />
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '16px' }}>
                <div>
                  <p className="field-label">Job Type</p>
                  <select className="select" value={newCatalogJobType} onChange={(e) => setNewCatalogJobType(e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="field-label">Price ($)</p>
                  <InputField type="number" placeholder="e.g. 50" value={newCatalogPrice}
                    onChange={(e) => setNewCatalogPrice(e.target.value)} style={{ width: '120px' }} />
                </div>
                <Button onClick={createCatalogItem} disabled={createCatalogLoading}>
                  {createCatalogLoading ? 'Adding...' : <><Plus size={16} /> Add Item</>}
                </Button>
              </div>
              {createCatalogError && <p style={{ color: 'red', fontSize: '13px', marginTop: '8px' }}>{createCatalogError}</p>}
            </Card>

            <Card>
              <SectionHeader title="My Catalog" action={<Button variant="secondary" onClick={loadMyCatalog}>Refresh</Button>} />
              {catalogLoading ? (
                <p className="muted">Loading catalog...</p>
              ) : myCatalog.length === 0 ? (
                <div className="empty-state">
                  <h3>No Catalog Items</h3>
                  <p className="muted">Add services you offer to attract clients.</p>
                </div>
              ) : (
                <div className="stack gap-12 mt-16">
                  {myCatalog.map((item) => (
                    <div key={item.id} className="job-row">
                      <div>
                        <strong>{categoryLabel(item.job_type)}</strong>
                        <p className="muted small-text">Added: {new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Badge tone="soft">${item.price}</Badge>
                        <button onClick={() => deleteCatalogItem(item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── USER PROFILE ── */}
        {page === 'userProfile' && (
          <div className="profile-grid alt-grid">
            <Card>
              <div className="profile-box-center">
                <Avatar name={user.name || 'U'} />
                <h2 className="mt-12">{user.name} {user.surname}</h2>
                <p className="muted">{user.role === 'client' ? 'Client Account' : user.role === 'specialist' ? 'Specialist Account' : 'Admin Account'}</p>
                <div className="stack gap-12 mt-16 full-width">
                  <div className="contact-item"><Mail size={18} className="blue-icon" /><span>{user.email || 'No email'}</span></div>
                  <div className="contact-item"><Phone size={18} className="blue-icon" /><span>{user.phone || 'No phone'}</span></div>
                  {user.birth_date && <div className="contact-item"><Calendar size={18} className="blue-icon" /><span>{user.birth_date}</span></div>}
                </div>
                <Button className="full-width" style={{ marginTop: '16px' }} onClick={openEditProfile}>Edit Profile</Button>
              </div>
            </Card>

            <Card>
              {role === 'specialist' && (
                <>
                  <SectionHeader title="Account Overview" />
                  <div className="cards-grid two-cols mt-16">
                    <div className="soft-box"><p className="muted small-text">Catalog Items</p><h2>{myCatalog.length}</h2></div>
                    <div className="soft-box"><p className="muted small-text">Total Orders</p><h2>{myBookings.length}</h2></div>
                    <div className="soft-box"><p className="muted small-text">Completed</p><h2>{completedCount}</h2></div>
                    <div className="soft-box"><p className="muted small-text">Earned</p><h2>${totalEarnings}</h2></div>
                  </div>
                </>
              )}
              <div className="soft-box mt-16">
                <strong>Quick Actions</strong>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {role === 'specialist' ? (
                    <>
                      <Button onClick={() => setPage('dashboard')}>Dashboard</Button>
                      <Button variant="secondary" onClick={() => setPage('myOffers')}>My Catalog</Button>
                      <Button variant="secondary" onClick={() => { setEditSpIsActive(mySpecialist?.is_active ?? true); setIsEditingSpecialist(true); }}>
                        Specialist Settings
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setPage('home')}>Browse Services</Button>
                      <Button variant="secondary" onClick={() => setPage('bookings')}>My Orders</Button>
                    </>
                  )}
                  <Button variant="secondary" onClick={() => { setAdminAuthed(false); setPage('adminPanel'); }}>🛡️ Admin</Button>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button style={{ background: '#fee2e2', color: '#dc2626', border: 'none', width: '100%', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
                  onClick={() => setShowLogoutConfirm(true)}>
                  Log Out
                </button>
                <button style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', width: '100%', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
                  onClick={() => setShowDeleteConfirm(true)}>
                  Delete Account
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* ── ADMIN PANEL ── */}
        {page === 'adminPanel' && (
          <div className="stack gap-24">
            {!adminAuthed ? (
              <div className="centered-page">
                <Card className="auth-card">
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '40px' }}>🛡️</div>
                    <h2>Admin Panel</h2>
                    <p className="muted">Enter admin password to continue</p>
                  </div>
                  <InputField type="password" placeholder="Admin Password" value={adminPassword}
                    onChange={(e) => { setAdminPassword(e.target.value); setAdminLoginError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && adminPassword === ADMIN_PASSWORD) setAdminAuthed(true); }} />
                  {adminLoginError && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{adminLoginError}</p>}
                  <Button className="full-width" style={{ marginTop: '12px' }} onClick={() => {
                    if (adminPassword === ADMIN_PASSWORD) { setAdminAuthed(true); setAdminLoginError(''); }
                    else setAdminLoginError('Wrong password. Try again.');
                  }}>Enter Admin Panel</Button>
                  <Button variant="secondary" className="full-width" style={{ marginTop: '8px' }} onClick={() => setPage(role === 'specialist' ? 'dashboard' : 'home')}>← Back</Button>
                </Card>
              </div>
            ) : (
              <div className="stack gap-24">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>🛡️ Admin Panel</h2>
                    <p className="muted">Manage specialists — verify, deactivate, monitor</p>
                  </div>
                  <Button variant="secondary" onClick={() => { setAdminAuthed(false); setAdminPassword(''); setAdminSpecialists([]); }}>
                    🔒 Lock Panel
                  </Button>
                </div>

                {adminNotice && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', color: '#166534', fontSize: '14px' }}>
                    {adminNotice}
                  </div>
                )}

                <Card>
                  <h3 style={{ marginBottom: '16px' }}>🔍 Load Specialists</h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                      <p className="field-label">Latitude</p>
                      <InputField type="number" placeholder={String(DEFAULT_LAT)} value={adminSearchLat}
                        onChange={(e) => setAdminSearchLat(e.target.value)} style={{ width: '120px' }} />
                    </div>
                    <div>
                      <p className="field-label">Longitude</p>
                      <InputField type="number" placeholder={String(DEFAULT_LON)} value={adminSearchLon}
                        onChange={(e) => setAdminSearchLon(e.target.value)} style={{ width: '120px' }} />
                    </div>
                    <div>
                      <p className="field-label">Results (k)</p>
                      <InputField type="number" placeholder="50" value={adminSearchK}
                        onChange={(e) => setAdminSearchK(e.target.value)} style={{ width: '80px' }} />
                    </div>
                    <Button onClick={adminLoadSpecialists}>{adminLoading ? 'Loading...' : '📋 Load Specialists'}</Button>
                    <Button variant="secondary" onClick={async () => {
                      const loc = await getGPS();
                      setAdminSearchLat(String(loc.lat));
                      setAdminSearchLon(String(loc.lon));
                    }}>📍 Use GPS</Button>
                  </div>
                </Card>

                {adminSpecialists.length > 0 && (
                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0 }}>Specialists ({adminSpecialists.length})</h3>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
                        <span>✅ {adminSpecialists.filter((s) => s.is_verified).length} verified</span>
                        <span>•</span>
                        <span>🟢 {adminSpecialists.filter((s) => s.is_active).length} active</span>
                        <span>•</span>
                        <span>⏳ {adminSpecialists.filter((s) => !s.is_verified).length} pending</span>
                      </div>
                    </div>
                    <div className="stack gap-12">
                      {adminSpecialists.map((sp) => (
                        <div key={sp.id} style={{
                          border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px',
                          background: sp.is_verified ? '#f0fdf4' : sp.is_active ? '#fff' : '#fef2f2',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <strong style={{ fontSize: '14px' }}>ID: {sp.id.slice(0, 16)}...</strong>
                                {sp.is_verified && <span style={{ background: '#dcfce7', color: '#166534', fontSize: '12px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>✅ Verified</span>}
                                {!sp.is_verified && <span style={{ background: '#fef9c3', color: '#92400e', fontSize: '12px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>⏳ Pending</span>}
                                {sp.is_active ? <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '12px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>🟢 Active</span>
                                  : <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '12px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>🔴 Inactive</span>}
                              </div>
                              <p className="muted small-text">User ID: {sp.user_id.slice(0, 16)}...</p>
                              <p className="muted small-text">H3 Zone: {sp.h3_index}</p>
                              <p className="muted small-text">Created: {new Date(sp.created_at).toLocaleDateString()}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {!sp.is_verified && (
                                <button onClick={() => adminVerify(sp.id)}
                                  style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                                  ✅ Verify
                                </button>
                              )}
                              {sp.is_active && (
                                <button onClick={() => adminDeactivate(sp.id)}
                                  style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                                  🔴 Deactivate
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── BOTTOM NAV ── */}
      {!isAuthPage && (
        <BottomNav role={role} active={
          page === 'userProfile' ? 'profile'
            : ['tracking', 'confirmation', 'feedback', 'listing', 'profile', 'booking', 'requests', 'contact', 'notifications'].includes(page)
              ? (role === 'client' ? 'home' : 'dashboard')
              : page
        } onNavigate={(target) => {
          if (target === 'profile') { setPage('userProfile'); return; }
          if (target === 'myOffers') { void loadMyCatalog(); }
          if (target === 'jobs') { void loadSpecialistOrders(authToken); }
          if (target === 'bookings') { void loadClientOrders(authToken, user.id); }
          setPage(target as Page);
        }} />
      )}

      {/* ── MODALS ── */}

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Log out?</h3>
            <p className="muted">Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
              <Button onClick={() => { handleLogout(); setShowLogoutConfirm(false); }}>Log Out</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirm */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Account?</h3>
            <p className="muted">This action is <strong>permanent</strong>. All your data will be deleted.</p>
            {deleteLoading && <p style={{ color: '#6b7280', fontSize: '14px' }}>Deleting account...</p>}
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button style={{ background: '#dc2626' }} onClick={async () => {
                setDeleteLoading(true);
                try {
                  if (role === 'specialist') {
                    try { await apiRequest('/api/v1/specialists/delete', { method: 'DELETE' }, authToken); } catch { /* ignore */ }
                  }
                  await apiRequest('/api/v1/users/delete', { method: 'DELETE' }, authToken);
                } catch { /* ignore */ } finally {
                  setDeleteLoading(false);
                  setShowDeleteConfirm(false);
                  localStorage.removeItem(TOKEN_KEY);
                  setAuthToken('');
                  setUser({ id: '', name: '', surname: '', email: '', phone: '', birth_date: '', role: 'client' });
                  setBookings([]);
                  setMySpecialist(null);
                  setMyCatalog([]);
                  setPage('login');
                }
              }}>Yes, Delete My Account</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="modal-overlay" onClick={() => setIsEditingProfile(false)}>
          <div className="modal" style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            {editSuccess && <p style={{ color: 'green', fontSize: '14px', marginBottom: '12px', background: '#f0fdf4', padding: '10px', borderRadius: '8px' }}>✅ {editSuccess}</p>}

            <p className="field-label">First Name</p>
            <InputField placeholder="First Name" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ marginBottom: '4px' }} />
            {editErrors.name && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.name}</p>}

            <p className="field-label" style={{ marginTop: '12px' }}>Last Name</p>
            <InputField placeholder="Last Name" value={editSurname} onChange={(e) => setEditSurname(e.target.value)} style={{ marginBottom: '4px' }} />
            {editErrors.surname && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.surname}</p>}

            <p className="field-label" style={{ marginTop: '12px' }}>Date of Birth</p>
            <InputField type="date" value={editBirthDate} onChange={(e) => setEditBirthDate(e.target.value)} style={{ marginBottom: '4px' }} />

            <p className="field-label" style={{ marginTop: '12px' }}>Email</p>
            <InputField placeholder="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ marginBottom: '4px' }} />
            {editErrors.email && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.email}</p>}

            <p className="field-label" style={{ marginTop: '12px' }}>Phone</p>
            <InputField placeholder="Phone" value={editPhone} maxLength={16}
              onChange={(e) => setEditPhone(e.target.value.replace(/[^\d+\s\-]/g, ''))} style={{ marginBottom: '4px' }} />
            {editErrors.phone && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.phone}</p>}

            <div style={{ borderTop: '1px solid #eee', marginTop: '16px', paddingTop: '16px' }}>
              <p style={{ fontWeight: '600', marginBottom: '12px' }}>Change Password <span className="muted" style={{ fontWeight: 400, fontSize: '13px' }}>(optional)</span></p>
              <p className="field-label">New Password</p>
              <div style={{ position: 'relative', marginBottom: '4px' }}>
                <InputField type={showEditNewPass ? 'text' : 'password'} placeholder="New password" value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)} style={{ paddingRight: '42px' }} />
                <button type="button" onClick={() => setShowEditNewPass((v) => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                  {showEditNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {editErrors.newPassword && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.newPassword}</p>}

              <p className="field-label" style={{ marginTop: '12px' }}>Confirm New Password</p>
              <div style={{ position: 'relative', marginBottom: '4px' }}>
                <InputField type={showEditConfirmPass ? 'text' : 'password'} placeholder="Repeat new password" value={editConfirmPassword}
                  onChange={(e) => setEditConfirmPassword(e.target.value)} style={{ paddingRight: '42px' }} />
                <button type="button" onClick={() => setShowEditConfirmPass((v) => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                  {showEditConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {editErrors.confirmPassword && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.confirmPassword}</p>}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
              <Button onClick={saveProfile}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Specialist Profile Modal */}
      {isEditingSpecialist && (
        <div className="modal-overlay" onClick={() => setIsEditingSpecialist(false)}>
          <div className="modal" style={{ maxWidth: '440px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3>Specialist Profile</h3>
            {specialistLoading && <p className="muted">Loading...</p>}
            {specialistError && <p style={{ color: '#dc2626', fontSize: '14px' }}>{specialistError}</p>}

            {!specialistLoading && !mySpecialist && (
              <div style={{ padding: '8px 0' }}>
                <p className="muted" style={{ marginBottom: '16px' }}>Create a specialist profile to start receiving jobs.</p>
                <p className="field-label">Latitude (optional, uses GPS if empty)</p>
                <InputField type="number" placeholder={`e.g. ${DEFAULT_LAT}`} value={editSpLat} onChange={(e) => setEditSpLat(e.target.value)} style={{ marginBottom: '12px' }} />
                <p className="field-label">Longitude (optional)</p>
                <InputField type="number" placeholder={`e.g. ${DEFAULT_LON}`} value={editSpLon} onChange={(e) => setEditSpLon(e.target.value)} style={{ marginBottom: '16px' }} />
                <Button onClick={createSpecialist} disabled={specialistLoading}>
                  {specialistLoading ? 'Creating...' : '➕ Create Specialist Profile'}
                </Button>
              </div>
            )}

            {mySpecialist && (
              <>
                <div className="soft-box" style={{ marginBottom: '16px' }}>
                  <p className="muted small-text">ID: {mySpecialist.id.slice(0, 12)}...</p>
                  <p className="muted small-text">H3 Zone: {mySpecialist.h3_index}</p>
                  <p className="muted small-text">Status: {mySpecialist.is_active ? '🟢 Active' : '🔴 Inactive'} · {mySpecialist.is_verified ? '✅ Verified' : '⏳ Awaiting verification'}</p>
                </div>
                {editSpSuccess && <p style={{ color: 'green', fontSize: '14px', marginBottom: '12px', background: '#f0fdf4', padding: '10px', borderRadius: '8px' }}>✅ {editSpSuccess}</p>}
                {editSpError && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '12px' }}>{editSpError}</p>}

                <p className="field-label">New Latitude (optional)</p>
                <InputField type="number" placeholder="e.g. 50.2839" value={editSpLat} onChange={(e) => setEditSpLat(e.target.value)} style={{ marginBottom: '12px' }} />
                <p className="field-label">New Longitude (optional)</p>
                <InputField type="number" placeholder="e.g. 57.1660" value={editSpLon} onChange={(e) => setEditSpLon(e.target.value)} style={{ marginBottom: '12px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <input type="checkbox" id="sp-active" checked={editSpIsActive} onChange={(e) => setEditSpIsActive(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="sp-active" style={{ fontSize: '14px', cursor: 'pointer' }}>Profile is Active</label>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <Button variant="secondary" onClick={() => setIsEditingSpecialist(false)}>Cancel</Button>
                  <Button onClick={updateSpecialist}>Save Changes</Button>
                </div>

                <button style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', marginTop: '8px', width: '100%', padding: '10px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                  onClick={() => setShowDeleteSpecialistConfirm(true)}>
                  🗑️ Delete Specialist Profile
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Specialist Confirm */}
      {showDeleteSpecialistConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Specialist Profile?</h3>
            <p className="muted">Your specialist profile will be permanently removed. Your user account will remain.</p>
            {deleteSpecialistLoading && <p style={{ color: '#6b7280', fontSize: '14px' }}>Deleting...</p>}
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setShowDeleteSpecialistConfirm(false)}>Cancel</Button>
              <Button style={{ background: '#dc2626' }} onClick={deleteSpecialist}>Yes, Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
