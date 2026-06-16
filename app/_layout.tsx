import { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider, type Persister } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import "../global.css";
import "@/i18n";
import { queryClient } from "@/lib/queryClient";
import { useMascotStore } from "@/features/mascot/mascotStore";
import { useAuthStore } from "@/stores/authStore";
import { useCelebrationSettings } from "@/stores/celebrationSettingsStore";
import { useLanguageStore } from "@/features/settings/languageStore";
import { useHolidayStore } from "@/features/settings/holidayStore";

// NativeWind web requires darkMode to be set to 'class' at runtime
if (typeof StyleSheet.setFlag === "function") {
  StyleSheet.setFlag("darkMode", "class");
}

// Persist cache to localStorage on web, skip on native (SecureStore is already persistent)
const persister: Persister | null = Platform.OS === "web"
  ? createSyncStoragePersister({ storage: typeof window !== "undefined" ? window.localStorage : undefined })
  : null;

function AppShell() {
  const initializeMascot       = useMascotStore((s) => s.initialize);
  const initializeAuth         = useAuthStore((s) => s.initialize);
  const initializeCelebration  = useCelebrationSettings((s) => s.initialize);
  const initializeLanguage     = useLanguageStore((s) => s.initialize);
  const initializeHolidays     = useHolidayStore((s) => s.initialize);
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
        initializeHolidays(),
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

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
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
