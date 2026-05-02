import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDto } from '@/types/api';

export const TOKEN_KEY = 'skilllink_access_token';
export const SPECIALIST_ID_KEY = 'skilllink_specialist_id';

interface AuthState {
  token: string | null;
  user: UserDto | null;
  setToken: (token: string | null) => void;
  setUser: (user: UserDto | null) => void;
  signOut: () => void;
}

function clearLocalAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SPECIALIST_ID_KEY);
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
      user: null,
      setToken: (token) => {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
        set({ token });
      },
      setUser: (user) => set({ user }),
      signOut: () => {
        clearLocalAuth();
        set({ token: null, user: null });
      },
    }),
    {
      name: 'skilllink-auth',
      partialize: (s) => ({ user: s.user }),
    },
  ),
);

export function handleUnauthorized() {
  useAuth.getState().signOut();
}

export function getAuthToken(): string | null {
  return useAuth.getState().token ?? localStorage.getItem(TOKEN_KEY);
}
