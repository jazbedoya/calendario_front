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
    queryClient.clear();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  initialize: async () => {
    const token = await secureStore.getAccessToken();
    set({ accessToken: token, isAuthenticated: !!token, isLoading: false });
    if (token) {
      // Try up to 2 times — first request on Railway can be slow (cold start)
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const user = await getMeApi();
          set({ user });
          break;
        } catch (e: any) {
          const status = e?.response?.status;
          if (status === 401 || status === 403) {
            // Token genuinely invalid — clear session
            set({ accessToken: null, isAuthenticated: false });
            break;
          }
          // Network error or server error — only clear on second failure
          if (attempt === 1) {
            set({ accessToken: null, isAuthenticated: false });
          }
        }
      }
    }
    return token;
  },
}));
