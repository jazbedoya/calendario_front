/**
 * Write-Ahead Log (WAL) para mutaciones de tareas.
 *
 * Flujo:
 *   1. Antes de llamar a la API → enqueue()     → escribe en AsyncStorage
 *   2. API llama success         → dequeue(_id)  → borra de AsyncStorage
 *   3. Al arrancar la app        → replayQueue() → reintenta las pendientes
 *
 * Esto garantiza que las tareas sobreviven reinicios de la app (Expo Go,
 * Metro hot-reloads, cierre forzoso) incluso si la llamada API no llegó
 * a completarse.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createTaskApi, patchTaskApi, deleteTaskApi } from "@/features/tasks/api";

const QUEUE_KEY = "avante_pending_task_mutations";

export type PendingMutation =
  | { _id: string; type: "create"; date: string; text: string }
  | { _id: string; type: "toggle"; id: string; done: boolean }
  | { _id: string; type: "delete"; id: string };

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function readQueue(): Promise<PendingMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingMutation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* ignore write errors — best effort */ }
}

/** Encola una mutación antes de llamar a la API. Devuelve su _id. */
export async function enqueue(m: Omit<PendingMutation, "_id">): Promise<string> {
  const _id = makeId();
  const queue = await readQueue();
  queue.push({ ...m, _id } as PendingMutation);
  await writeQueue(queue);
  return _id;
}

/** Elimina una mutación de la cola tras éxito de la API. */
export async function dequeue(_id: string): Promise<void> {
  const queue = await readQueue();
  await writeQueue(queue.filter((m) => m._id !== _id));
}

/**
 * Replaya todas las mutaciones pendientes contra la API.
 * Llamar una vez al arrancar la app, después de que el usuario esté autenticado.
 * Devuelve true si se replayó al menos una mutación (para invalidar queries).
 */
export async function replayQueue(): Promise<boolean> {
  const queue = await readQueue();
  if (queue.length === 0) return false;

  let anyReplayed = false;

  for (const m of queue) {
    try {
      if (m.type === "create") {
        await createTaskApi(m.date, m.text);
      } else if (m.type === "toggle") {
        if (!m.id.startsWith("local-")) {
          await patchTaskApi(m.id, { done: m.done });
        }
      } else if (m.type === "delete") {
        if (!m.id.startsWith("local-")) {
          await deleteTaskApi(m.id);
        }
      }
      await dequeue(m._id);
      anyReplayed = true;
    } catch {
      // Deja en la cola — se reintentará en el próximo arranque
    }
  }

  return anyReplayed;
}
