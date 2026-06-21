import { useRef } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Svg, Circle } from "react-native-svg";

import { getHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useMascotStore } from "@/features/mascot/mascotStore";
import { getMascotState } from "@/features/mascot/getMascotState";
import { useMascotMessage } from "@/features/mascot/useMascotMessage";
import { useAuthStore } from "@/stores/authStore";
import { useHomeSummary } from "@/features/home/useHomeSummary";
import { DailyTasksSection } from "@/features/tasks/DailyTasksSection";
import { StreakBadge } from "@/features/tasks/StreakBadge";
import { colors, spacing, radius, fontSize, fontWeight, shadows } from "@/theme";

// ─── Balance Ring ────────────────────────────────────────────────────────────

const RING_SIZE = 180;
const STROKE = 18;
const R = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

interface RingProps {
  family: number;
  work: number;
  personal: number;
}

function BalanceRing({ family, work, personal }: RingProps) {
  const total = family + work + personal || 1;
  const segments = [
    { pct: family / total, color: colors.family },
    { pct: work / total, color: colors.work },
    { pct: personal / total, color: colors.personal },
  ];

  let offset = 0;
  return (
    <View style={ring.container}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        {/* Background track */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={R}
          stroke={colors.surfaceWarm}
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Colored segments */}
        {segments.map(({ pct, color }, i) => {
          const dash = pct * CIRCUMFERENCE;
          const gap = CIRCUMFERENCE - dash;
          const el = (
            <Circle
              key={i}
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={R}
              stroke={color}
              strokeWidth={STROKE}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              fill="none"
              rotation={-90}
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          );
          offset += dash;
          return el;
        })}
      </Svg>
    </View>
  );
}

const ring = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
});

// ─── Pantalla ────────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { t } = useTranslation();
  const { mascotName } = useMascotStore();
  const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour = getHours(toZonedTime(new Date(), deviceTz));
  const mascotState = getMascotState({ hourOfDay: localHour });

  const { data: summary } = useHomeSummary();
  const weekEvents = summary?.week_events_by_layer ?? { family: 0, work: 0, personal: 0 };

  const scrollRef = useRef<ScrollView>(null);
  const handleInputFocus = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Balance section ── */}
          <View style={[s.balanceCard, shadows.card]}>
            <Text style={s.eyebrow}>{t("balance.eyebrow")}</Text>

            <BalanceRing
              family={weekEvents.family}
              work={weekEvents.work}
              personal={weekEvents.personal}
            />

            <Text style={s.balanceTitle}>{t("balance.title")}</Text>
            <Text style={s.balanceSubtitle}>{t("balance.subtitle")}</Text>

            {/* Legend */}
            <View style={s.legend}>
              {([
                { key: "family", color: colors.family },
                { key: "work", color: colors.work },
                { key: "personal", color: colors.personal },
              ] as const).map(({ key, color }) => (
                <View key={key} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: color }]} />
                  <Text style={s.legendLabel}>{t(`layers.${key}`)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Constancia section ── */}
          <View style={[s.streakCard, shadows.card]}>
            <View style={s.streakHeader}>
              <Text style={s.eyebrow}>{t("balance.constancy")}</Text>
              <Text style={s.streakHint}>{t("balance.constancyHint")}</Text>
            </View>
            <StreakBadge />
          </View>

          {/* ── Tareas de hoy ── */}
          <DailyTasksSection onInputFocus={handleInputFocus} />

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: spacing.screenX, paddingTop: spacing.lg, gap: spacing.lg },

  // ── Balance card ──
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing["2xl"],
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  eyebrow: {
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semibold,
    color: colors.textFaint,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    alignSelf: "flex-start",
  },
  balanceTitle: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginTop: 8,
  },
  balanceSubtitle: {
    fontSize: fontSize.bodySm,
    color: colors.textMuted,
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: fontSize.label, color: colors.textSecondary, fontWeight: fontWeight.medium },

  // ── Streak card ──
  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  streakHint: {
    fontSize: fontSize.caption,
    color: colors.terracotta,
    fontWeight: fontWeight.semibold,
  },
});
