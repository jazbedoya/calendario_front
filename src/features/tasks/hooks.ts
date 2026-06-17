import { Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { useAuthStore } from "@/stores/authStore";
import { createTaskApi, deleteTaskApi, getStreakApi, getTodayTasksApi, patchTaskApi } from "./api";
import type { DailyTask, StreakData } from "./api";
import { enqueue, dequeue } from "@/lib/mutationQueue";
import { recordCompletion } from "./useStreak";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function useTodayDate(): string {
  const tz = useAuthStore((s) => s.user?.timezone ?? "UTC");
  return formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
}

function key(today: string) {
  return ["daily-tasks", today] as const;
}

const STREAK_KEY = ["task-streak"] as const;

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

export function useGetStreak() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<StreakData>({
    queryKey: STREAK_KEY,
    queryFn:  getStreakApi,
    staleTime: 0,
    enabled:  isAuthenticated,
  });
}

export function useGetTodayTasks() {
  const today = useTodayDate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: key(today),
    queryFn:  () => getTodayTasksApi(today),
    staleTime: 300_000,
    enabled:  isAuthenticated,
  });
}

// ── Create (optimistic) ───────────────────────────────────────────────────────

export function useCreateTask() {
  const today = useTodayDate();
  const qk    = key(today);
  const qc    = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      const _id = await enqueue({ type: "create", date: today, text });
      try {
        const result = await createTaskApi(today, text);
        await dequeue(_id);
        return result;
      } catch (e) {
        throw e; // queda en la cola para el próximo arranque
      }
    },

    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey: qk });
      const previous = qc.getQueryData<DailyTask[]>(qk) ?? [];
      const optimisticId = `local-${Date.now()}`;
      const optimistic: DailyTask = {
        id:         optimisticId,
        date:       today,
        text,
        done:       false,
        order:      previous.length,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<DailyTask[]>(qk, [...previous, optimistic]);
      return { previous, optimisticId };
    },

    onSuccess: (realTask, _vars, ctx) => {
      qc.setQueryData<DailyTask[]>(qk, (old = []) => {
        const without = old.filter(
          (t) => t.id !== ctx?.optimisticId && t.id !== realTask.id
        );
        return [...without, realTask].sort((a, b) => a.order - b.order);
      });
      qc.invalidateQueries({ queryKey: STREAK_KEY });
    },

    onError: (_err, _vars, ctx) => {
      // Remove only the failed optimistic task — don't wipe the full cache snapshot,
      // which would also remove other in-flight optimistic tasks.
      if (ctx) qc.setQueryData<DailyTask[]>(qk, (old = []) => old.filter((t) => t.id !== ctx.optimisticId));
      Alert.alert("Error", "No se pudo guardar la tarea. Comprueba tu conexión e inténtalo de nuevo.");
    },
  });
}

// ── Toggle done (optimistic) ──────────────────────────────────────────────────

export function useToggleTask() {
  const today = useTodayDate();
  const qk    = key(today);
  const qc    = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      if (id.startsWith("local-")) return Promise.resolve({ id, done } as any);
      const _id = await enqueue({ type: "toggle", id, done });
      try {
        const result = await patchTaskApi(id, { done });
        await dequeue(_id);
        return result;
      } catch (e) {
        throw e;
      }
    },

    retry: 1,  // safe: setting done=true twice = idempotent

    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: qk });
      const previous = qc.getQueryData<DailyTask[]>(qk);
      qc.setQueryData<DailyTask[]>(qk, (old = []) =>
        old.map((t) => (t.id === id ? { ...t, done } : t))
      );
      return { previous };
    },

    onSuccess: (result, { id }) => {
      qc.setQueryData<DailyTask[]>(qk, (old = []) =>
        old.map((t) => (t.id === id ? { ...t, done: result.done } : t))
      );
      qc.invalidateQueries({ queryKey: STREAK_KEY });
      // Persist local streak when all tasks are completed
      const updated = qc.getQueryData<DailyTask[]>(qk) ?? [];
      if (updated.length > 0 && updated.every((t) => t.done)) {
        recordCompletion(today).catch(() => {});
      }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk, ctx.previous);
      Alert.alert("Error", "No se pudo guardar el cambio. Comprueba tu conexión e inténtalo de nuevo.");
    },
  });
}

// ── Delete (optimistic) ───────────────────────────────────────────────────────

export function useDeleteTask() {
  const today = useTodayDate();
  const qk    = key(today);
  const qc    = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("local-")) return Promise.resolve();
      const _id = await enqueue({ type: "delete", id });
      try {
        await deleteTaskApi(id);
        await dequeue(_id);
      } catch (e) {
        throw e;
      }
    },
    retry: 1,

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk });
      const previous = qc.getQueryData<DailyTask[]>(qk);
      qc.setQueryData<DailyTask[]>(qk, (old = []) => old.filter((t) => t.id !== id));
      return { previous };
    },

    onSuccess: (_result, id) => {
      // Direct cache update — no refetch, avoids wiping concurrent optimistic creates.
      qc.setQueryData<DailyTask[]>(qk, (old = []) => old.filter((t) => t.id !== id));
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk, ctx.previous);
      Alert.alert("Error", "No se pudo borrar la tarea. Comprueba tu conexión e inténtalo de nuevo.");
    },
  });
}
