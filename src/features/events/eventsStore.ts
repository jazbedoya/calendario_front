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
  setEvents: (fetched) => set((s) => {
    // Merge: keep recently-added events (< 5s old) that the backend hasn't returned yet
    const fetchedIds = new Set(fetched.map((e) => e.id));
    const recent = s.events.filter((e) => !fetchedIds.has(e.id));
    return { events: [...fetched, ...recent] };
  }),
  addEvent:    (event) => set((s) => {
    // Dedupe: don't add if already exists
    if (s.events.some((e) => e.id === event.id)) return s;
    return { events: [...s.events, event] };
  }),
  updateEvent: (event) => set((s) => ({ events: s.events.map((e) => (e.id === event.id ? event : e)) })),
  removeEvent: (id)    => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
}));
