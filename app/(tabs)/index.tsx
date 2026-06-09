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
import { mockHomeData } from "@/features/home/mockData";
import { Mascot } from "@/features/mascot/Mascot";
import { getMascotState } from "@/features/mascot/getMascotState";
import { useMascotStore } from "@/features/mascot/mascotStore";
import { useAuthStore } from "@/stores/authStore";
import { useHomeSummary } from "@/features/home/useHomeSummary";
import { Colors } from "@/lib/theme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { areas, insights } = mockHomeData;
  const { mascotName, onboardingDone, initialized } = useMascotStore();
  const user = useAuthStore((s) => s.user);
  const mascotState = getMascotState({ hourOfDay: new Date().getHours() });
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

  // Áreas con subtítulos reales si hay datos del servidor
  const areasWithData = areas.map((area) => {
    if (!summary) return area;
    const hrs = summary.week_hours_by_layer[area.layer as keyof typeof summary.week_hours_by_layer];
    return { ...area, subtitle: t("home.area.weekHours", { hours: hrs.toFixed(1) }) };
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
          <Mascot name={mascotName} mood={mascotState.mood} message={t(mascotState.messageKey)} />
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
