import { apiClient } from "@/lib/api";

export interface DailyTask {
  id: string;
  date: string;      // "yyyy-MM-dd"
  text: string;
  done: boolean;
  order: number;
  created_at: string;
}

export async function getTodayTasksApi(date: string): Promise<DailyTask[]> {
  const { data } = await apiClient.get<DailyTask[]>("/tasks/daily", { params: { date } });
  return data;
}

export async function createTaskApi(date: string, text: string): Promise<DailyTask> {
  const { data } = await apiClient.post<DailyTask>("/tasks/daily", { date, text });
  return data;
}

export async function patchTaskApi(
  id: string,
  patch: { text?: string; done?: boolean },
): Promise<DailyTask> {
  const { data } = await apiClient.patch<DailyTask>(`/tasks/daily/${id}`, patch);
  return data;
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  week_done: boolean[];  // 7 items, index 0 = Monday of current week
}

export async function getStreakApi(): Promise<StreakData> {
  const { data } = await apiClient.get<StreakData>("/tasks/streak");
  return data;
}

export async function deleteTaskApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/tasks/daily/${id}`);
  } catch (err: any) {
    if (err?.response?.status === 404) return; // already deleted = success
    throw err;
  }
}
