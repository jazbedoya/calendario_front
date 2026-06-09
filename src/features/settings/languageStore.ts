import { create } from "zustand";
import { secureStore } from "@/lib/secure-store";
import i18n, { type SupportedLanguage } from "@/i18n";

const LANGUAGE_KEY = "app_language";

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: "es",

  setLanguage: async (lang) => {
    set({ language: lang });
    await i18n.changeLanguage(lang);
    await secureStore.set(LANGUAGE_KEY, lang);
  },

  initialize: async () => {
    const stored = await secureStore.get(LANGUAGE_KEY);
    const lang = (stored as SupportedLanguage | null) ?? "es";
    set({ language: lang });
    await i18n.changeLanguage(lang);
  },
}));
