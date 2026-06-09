import axios, { AxiosError } from "axios";
import Constants from "expo-constants";
import { secureStore } from "./secure-store";

import { Platform } from "react-native";

const DEFAULT_API_URL = Platform.OS === "web" ? "http://localhost:9001" : "http://10.0.2.2:9000";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Attach access token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await secureStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 → try refresh, then retry the original request once
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    const url = original?.url ?? "";
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/signup")
    ) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((newToken) => {
          if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
          resolve(apiClient(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await secureStore.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post<{
        access_token: string;
        refresh_token: string;
      }>(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });

      await secureStore.setAccessToken(data.access_token);
      await secureStore.setRefreshToken(data.refresh_token);

      refreshQueue.forEach((cb) => cb(data.access_token));
      refreshQueue = [];

      if (original.headers) {
        original.headers.Authorization = `Bearer ${data.access_token}`;
      }
      return apiClient(original);
    } catch {
      refreshQueue = [];
      await secureStore.clearTokens();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
