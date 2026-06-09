import { apiClient } from "@/lib/api";
import type { AuthUser } from "@/stores/authStore";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export async function signupApi(data: {
  email: string;
  password: string;
  full_name: string;
  timezone: string;
}): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/auth/signup", data);
  return response.data;
}

export async function loginApi(data: {
  email: string;
  password: string;
}): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/auth/login", data);
  return response.data;
}

export async function refreshApi(refreshToken: string): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  return response.data;
}

export async function getMeApi(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>("/auth/me");
  return response.data;
}

export async function googleAuthApi(accessToken: string): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/auth/google", { access_token: accessToken });
  return response.data;
}

export async function patchMeApi(data: {
  full_name?: string;
  timezone?: string;
  mascot_name?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  weekly_intentions?: any;
  weekly_intentions_week?: string; // "yyyy-MM-dd"
  language?: string;
}): Promise<AuthUser> {
  const response = await apiClient.patch<AuthUser>("/auth/me", data);
  return response.data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post("/auth/logout");
}
