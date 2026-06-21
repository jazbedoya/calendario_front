/**
 * Avante Design Tokens — Shadows
 * Source: design/avante-tokens.css
 *
 * React Native shadow format (iOS + Android elevation)
 */
import type { ViewStyle } from "react-native";

export const shadows: Record<string, ViewStyle> = {
  soft: {
    shadowColor: "#1E2A4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  card: {
    shadowColor: "#1E2A4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 22,
    elevation: 3,
  },
  hero: {
    shadowColor: "#1E2A4A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 6,
  },
  nav: {
    shadowColor: "#1E2A4A",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
  },
  fab: {
    shadowColor: "#1E2A4A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.36,
    shadowRadius: 24,
    elevation: 10,
  },
};

/** Area-tinted shadows for icon chips */
export const areaShadows = {
  family: {
    shadowColor: "#E08A3E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.34,
    shadowRadius: 14,
    elevation: 4,
  },
  work: {
    shadowColor: "#3D6B5F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 4,
  },
  personal: {
    shadowColor: "#5B5193",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 4,
  },
} as const;
