import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCalendarStatusApi,
  syncCalendarApi,
  disconnectCalendarApi,
} from "./api";
import { useCalendarStore } from "./calendarStore";

export function useCalendarStatus() {
  const setStatus = useCalendarStore((s) => s.setStatus);

  return useQuery({
    queryKey: ["calendar-status"],
    queryFn: async () => {
      const data = await getCalendarStatusApi();
      setStatus({
        connected: data.connected,
        googleEmail: data.google_email,
        lastSyncedAt: data.last_synced_at,
      });
      return data;
    },
    staleTime: 300_000,
  });
}

export function useSyncCalendar() {
  const qc = useQueryClient();
  const { setSyncing } = useCalendarStore();

  return useMutation({
    mutationFn: syncCalendarApi,
    onMutate: () => setSyncing(true),
    onSettled: () => setSyncing(false),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-status"] }),
  });
}

export function useDisconnectCalendar() {
  const qc = useQueryClient();
  const reset = useCalendarStore((s) => s.reset);

  return useMutation({
    mutationFn: disconnectCalendarApi,
    onSuccess: () => {
      reset();
      qc.invalidateQueries({ queryKey: ["calendar-status"] });
    },
  });
}
