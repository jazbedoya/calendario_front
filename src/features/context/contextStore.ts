import { create } from "zustand";

export interface DayContext {
  date: string;         // "yyyy-MM-dd"
  energyLevel: number; // 1–10
  mood: number;        // 1–10
  notes?: string;
}

interface ContextState {
  entries: DayContext[];
  /** Añade o actualiza el registro de un día concreto */
  logDay: (entry: DayContext) => void;
}

// TODO Sprint siguiente: reemplazar con TanStack Query → GET /context?start=&end=
const mockContextEntries: DayContext[] = [
  // Mayo 2026
  { date: "2026-05-04", energyLevel: 8, mood: 8 },
  { date: "2026-05-05", energyLevel: 7, mood: 7 },
  { date: "2026-05-06", energyLevel: 5, mood: 6 },
  { date: "2026-05-07", energyLevel: 2, mood: 3, notes: "Reunión larga, agotada" },
  { date: "2026-05-11", energyLevel: 7, mood: 8 },
  { date: "2026-05-12", energyLevel: 9, mood: 9 },
  { date: "2026-05-13", energyLevel: 8, mood: 7 },
  { date: "2026-05-14", energyLevel: 2, mood: 3, notes: "Martes muy pesado" },
  { date: "2026-05-18", energyLevel: 6, mood: 6 },
  { date: "2026-05-19", energyLevel: 4, mood: 5 },
  { date: "2026-05-20", energyLevel: 3, mood: 4 },
  { date: "2026-05-21", energyLevel: 3, mood: 4, notes: "Otro martes complicado" },
  { date: "2026-05-25", energyLevel: 6, mood: 6 },
  { date: "2026-05-26", energyLevel: 4, mood: 5 },
  { date: "2026-05-27", energyLevel: 8, mood: 8 },
  { date: "2026-05-28", energyLevel: 9, mood: 9 },
  // Junio 2026
  { date: "2026-06-01", energyLevel: 4, mood: 5 },
  { date: "2026-06-02", energyLevel: 7, mood: 7 },
  { date: "2026-06-03", energyLevel: 2, mood: 3, notes: "Conflicto trabajo/familia" },
  { date: "2026-06-04", energyLevel: 8, mood: 8 },
  { date: "2026-06-05", energyLevel: 2, mood: 3, notes: "Día de infarto" },
  { date: "2026-06-08", energyLevel: 7, mood: 7 },
  { date: "2026-06-09", energyLevel: 6, mood: 6 },
  { date: "2026-06-10", energyLevel: 4, mood: 5 },
  { date: "2026-06-11", energyLevel: 9, mood: 9 },
  { date: "2026-06-15", energyLevel: 3, mood: 4 },
  { date: "2026-06-17", energyLevel: 5, mood: 5 },
  { date: "2026-06-18", energyLevel: 4, mood: 5 },
];

export const useContextStore = create<ContextState>((set) => ({
  entries: mockContextEntries,
  logDay: (entry) =>
    set((s) => {
      const exists = s.entries.some((e) => e.date === entry.date);
      return {
        entries: exists
          ? s.entries.map((e) => (e.date === entry.date ? entry : e))
          : [...s.entries, entry],
      };
    }),
}));
