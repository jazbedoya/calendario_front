/**
 * Avante Design Tokens — Colors
 * Source: design/avante-tokens.css
 */

export const colors = {
  // Surfaces
  bg: "#F8F6F2",
  bgSunken: "#E7E2D8",
  surface: "#FFFFFF",
  surfaceWarm: "#F1ECE3",
  surfaceWarm2: "#ECE6DD",
  hairline: "#F1ECE2",
  border: "#EDE6DA",

  // Text / Ink
  ink: "#1E2A4A",
  textSecondary: "#5A554A",
  textMuted: "#9A9384",
  textFaint: "#B3AB9A",
  textDisabled: "#C0B8A8",

  // Accent
  terracotta: "#C8553D",
  terracottaDeep: "#D2603F",
  terracottaTint: "rgba(200, 85, 61, 0.12)",

  // Life areas
  family: "#E89B53",
  familyDeep: "#D27E2E",
  familyTint: "rgba(232, 155, 83, 0.14)",

  work: "#3D6B5F",
  workDeep: "#345C4F",
  workTint: "rgba(61, 107, 95, 0.14)",

  personal: "#5B5193",
  personalDeep: "#534984",
  personalTint: "rgba(91, 81, 147, 0.14)",

  // Semantic
  white: "#FFFFFF",
  success: "#4CAF50",
} as const;

export type AreaKey = "family" | "work" | "personal";

export const areaColors: Record<AreaKey, { base: string; deep: string; tint: string }> = {
  family:   { base: colors.family,   deep: colors.familyDeep,   tint: colors.familyTint },
  work:     { base: colors.work,     deep: colors.workDeep,     tint: colors.workTint },
  personal: { base: colors.personal, deep: colors.personalDeep, tint: colors.personalTint },
};
