import { View, ScrollView, StyleSheet, Platform, RefreshControl } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Greeting } from "@/features/home/components/Greeting";
import { TugaCard } from "@/features/home/components/TugaCard";
import { LifeAreaCard } from "@/features/home/components/LifeAreaCard";
import { TasksSummaryCard } from "@/features/home/components/TasksSummaryCard";
import { NextEventCard } from "@/features/home/components/NextEventCard";
import { mockHomeData } from "@/features/home/mockData";
import { getHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { TugaAnimation } from "@/features/mascot/TugaAnimation";
import { getMascotState } from "@/features/mascot/getMascotState";
import { useMascotMessage } from "@/features/mascot/useMascotMessage";
import { useMascotStore } from "@/features/mascot/mascotStore";
import { useAuthStore } from "@/stores/authStore";
import { useHomeSummary } from "@/features/home/useHomeSummary";
import { colors, spacing } from "@/theme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { areas } = mockHomeData;
  const { mascotName, onboardingDone, initialized } = useMascotStore();
  const user = useAuthStore((s) => s.user);
  const timezone = user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour = getHours(toZonedTime(new Date(), deviceTz));
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

  const weekEvents = summary?.week_events_by_layer ?? { family: 0, work: 0, personal: 0 };
  const totalWeekEvents = weekEvents.family + weekEvents.work + weekEvents.personal;

  // Area subtitles — must be above early returns (Rules of Hooks)
  const areasWithData = useMemo(() => areas.map((area) => {
    if (!summary?.week_events_by_layer) return { ...area, subtitle: "", count: 0 };
    const count = summary.week_events_by_layer[area.layer as keyof typeof summary.week_events_by_layer] ?? 0;
    let subtitle: string;
    if (area.layer === "family") {
      subtitle = count === 0 ? t("home.area.family.none") : count === 1 ? t("home.area.family.one") : t("home.area.family.other", { count });
    } else if (area.layer === "work") {
      subtitle = count === 0 ? t("home.area.work.none") : count >= 5 ? t("home.area.work.intense", { count }) : t("home.area.work.calm", { count });
    } else {
      subtitle = count === 0 ? t("home.area.personal.none") : count === 1 ? t("home.area.personal.one") : t("home.area.personal.other", { count });
    }
    return { ...area, subtitle, count };
  }), [areas, summary, t]);

  if (!initialized) return (
    <View style={s.loading}>
      <TugaAnimation state="idle" size={80} />
    </View>
  );
  if (!onboardingDone) return <Redirect href="/onboarding" />;

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.terracotta]}
            tintColor={colors.terracotta}
          />
        }
      >
        <Greeting userName={user?.full_name?.split(" ")[0] ?? "tú"} />

        {/* Tuga card with weekly progress */}
        <View style={s.section}>
          <TugaCard
            name={mascotName}
            mood={mascotState.mood}
            message={mascotMessage}
            weekProgress={weekEvents}
            totalEvents={totalWeekEvents}
          />
        </View>

        {/* Area cards */}
        <View style={s.section}>
          {areasWithData.map((area) => (
            <LifeAreaCard
              key={area.layer}
              area={area}
              eventCount={area.count}
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

        {/* Next event */}
        <View style={s.section}>
          <NextEventCard
            events={summary?.upcoming_events ?? []}
            timezone={timezone}
          />
        </View>

        {/* Tasks summary */}
        <View style={s.section}>
          <TasksSummaryCard
            pendingCount={summary?.today_tasks_pending ?? 0}
            totalCount={(summary?.today_tasks_pending ?? 0) + 1}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: 120 },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  section: { paddingHorizontal: spacing.screenX, gap: 10, marginBottom: 16 },
});
