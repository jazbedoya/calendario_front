import { create } from "zustand";
import { getMeApi, logoutApi } from "@/features/auth/api";
import { secureStore } from "@/lib/secure-store";
import { queryClient } from "@/lib/queryClient";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  timezone: string;
  mascot_name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  weekly_intentions: any;
  weekly_intentions_week: string | null; // "yyyy-MM-dd"
  language: string;
  created_at: string; // ISO datetime
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setTokens: async (accessToken, refreshToken) => {
    await secureStore.setAccessToken(accessToken);
    await secureStore.setRefreshToken(refreshToken);
    set({ accessToken, isAuthenticated: true });
  },

  setUser: (user) => {
    set({ user });
    secureStore.setCachedUser(user).catch(() => {});
  },

  logout: async () => {
    try {
      await logoutApi();
    } catch {
      // ignore — backend may already have revoked the token
    }
    await secureStore.clearTokens();
    queryClient.clear();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  initialize: async () => {
    const [token, cachedUserRaw] = await Promise.all([
      secureStore.getAccessToken(),
      secureStore.getCachedUser(),
    ]);
    const cachedUser: AuthUser | null = cachedUserRaw ? JSON.parse(cachedUserRaw) : null;
    // Set state immediately — no network call needed to show the app
    set({ accessToken: token, isAuthenticated: !!token, user: cachedUser, isLoading: false });

    // Refresh user profile in background without blocking the UI
    if (token) {
      getMeApi().then((user) => {
        set({ user });
        secureStore.setCachedUser(user).catch(() => {});
      }).catch(async (e: any) => {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          queryClient.clear();
          await secureStore.clearTokens();
          set({ accessToken: null, isAuthenticated: false, user: null });
        }
        // Network error: keep session alive with cached user data
      });
    }
    return token;
  },
}));
