import { create } from "zustand";
import { getMeApi, logoutApi } from "@/features/auth/api";
import { secureStore } from "@/lib/secure-store";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  timezone: string;
  mascot_name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  weekly_intentions: any;
  weekly_intentions_week: string | null; // "yyyy-MM-dd"
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

  setUser: (user) => set({ user }),

  logout: async () => {
    try {
      await logoutApi();
    } catch {
      // ignore — backend may already have revoked the token
    }
    await secureStore.clearTokens();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  initialize: async () => {
    const token = await secureStore.getAccessToken();
    set({ accessToken: token, isAuthenticated: !!token, isLoading: false });
    if (token) {
      try {
        const user = await getMeApi();
        set({ user });
      } catch {
        // Token expired or invalid — stays unauthenticated
        set({ accessToken: null, isAuthenticated: false });
      }
    }
    return token;
  },
}));
