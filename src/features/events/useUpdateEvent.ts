import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fromZonedTime } from "date-fns-tz";
import { apiClient } from "@/lib/api";
import { useEventsStore } from "./eventsStore";
import type { CalendarEvent, Layer } from "@/features/overview/types";

export interface UpdateEventInput {
  id:       string;
  title:    string;
  date:     string;   // 'yyyy-MM-dd'
  hour:     number;
  minute:   number;
  timezone: string;
  layer:    Layer;
}

function buildDates(input: UpdateEventInput) {
  const hh = String(input.hour).padStart(2, "0");
  const mm = String(input.minute).padStart(2, "0");
  const eh = String((input.hour + 1) % 24).padStart(2, "0");
  return {
    startAt: fromZonedTime(`${input.date}T${hh}:${mm}:00`, input.timezone).toISOString(),
    endAt:   fromZonedTime(`${input.date}T${eh}:${mm}:00`, input.timezone).toISOString(),
  };
}

export function useUpdateEvent() {
  const updateEvent = useEventsStore((s) => s.updateEvent);
  const qc          = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateEventInput): Promise<CalendarEvent> => {
      const { startAt, endAt } = buildDates(input);
      const { data } = await apiClient.put(`/events/${input.id}`, {
        title: input.title, start_at: startAt, end_at: endAt, layer: input.layer,
      });
      return {
        id:                 data.id,
        title:              data.title,
        startAt:            data.start_at,
        endAt:              data.end_at,
        isAllDay:           data.is_all_day,
        layer:              data.layer,
        location:           data.location ?? undefined,
        description:        data.description ?? undefined,
        recurrenceRule:     data.recurrence_rule ?? undefined,
        recurrenceParentId: data.recurrence_parent_id ?? undefined,
      };
    },

    onSuccess: (event) => {
      updateEvent(event);
      qc.invalidateQueries({ queryKey: ["events"] });
      import("./useScheduleEventReminder").then(({ cancelEventReminder, scheduleEventReminder }) => {
        cancelEventReminder(event.id)
          .then(() => scheduleEventReminder(event.id, event.title, event.startAt))
          .catch(() => {});
      });
    },

    onError: (_e, input) => {
      const { startAt, endAt } = buildDates(input);
      updateEvent({ id: input.id, title: input.title, startAt, endAt, isAllDay: false, layer: input.layer });
    },
  });
}
