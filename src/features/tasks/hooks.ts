import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { useAuthStore } from "@/stores/authStore";
import { createTaskApi, deleteTaskApi, getTodayTasksApi, patchTaskApi } from "./api";
import type { DailyTask } from "./api";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function useTodayDate(): string {
  const tz = useAuthStore((s) => s.user?.timezone ?? "UTC");
  return formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
}

function key(today: string) {
  return ["daily-tasks", today] as const;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export function useGetYesterdayPending() {
  const tz              = useAuthStore((s) => s.user?.timezone ?? "UTC");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const yesterday       = formatInTimeZone(subDays(new Date(), 1), tz, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["daily-tasks", yesterday],
    queryFn:  () => getTodayTasksApi(yesterday),
    staleTime: 300_000,
    enabled:  isAuthenticated,
    select:   (tasks: DailyTask[]) => tasks.filter((t) => !t.done),
  });
}

export function useGetTodayTasks() {
  const today = useTodayDate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: key(today),
    queryFn:  () => getTodayTasksApi(today),
    staleTime: 60_000,
    enabled:  isAuthenticated,
  });
}

// ── Create (optimistic) ───────────────────────────────────────────────────────

export function useCreateTask() {
  const today = useTodayDate();
  const qk    = key(today);
  const qc    = useQueryClient();

  return useMutation({
    mutationFn: (text: string) => createTaskApi(today, text),

    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey: qk });
      const previous = qc.getQueryData<DailyTask[]>(qk) ?? [];
      // Add a temporary optimistic entry so the UI responds instantly
      const optimistic: DailyTask = {
        id:         `local-${Date.now()}`,
        date:       today,
        text,
        done:       false,
        order:      previous.length,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<DailyTask[]>(qk, [...previous, optimistic]);
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx) qc.setQueryData(qk, ctx.previous);
    },

    // Replace the optimistic entry with the real server data
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk });
    },
  });
}

// ── Toggle done (optimistic) ──────────────────────────────────────────────────

export function useToggleTask() {
  const today = useTodayDate();
  const qk    = key(today);
  const qc    = useQueryClient();

  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      patchTaskApi(id, { done }),

    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: qk });
      const previous = qc.getQueryData<DailyTask[]>(qk);
      qc.setQueryData<DailyTask[]>(qk, (old = []) =>
        old.map((t) => (t.id === id ? { ...t, done } : t))
      );
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk, ctx.previous);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk });
    },
  });
}

// ── Delete (optimistic) ───────────────────────────────────────────────────────

export function useDeleteTask() {
  const today = useTodayDate();
  const qk    = key(today);
  const qc    = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTaskApi(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk });
      const previous = qc.getQueryData<DailyTask[]>(qk);
      qc.setQueryData<DailyTask[]>(qk, (old = []) => old.filter((t) => t.id !== id));
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk, ctx.previous);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk });
    },
  });
}
