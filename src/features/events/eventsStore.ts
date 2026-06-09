import { create } from "zustand";
import type { CalendarEvent } from "@/features/overview/types";

interface EventsState {
  events: CalendarEvent[];
  setEvents:   (events: CalendarEvent[]) => void;
  addEvent:    (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  removeEvent: (id: string) => void;
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  setEvents:   (events) => set({ events }),
  addEvent:    (event) => set((s) => ({ events: [...s.events, event] })),
  updateEvent: (event) => set((s) => ({ events: s.events.map((e) => (e.id === event.id ? event : e)) })),
  removeEvent: (id)    => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
}));
