import { create } from "zustand";
import { secureStore } from "@/lib/secure-store";

interface CelebrationSettings {
  hapticsEnabled: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  setHapticsEnabled: (v: boolean) => Promise<void>;
}

export const useCelebrationSettings = create<CelebrationSettings>((set) => ({
  hapticsEnabled: true,
  initialized: false,

  initialize: async () => {
    const h = await secureStore.get("celebration_haptics");
    set({ hapticsEnabled: h !== "false", initialized: true });
  },

  setHapticsEnabled: async (v: boolean) => {
    await secureStore.set("celebration_haptics", String(v));
    set({ hapticsEnabled: v });
  },
}));
