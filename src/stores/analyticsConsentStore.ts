import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { optIn, optOut } from "@/lib/analytics";

const KEY = "analytics_consent"; // "accepted" | "rejected" | null (not asked)

interface AnalyticsConsentState {
  consent: "accepted" | "rejected" | null; // null = not yet asked
  initialized: boolean;
  initialize: () => Promise<void>;
  accept: () => Promise<void>;
  reject: () => Promise<void>;
}

async function getValue(): Promise<string | null> {
  if (Platform.OS === "web") return localStorage.getItem(KEY);
  return SecureStore.getItemAsync(KEY);
}

async function setValue(v: string): Promise<void> {
  if (Platform.OS === "web") { localStorage.setItem(KEY, v); return; }
  await SecureStore.setItemAsync(KEY, v);
}

export const useAnalyticsConsent = create<AnalyticsConsentState>((set) => ({
  consent: null,
  initialized: false,

  initialize: async () => {
    const stored = await getValue();
    if (stored === "accepted") {
      optIn();
      set({ consent: "accepted", initialized: true });
    } else if (stored === "rejected") {
      optOut();
      set({ consent: "rejected", initialized: true });
    } else {
      set({ consent: null, initialized: true });
    }
  },

  accept: async () => {
    await setValue("accepted");
    optIn();
    set({ consent: "accepted" });
  },

  reject: async () => {
    await setValue("rejected");
    optOut();
    set({ consent: "rejected" });
  },
}));
