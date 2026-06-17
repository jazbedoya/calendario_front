import { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider, type Persister } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import "../global.css";
import "@/i18n";
import { queryClient } from "@/lib/queryClient";
import { useMascotStore } from "@/features/mascot/mascotStore";
import { useAuthStore } from "@/stores/authStore";
import { useCelebrationSettings } from "@/stores/celebrationSettingsStore";
import { useLanguageStore } from "@/features/settings/languageStore";
import { useHolidayStore } from "@/features/settings/holidayStore";
import { replayQueue } from "@/lib/mutationQueue";

// NativeWind web requires darkMode to be set to 'class' at runtime
if (typeof StyleSheet.setFlag === "function") {
  StyleSheet.setFlag("darkMode", "class");
}

// Persist cache: localStorage en web, AsyncStorage en nativo (24h max)
const persister: Persister =
  Platform.OS === "web"
    ? createSyncStoragePersister({ storage: typeof window !== "undefined" ? window.localStorage : undefined })
    : createAsyncStoragePersister({ storage: AsyncStorage, key: "rq-cache" });

function AppShell() {
  const initializeMascot       = useMascotStore((s) => s.initialize);
  const initializeAuth         = useAuthStore((s) => s.initialize);
  const initializeCelebration  = useCelebrationSettings((s) => s.initialize);
  const initializeLanguage     = useLanguageStore((s) => s.initialize);
  const initializeHolidays     = useHolidayStore((s) => s.initialize);
  const isAuthenticated        = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  // Cancela notificaciones de "¿cómo estuvo tu día?" que pudieran haber
  // quedado programadas en el dispositivo desde versiones anteriores.
  useEffect(() => {
    if (Platform.OS === "web") return;
    Notifications.getAllScheduledNotificationsAsync().then((scheduled) => {
      scheduled
        .filter((n) => n.content.data?.type === "day_check")
        .forEach((n) => Notifications.cancelScheduledNotificationAsync(n.identifier));
    });
  }, []);

  useEffect(() => {
    async function init() {
      // Auth first so we can read user.language for the language init
      await initializeAuth();
      const serverLanguage = useAuthStore.getState().user?.language;
      await Promise.all([
        initializeLanguage(serverLanguage),
        initializeMascot(),
        initializeCelebration(),
        initializeHolidays(),
      ]);
    }
    init();
  }, [initializeAuth, initializeMascot, initializeCelebration, initializeLanguage]);

  // Replaya mutaciones pendientes (WAL) al autenticarse
  const replayed = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || replayed.current) return;
    replayed.current = true;
    replayQueue().then((anyReplayed) => {
      if (anyReplayed) {
        qc.invalidateQueries({ queryKey: ["daily-tasks"] });
        qc.invalidateQueries({ queryKey: ["task-streak"] });
        qc.invalidateQueries({ queryKey: ["events"] });
        qc.invalidateQueries({ queryKey: ["home-summary"] });
      }
    });
  }, [isAuthenticated, qc]);

  // Limpiar toda la caché de queries al cerrar sesión (isAuthenticated: true → false)
  const prevIsAuth = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevIsAuth.current === true && !isAuthenticated) {
      qc.clear();
    }
    prevIsAuth.current = isAuthenticated;
  }, [isAuthenticated, qc]);

  // Deep link listener: recibe el callback de Google Calendar OAuth
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      if (url.startsWith("calendario://calendar/")) {
        qc.invalidateQueries({ queryKey: ["calendar-status"] });
      }
    });
    return () => sub.remove();
  }, [qc]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <AppShell />
    </PersistQueryClientProvider>
  );
}
