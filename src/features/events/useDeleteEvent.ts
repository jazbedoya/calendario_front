import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useEventsStore } from "./eventsStore";
import { enqueue, dequeue } from "@/lib/mutationQueue";

export interface DeleteEventInput {
  id: string;
  deleteMode?: "single" | "all";
}

export function useDeleteEvent() {
  const removeEvent = useEventsStore((s) => s.removeEvent);
  const events      = useEventsStore((s) => s.events);
  const qc          = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, deleteMode = "single" }: DeleteEventInput) => {
      if (!id.startsWith("local-")) {
        const _id = await enqueue({ type: "delete-event", id, delete_mode: deleteMode });
        await apiClient.delete(`/events/${id}?delete_mode=${deleteMode}`);
        await dequeue(_id);
      }
      return { id, deleteMode };
    },
    onSuccess: ({ id, deleteMode }) => {
      if (deleteMode === "all") {
        // Find and remove all events in the same series
        const target = events.find((e) => e.id === id);
        const rootId = target?.recurrenceParentId ?? id;
        events
          .filter((e) => e.id === rootId || e.recurrenceParentId === rootId)
          .forEach((e) => removeEvent(e.id));
      } else {
        removeEvent(id);
      }
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["home-summary"] });
      import("./useScheduleEventReminder").then(({ cancelEventReminder }) => {
        cancelEventReminder(id).catch(() => {});
      });
    },
    onError: (_e, { id }) => removeEvent(id),
  });
}
