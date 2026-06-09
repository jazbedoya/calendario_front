import { create } from "zustand";
import { secureStore } from "@/lib/secure-store";
import i18n, { type SupportedLanguage, SUPPORTED_LANGUAGES } from "@/i18n";
import { patchMeApi } from "@/features/auth/api";
import { useAuthStore } from "@/stores/authStore";

const LANGUAGE_KEY = "app_language";

function isSupported(lang: string | null | undefined): lang is SupportedLanguage {
  return !!lang && (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  initialize: (serverLanguage?: string) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: "es",

  setLanguage: async (lang) => {
    set({ language: lang });
    await i18n.changeLanguage(lang);
    await secureStore.set(LANGUAGE_KEY, lang);
    // Sync to backend if authenticated
    if (useAuthStore.getState().isAuthenticated) {
      try {
        await patchMeApi({ language: lang });
      } catch {
        // Non-critical: local change persisted anyway
      }
    }
  },

  initialize: async (serverLanguage?: string) => {
    // Priority: backend language > SecureStore > default "es"
    const stored = await secureStore.get(LANGUAGE_KEY);
    const lang: SupportedLanguage = isSupported(serverLanguage)
      ? serverLanguage
      : isSupported(stored)
        ? stored
        : "es";
    set({ language: lang });
    await i18n.changeLanguage(lang);
    await secureStore.set(LANGUAGE_KEY, lang);
  },
}));
