import { View, ScrollView, StyleSheet, Platform, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Greeting } from "@/features/home/components/Greeting";
import { LifeAreaCard } from "@/features/home/components/LifeAreaCard";
import { InsightCard } from "@/features/home/components/InsightCard";
import { NextEventCard } from "@/features/home/components/NextEventCard";
import { mockHomeData } from "@/features/home/mockData";
import { getHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Mascot } from "@/features/mascot/Mascot";
import { getMascotState } from "@/features/mascot/getMascotState";
import { useMascotMessage } from "@/features/mascot/useMascotMessage";
import { useMascotStore } from "@/features/mascot/mascotStore";
import { useAuthStore } from "@/stores/authStore";
import { useHomeSummary } from "@/features/home/useHomeSummary";
import { Colors } from "@/lib/theme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { areas, insights } = mockHomeData;
  const { mascotName, onboardingDone, initialized } = useMascotStore();
  const user = useAuthStore((s) => s.user);
  const timezone   = user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour  = getHours(toZonedTime(new Date(), timezone));
  const mascotState = getMascotState({ hourOfDay: localHour });
  const mascotMessage = useMascotMessage(mascotState.messageKey);
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: summary } = useHomeSummary();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["home-summary"] });
    setRefreshing(false);
  }, [qc]);

  if (!initialized) return null;
  if (!onboardingDone) return <Redirect href="/onboarding" />;

  // Áreas con subtítulos reales basados en conteo de eventos esta semana
  const areasWithData = areas.map((area) => {
    if (!summary) return area;
    const count = summary.week_events_by_layer[area.layer as keyof typeof summary.week_events_by_layer];
    let subtitle: string;
    if (area.layer === "family") {
      subtitle = count === 0
        ? t("home.area.family.none")
        : count === 1
          ? t("home.area.family.one")
          : t("home.area.family.other", { count });
    } else if (area.layer === "work") {
      subtitle = count === 0
        ? t("home.area.work.none")
        : count >= 5
          ? t("home.area.work.intense", { count })
          : t("home.area.work.calm", { count });
    } else {
      subtitle = count === 0
        ? t("home.area.personal.none")
        : count === 1
          ? t("home.area.personal.one")
          : t("home.area.personal.other", { count });
    }
    return { ...area, subtitle };
  });

  // Insight de tareas pendientes
  const insightsWithData = insights.map((ins) => {
    if (ins.id === "focus" && summary) {
      const n = summary.today_tasks_pending;
      return { ...ins, text: n === 0 ? t("home.insight.tasksUpToDate") : t("home.insight.tasksPending", { count: n }) };
    }
    return ins;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <Greeting userName={user?.full_name?.split(" ")[0] ?? "tú"} />

        <View style={styles.mascotSection}>
          <Mascot name={mascotName} mood={mascotState.mood} message={mascotMessage} />
        </View>

        <View style={styles.areaCards}>
          {areasWithData.map((area) => (
            <LifeAreaCard
              key={area.layer}
              area={area}
              onPress={() => {
                if (Platform.OS === "web") {
                  window.location.href = area.route;
                } else {
                  router.push(area.route as any);
                }
              }}
            />
          ))}
        </View>

        <View style={styles.insightRow}>
          {insightsWithData.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
          <NextEventCard
            events={summary?.upcoming_events ?? []}
            timezone={timezone}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll:    { flex: 1 },
  content:   { paddingBottom: 120 },
  mascotSection: { marginTop: 8, marginBottom: 4 },
  areaCards: { paddingHorizontal: 20, gap: 12 },
  insightRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 28, gap: 12 },
});
