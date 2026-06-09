import { secureStore } from "@/lib/secure-store";
import { format, subDays } from "date-fns";

const KEY_STREAK = "task_streak";
const KEY_LAST   = "task_last_complete";

/** Returns the updated streak after recording a completion for `today`. */
export async function recordCompletion(today: string): Promise<number> {
  const [streakRaw, last] = await Promise.all([
    secureStore.get(KEY_STREAK),
    secureStore.get(KEY_LAST),
  ]);

  // Already counted today — return current streak without changing
  if (last === today) return parseInt(streakRaw ?? "1", 10);

  const yesterday   = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const newStreak   = last === yesterday ? (parseInt(streakRaw ?? "0", 10) + 1) : 1;

  await Promise.all([
    secureStore.set(KEY_STREAK, String(newStreak)),
    secureStore.set(KEY_LAST,   today),
  ]);

  return newStreak;
}
