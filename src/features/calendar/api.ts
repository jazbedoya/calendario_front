import { apiClient } from "@/lib/api";

export interface CalendarStatus {
  connected: boolean;
  google_email: string | null;
  last_synced_at: string | null;
}

export interface SyncResult {
  synced: number;
  message: string;
}

export async function getCalendarStatusApi(): Promise<CalendarStatus> {
  const res = await apiClient.get<CalendarStatus>("/calendar/status");
  return res.data;
}

export async function getCalendarConnectUrlApi(redirectTo?: string, callbackUri?: string): Promise<string> {
  const params: Record<string, string> = {};
  if (redirectTo) params.redirect_to = redirectTo;
  if (callbackUri) params.callback_uri = callbackUri;
  const res = await apiClient.get<{ url: string }>("/calendar/connect", { params });
  return res.data.url;
}

export async function syncCalendarApi(): Promise<SyncResult> {
  const res = await apiClient.post<SyncResult>("/calendar/sync");
  return res.data;
}

export async function disconnectCalendarApi(): Promise<void> {
  await apiClient.delete("/calendar/disconnect");
}
