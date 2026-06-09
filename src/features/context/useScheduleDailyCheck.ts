import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import i18n from "@/i18n";

export const DAY_CHECK_NOTIF_ID_KEY = "day_check";

/** Identificador que ponemos en el data payload para reconocer la notificación */
export const DAY_CHECK_DATA_TYPE = "day_check";

/** Hora a la que se lanza la notificación cada día (21:00) */
const NOTIFY_HOUR   = 21;
const NOTIFY_MINUTE = 0;

/**
 * Pide permisos y programa la notificación diaria "¿Cómo estuvo tu día?".
 * Solo funciona en dispositivos nativos; en web se omite silenciosamente.
 */
export function useScheduleDailyCheck() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    scheduleDailyCheck();
  }, []);
}

/**
 * Dispara la notificación de prueba en 3 segundos.
 * Útil durante el desarrollo para no esperar a las 21:00.
 */
export async function triggerTestNotification() {
  if (Platform.OS === "web") return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge:  false,
      shouldShowBanner: true,
      shouldShowList:   true,
    }),
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t("notifications.dailyCheck.title"),
      body:  i18n.t("notifications.dailyCheck.body"),
      data:  { type: DAY_CHECK_DATA_TYPE },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
    },
  });
}

export async function scheduleDailyCheck() {
  // 1. Pedir permisos
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  // 2. Configurar cómo se muestran las notifs mientras la app está en primer plano
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge:  false,
      shouldShowBanner: true,
      shouldShowList:   true,
    }),
  });

  // 3. Cancelar las anteriores del mismo tipo para evitar duplicados
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type === DAY_CHECK_DATA_TYPE) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  // 4. Programar la nueva notificación repetida diariamente
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t("notifications.dailyCheck.title"),
      body:  i18n.t("notifications.dailyCheck.body"),
      data:  { type: DAY_CHECK_DATA_TYPE },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour:   NOTIFY_HOUR,
      minute: NOTIFY_MINUTE,
    },
  });
}
