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
  redirect_to?: string;
}): Promise<{ email: string }> {
  const response = await apiClient.post<{ email: string }>("/auth/signup", data);
  return response.data;
}

export async function resendVerificationApi(email: string): Promise<void> {
  await apiClient.post("/auth/resend-verification", { email });
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

export async function getGoogleLoginUrlApi(redirectTo: string, callbackUri: string): Promise<string> {
  const response = await apiClient.get<{ url: string }>("/auth/google/connect", {
    params: { redirect_to: redirectTo, callback_uri: callbackUri },
  });
  return response.data.url;
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

export async function forgotPasswordApi(email: string): Promise<void> {
  await apiClient.post("/auth/forgot-password", { email });
}

export async function resetPasswordApi(token: string, newPassword: string): Promise<void> {
  await apiClient.post("/auth/reset-password", { token, new_password: newPassword });
}
