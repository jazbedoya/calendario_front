import { useRef } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { getHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useMascotStore } from "@/features/mascot/mascotStore";
import { getMascotState } from "@/features/mascot/getMascotState";
import { TugaAnimation, MOOD_TO_STATE } from "@/features/mascot/TugaAnimation";
import { useHomeSummary } from "@/features/home/useHomeSummary";
import { DailyTasksSection } from "@/features/tasks/DailyTasksSection";
import { StreakBadge } from "@/features/tasks/StreakBadge";
import { colors, spacing, radius, fontSize, fontWeight, shadows } from "@/theme";

// ─── Balance Ring (pure View, no SVG) ────────────────────────────────────────

const RING_SIZE = 200;
const RING_STROKE = 22;
const INNER = RING_SIZE - RING_STROKE * 2;

interface RingProps {
  family: number;
  work: number;
  personal: number;
}

function BalanceRing({ family, work, personal }: RingProps) {
  const total = family + work + personal || 1;
  const familyPct = family / total;
  const workPct = work / total;
  const personalPct = personal / total;

  // Simplified visual: stacked colored arcs using border trick
  // We show 3 concentric partial borders overlapping
  return (
    <View style={rr.container}>
      {/* Background ring */}
      <View style={rr.bgRing} />

      {/* Colored segments as overlapping half-circles */}
      {/* Family segment (orange) - top-right */}
      <View style={[rr.segment, { borderColor: colors.family, borderTopColor: colors.family, borderRightColor: colors.family, borderBottomColor: familyPct > 0.5 ? colors.family : "transparent", borderLeftColor: familyPct > 0.75 ? colors.family : "transparent", transform: [{ rotate: "-90deg" }] }]} />
      {/* Work segment (green) - from family end */}
      <View style={[rr.segment, { borderColor: "transparent", borderTopColor: colors.work, borderRightColor: workPct > 0.25 ? colors.work : "transparent", transform: [{ rotate: `${familyPct * 360 - 90}deg` }] }]} />
      {/* Personal segment (purple) - from work end */}
      <View style={[rr.segment, { borderColor: "transparent", borderTopColor: colors.personal, borderRightColor: personalPct > 0.25 ? colors.personal : "transparent", transform: [{ rotate: `${(familyPct + workPct) * 360 - 90}deg` }] }]} />

      {/* Center white circle with Tuga */}
      <View style={rr.center}>
        <TugaAnimation state="idle" size={80} />
      </View>
    </View>
  );
}

const rr = StyleSheet.create({
  container: {
    width: RING_SIZE, height: RING_SIZE,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center",
  },
  bgRing: {
    position: "absolute",
    width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
    borderColor: colors.surfaceWarm,
  },
  segment: {
    position: "absolute",
    width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
  },
  center: {
    width: INNER, height: INNER,
    borderRadius: INNER / 2,
    backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center",
    ...shadows.soft,
  },
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
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Balance section ── */}
          <Text style={s.screenEyebrow}>{t("balance.eyebrow")}</Text>

          <View style={[s.balanceCard, shadows.card]}>
            {/* Ring with Tuga */}
            <BalanceRing
              family={weekEvents.family}
              work={weekEvents.work}
              personal={weekEvents.personal}
            />

            {/* Title */}
            <Text style={s.balanceTitle}>{t("balance.title")}</Text>
            <Text style={s.balanceSubtitle}>{t("balance.subtitle")}</Text>

            {/* Legend pills */}
            <View style={s.legend}>
              {([
                { key: "family", color: colors.family },
                { key: "work", color: colors.work },
                { key: "personal", color: colors.personal },
              ] as const).map(({ key, color }) => (
                <View key={key} style={s.legendPill}>
                  <View style={[s.legendDot, { backgroundColor: color }]} />
                  <Text style={s.legendLabel}>{t(`layers.${key}`)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Constancia section ── */}
          <View style={[s.streakCard, shadows.card]}>
            <View style={s.streakHeader}>
              <Text style={s.sectionEyebrow}>{t("balance.constancy")}</Text>
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

  screenEyebrow: {
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semibold,
    color: colors.textFaint,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  // ── Balance card ──
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  balanceTitle: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginTop: spacing.md,
  },
  balanceSubtitle: {
    fontSize: fontSize.bodySm,
    fontStyle: "italic",
    color: colors.textMuted,
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  legendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
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
    marginBottom: spacing.sm,
  },
  sectionEyebrow: {
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semibold,
    color: colors.textFaint,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  streakHint: {
    fontSize: fontSize.caption,
    color: colors.terracotta,
    fontWeight: fontWeight.semibold,
  },
});
