export type MascotMood = "happy" | "excited" | "sleepy" | "encouraging" | "balanced";

export interface MascotContext {
  hourOfDay: number;
  minutesUntilNextEvent?: number; // undefined = no upcoming event today
  recentLowEnergyDays?: number;   // days in the last week with energy <= 3
  todayEventCount?: number;
}

export interface MascotState {
  mood: MascotMood;
  messageKey: string;
}

const QUIET_START = 22;
const QUIET_END = 7;

export function getMascotState(ctx: MascotContext): MascotState {
  const {
    hourOfDay,
    minutesUntilNextEvent,
    recentLowEnergyDays = 0,
    todayEventCount = 0,
  } = ctx;

  // 1. Quiet hours (22:00 – 07:00)
  if (hourOfDay >= QUIET_START || hourOfDay < QUIET_END) {
    return { mood: "sleepy", messageKey: "mascot.sleepy" };
  }

  // 2. Upcoming event within 30 minutes
  if (
    minutesUntilNextEvent !== undefined &&
    minutesUntilNextEvent >= 0 &&
    minutesUntilNextEvent <= 30
  ) {
    return { mood: "excited", messageKey: "mascot.excited" };
  }

  // 3. Three or more low-energy days (encouraging, never scolding)
  if (recentLowEnergyDays >= 3) {
    return { mood: "encouraging", messageKey: "mascot.lowEnergy" };
  }

  // 4. Balanced day (2–5 events is a healthy rhythm)
  if (todayEventCount >= 2 && todayEventCount <= 5) {
    return { mood: "balanced", messageKey: "mascot.balanced" };
  }

  // 5. Default happy
  return { mood: "happy", messageKey: "mascot.happy" };
}
