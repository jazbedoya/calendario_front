import { secureStore } from "@/lib/secure-store";
import { format, subDays } from "date-fns";

const KEY_STREAK = "task_streak";
const KEY_LAST   = "task_last_complete";

/**
 * Lee la racha local guardada en SecureStore.
 * Devuelve 0 si no existe o si la última fecha no es hoy ni ayer
 * (racha rota por más de un día sin completar tareas).
 */
export async function getLocalStreak(): Promise<number> {
  const [streakRaw, last] = await Promise.all([
    secureStore.get(KEY_STREAK),
    secureStore.get(KEY_LAST),
  ]);
  if (!last || !streakRaw) return 0;
  const today     = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  if (last !== today && last !== yesterday) return 0;
  return parseInt(streakRaw, 10);
}

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
