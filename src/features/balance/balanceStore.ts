import { create } from "zustand";
import type { Layer } from "@/features/overview/types";

export type DesiredBalance = Record<Layer, number>; // values sum to 100

interface BalanceState {
  desired: DesiredBalance;
  setDesired: (d: DesiredBalance) => void;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  desired: { family: 35, work: 45, personal: 20 },
  setDesired: (desired) => set({ desired }),
}));
