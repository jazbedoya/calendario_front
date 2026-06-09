import { create } from "zustand";
import { secureStore } from "@/lib/secure-store";
import { patchMeApi } from "@/features/auth/api";

const KEY_MASCOT_NAME = "mascot_name";
const KEY_ONBOARDING_DONE = "onboarding_done";

interface MascotStore {
  mascotName: string;
  onboardingDone: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  setMascotName: (name: string) => Promise<void>;
  syncMascotName: (name: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useMascotStore = create<MascotStore>((set) => ({
  mascotName: "Tuga",
  onboardingDone: false,
  initialized: false,

  initialize: async () => {
    const [name, done] = await Promise.all([
      secureStore.get(KEY_MASCOT_NAME),
      secureStore.get(KEY_ONBOARDING_DONE),
    ]);
    set({
      mascotName: name ?? "Tuga",
      onboardingDone: done === "true",
      initialized: true,
    });
  },

  setMascotName: async (name: string) => {
    await secureStore.set(KEY_MASCOT_NAME, name);
    set({ mascotName: name });
    // Sync to backend; failure is silent to not block the UX
    patchMeApi({ mascot_name: name }).catch(() => {});
  },

  syncMascotName: async (name: string) => {
    await secureStore.set(KEY_MASCOT_NAME, name);
    set({ mascotName: name });
  },

  completeOnboarding: async () => {
    await secureStore.set(KEY_ONBOARDING_DONE, "true");
    set({ onboardingDone: true });
  },
}));
