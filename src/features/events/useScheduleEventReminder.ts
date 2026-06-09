/**
 * Recordatorios locales de eventos — 15 minutos antes.
 * Persiste el notificationId en SecureStore para poder cancelarlo.
 */
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CHANNEL_ID = "event-reminders";

function storageKey(eventId: string) {
  return `event_reminder_${eventId}`;
}

async function ensureChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Recordatorios de eventos",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function scheduleEventReminder(
  eventId: string,
  title: string,
  startAt: string,
): Promise<string | null> {
  try {
    await ensureChannel();
    const start = new Date(startAt);
    const trigger = new Date(start.getTime() - 15 * 60 * 1000);

    if (trigger <= new Date()) return null; // evento en el pasado

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ En 15 minutos",
        body: title,
        data: { eventId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
      identifier: `event_${eventId}`,
    });

    await SecureStore.setItemAsync(storageKey(eventId), notifId);
    return notifId;
  } catch {
    return null;
  }
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  try {
    const notifId = await SecureStore.getItemAsync(storageKey(eventId));
    if (notifId) {
      await Notifications.cancelScheduledNotificationAsync(notifId);
      await SecureStore.deleteItemAsync(storageKey(eventId));
    }
  } catch {
    // ignorar errores de cancelación
  }
}
