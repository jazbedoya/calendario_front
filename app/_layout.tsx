import { useEffect, useRef, useState } from "react";
import { Stack } from "expo-router";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider, type Persister } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Platform, StyleSheet } from "react-native";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { format } from "date-fns";
import "../global.css";
import "@/i18n";
import { queryClient } from "@/lib/queryClient";
import { useScheduleDailyCheck, DAY_CHECK_DATA_TYPE } from "@/features/context/useScheduleDailyCheck";
import { DayCheckSheet } from "@/features/context/DayCheckSheet";
import { useMascotStore } from "@/features/mascot/mascotStore";
import { useAuthStore } from "@/stores/authStore";
import { useCelebrationSettings } from "@/stores/celebrationSettingsStore";
import { useLanguageStore } from "@/features/settings/languageStore";

// NativeWind web requires darkMode to be set to 'class' at runtime
if (typeof StyleSheet.setFlag === "function") {
  StyleSheet.setFlag("darkMode", "class");
}

// Persist cache to localStorage on web, skip on native (SecureStore is already persistent)
const persister: Persister | null = Platform.OS === "web"
  ? createSyncStoragePersister({ storage: typeof window !== "undefined" ? window.localStorage : undefined })
  : null;

function AppShell() {
  useScheduleDailyCheck();

  const initializeMascot       = useMascotStore((s) => s.initialize);
  const initializeAuth         = useAuthStore((s) => s.initialize);
  const initializeCelebration  = useCelebrationSettings((s) => s.initialize);
  const initializeLanguage     = useLanguageStore((s) => s.initialize);
  const isAuthenticated        = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  useEffect(() => {
    async function init() {
      // Auth first so we can read user.language for the language init
      await initializeAuth();
      const serverLanguage = useAuthStore.getState().user?.language;
      await Promise.all([
        initializeLanguage(serverLanguage),
        initializeMascot(),
        initializeCelebration(),
      ]);
    }
    init();
  }, [initializeAuth, initializeMascot, initializeCelebration, initializeLanguage]);

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

  const [checkSheetOpen, setCheckSheetOpen] = useState(false);
  const [checkDate,      setCheckDate]      = useState(format(new Date(), "yyyy-MM-dd"));
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    // Escuchar cuando el usuario toca la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === DAY_CHECK_DATA_TYPE) {
        setCheckDate(format(new Date(), "yyyy-MM-dd"));
        setCheckSheetOpen(true);
      }
    });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <DayCheckSheet
        visible={checkSheetOpen}
        date={checkDate}
        onClose={() => setCheckSheetOpen(false)}
      />
    </>
  );
}

export default function RootLayout() {
  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
      >
        <AppShell />
      </PersistQueryClientProvider>
    );
  }
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
