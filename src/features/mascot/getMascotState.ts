export type MascotMood    = "happy" | "excited" | "sleepy" | "encouraging" | "balanced";
export type TimeOfDay     = "morning" | "afternoon" | "evening" | "night";

export interface MascotContext {
  hourOfDay: number;
  minutesUntilNextEvent?: number; // undefined = no upcoming event today
  recentLowEnergyDays?: number;   // days in the last week with energy <= 3
  todayEventCount?: number;
}

export interface MascotState {
  mood:       MascotMood;
  messageKey: string;       // i18n key — may point to a string array
}

/** Pure function — testeable. */
export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5  && hour < 12) return "morning";
  if (hour >= 12 && hour < 19) return "afternoon";
  if (hour >= 19 && hour < 22) return "evening";
  return "night"; // 22:00 – 04:59
}

export function getMascotState(ctx: MascotContext): MascotState {
  const {
    hourOfDay,
    minutesUntilNextEvent,
    recentLowEnergyDays = 0,
    todayEventCount = 0,
  } = ctx;

  const timeOfDay = getTimeOfDay(hourOfDay);

  // 1. Noche: la hora manda siempre
  if (timeOfDay === "night") {
    return { mood: "sleepy", messageKey: "mascot.night" };
  }

  // 2. Evento próximo (≤ 30 min)
  if (
    minutesUntilNextEvent !== undefined &&
    minutesUntilNextEvent >= 0 &&
    minutesUntilNextEvent <= 30
  ) {
    return { mood: "excited", messageKey: "mascot.excited" };
  }

  // 3. Varios días de baja energía
  if (recentLowEnergyDays >= 3) {
    return { mood: "encouraging", messageKey: "mascot.lowEnergy" };
  }

  // 4. Día equilibrado (2–5 eventos) — mensaje según franja horaria
  if (todayEventCount >= 2 && todayEventCount <= 5) {
    return { mood: "balanced", messageKey: `mascot.${timeOfDay}` };
  }

  // 5. Estado por defecto: franja horaria
  return { mood: "happy", messageKey: `mascot.${timeOfDay}` };
}
