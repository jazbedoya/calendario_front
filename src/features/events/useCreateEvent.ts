import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fromZonedTime } from "date-fns-tz";
import { apiClient } from "@/lib/api";
import { useEventsStore } from "./eventsStore";
import type { CalendarEvent, Layer } from "@/features/overview/types";
import { enqueue, dequeue } from "@/lib/mutationQueue";

export interface CreateEventInput {
  title: string;
  date: string;     // 'yyyy-MM-dd'
  hour: number;
  minute: number;
  timezone: string;
  layer: Layer;
  recurrenceRule?: 'daily' | 'weekly' | 'monthly';
}

function buildDates(input: CreateEventInput) {
  const startStr = `${input.date}T${String(input.hour).padStart(2, "0")}:${String(input.minute).padStart(2, "0")}:00`;
  const endHour  = (input.hour + 1) % 24;
  const endStr   = `${input.date}T${String(endHour).padStart(2, "0")}:${String(input.minute).padStart(2, "0")}:00`;
  const startAt  = fromZonedTime(startStr, input.timezone).toISOString();
  const endAt    = fromZonedTime(endStr,   input.timezone).toISOString();
  return { startAt, endAt };
}

export function useCreateEvent() {
  const addEvent = useEventsStore((s) => s.addEvent);
  const qc       = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEventInput): Promise<CalendarEvent> => {
      const { startAt, endAt } = buildDates(input);
      const payload = {
        title:           input.title,
        start_at:        startAt,
        end_at:          endAt,
        is_all_day:      false,
        layer:           input.layer,
        recurrence_rule: input.recurrenceRule ?? null,
      };
      const _id = await enqueue({ type: "create-event", ...payload });
      const { data } = await apiClient.post("/events", payload);
      await dequeue(_id);
      // Mapear respuesta snake_case → camelCase
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
      addEvent(event);
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["home-summary"] });
      import("./useScheduleEventReminder").then(({ scheduleEventReminder }) => {
        scheduleEventReminder(event.id, event.title, event.startAt).catch(() => {});
      });
    },

    onError: (_err, _input) => {
      // API call failed — do not add a local-only event; let the user retry
    },
  });
}
