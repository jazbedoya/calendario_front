import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export interface UpcomingEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  layer: "family" | "work" | "personal";
  is_all_day: boolean;
}

export interface HomeSummary {
  upcoming_events: UpcomingEvent[];
  week_events_by_layer: { family: number; work: number; personal: number };
  today_tasks_pending: number;
}

export function useHomeSummary() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<HomeSummary>({
    queryKey: ["home-summary"],
    queryFn: async () => {
      const { data } = await apiClient.get("/home/summary");
      return data as HomeSummary;
    },
    staleTime: 0,
    enabled: isAuthenticated,
  });
}
