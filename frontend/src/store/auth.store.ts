/**
 * Auth store (Zustand)
 *
 * Holds user, accessToken, and hydration state. Access token is kept in memory
 * (not localStorage) for XSS safety; refresh token is httpOnly cookie.
 */

import { create } from 'zustand';
import { getClientApiBaseUrl } from '@/lib/env';
import type { AuthUser } from '@/types';

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isHydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  /** Set user from SSR/session (no access token); caller should call refreshAccess() for API calls */
  setFromServer: (user: AuthUser | null) => void;
  /** Clear user and token; call after failed refresh or explicit logout */
  logout: () => void;
  /** Call POST /api/auth/refresh (cookie sent automatically). Returns new accessToken or null. */
  refreshAccess: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isHydrated: false,

  setUser: (user) => set({ user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setHydrated: (isHydrated) => set({ isHydrated }),

  setFromServer: (user) => set({ user, isHydrated: true }),

  logout: () => set({ user: null, accessToken: null, isHydrated: true }),

  refreshAccess: async (): Promise<string | null> => {
    const API_URL = getClientApiBaseUrl();
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data?.accessToken) {
        get().logout();
        return null;
      }
      const { accessToken, user } = data.data;
      set({ accessToken, user: user ?? get().user });
      return accessToken;
    } catch {
      get().logout();
      return null;
    }
  },
}));
