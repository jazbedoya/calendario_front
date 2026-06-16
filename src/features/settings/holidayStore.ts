import { create } from "zustand";
import { secureStore } from "@/lib/secure-store";
import type { HolidayCountry } from "@/features/overview/getHolidays";

const COUNTRY_KEY = "holiday_country";

interface HolidayStoreState {
  country: HolidayCountry;
  setCountry: (c: HolidayCountry) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useHolidayStore = create<HolidayStoreState>((set) => ({
  country: "ES",

  setCountry: async (c) => {
    set({ country: c });
    await secureStore.set(COUNTRY_KEY, c);
  },

  initialize: async () => {
    const stored = await secureStore.get(COUNTRY_KEY);
    if (stored === "ES" || stored === "PY") {
      set({ country: stored as HolidayCountry });
    }
  },
}));
