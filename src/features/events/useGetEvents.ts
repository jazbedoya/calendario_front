import { useQuery } from "@tanstack/react-query";
import { endOfMonth, startOfMonth } from "date-fns";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { CalendarEvent } from "@/features/overview/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(d: any): CalendarEvent {
  return {
    id:       String(d.id),
    title:    d.title,
    startAt:  d.start_at,
    endAt:    d.end_at,
    isAllDay: d.is_all_day,
    layer:    d.layer,
    location: d.location ?? undefined,
  };
}

export function useGetEvents(year: number, month: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const start = startOfMonth(new Date(year, month)).toISOString();
  const end   = endOfMonth(new Date(year, month)).toISOString();

  return useQuery({
    queryKey: ["events", year, month],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await apiClient.get<any[]>("/events", { params: { start, end } });
      return data.map(mapEvent);
    },
    staleTime: 300_000,
    enabled: isAuthenticated,
  });
}
