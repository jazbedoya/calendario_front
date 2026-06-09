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

export async function deleteTaskApi(id: string): Promise<void> {
  await apiClient.delete(`/tasks/daily/${id}`);
}
