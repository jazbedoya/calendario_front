import { create } from "zustand";

interface CalendarState {
  connected: boolean;
  googleEmail: string | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  isConnecting: boolean;
  setStatus: (s: { connected: boolean; googleEmail: string | null; lastSyncedAt: string | null }) => void;
  setSyncing: (v: boolean) => void;
  setConnecting: (v: boolean) => void;
  reset: () => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  connected: false,
  googleEmail: null,
  lastSyncedAt: null,
  isSyncing: false,
  isConnecting: false,

  setStatus: ({ connected, googleEmail, lastSyncedAt }) =>
    set({ connected, googleEmail, lastSyncedAt }),

  setSyncing: (v) => set({ isSyncing: v }),
  setConnecting: (v) => set({ isConnecting: v }),

  reset: () =>
    set({ connected: false, googleEmail: null, lastSyncedAt: null, isSyncing: false, isConnecting: false }),
}));
