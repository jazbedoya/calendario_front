import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { TugaAnimation, MOOD_TO_STATE } from "@/features/mascot/TugaAnimation";
import type { MascotMood } from "@/features/mascot/getMascotState";
import { colors, spacing, radius, fontSize, fontWeight, shadows } from "@/theme";
import type { AreaKey } from "@/theme";

interface WeekProgress {
  family: number;
  work: number;
  personal: number;
}

interface TugaCardProps {
  name: string;
  mood: MascotMood;
  message: string;
  weekProgress: WeekProgress;
  totalEvents: number;
}

const AREA_META: { key: AreaKey; label: string; color: string }[] = [
  { key: "family",   label: "home.area.familyLabel",   color: colors.family },
  { key: "work",     label: "home.area.workLabel",     color: colors.work },
  { key: "personal", label: "home.area.personalLabel", color: colors.personal },
];

export function TugaCard({ name, mood, message, weekProgress, totalEvents }: TugaCardProps) {
  const { t } = useTranslation();
  const maxEvents = Math.max(weekProgress.family, weekProgress.work, weekProgress.personal, 1);

  return (
    <View style={[s.card, shadows.card]}>
      {/* Top row: Tuga + message bubble */}
      <View style={s.topRow}>
        <View style={s.tugaFrame}>
          <TugaAnimation state={MOOD_TO_STATE[mood]} size={72} />
        </View>
        <View style={s.bubble}>
          <Text style={s.bubbleLabel}>
            {name.toUpperCase()}  ·  {t("home.tuga.status")}
          </Text>
          <Text style={s.bubbleMsg}>{message}</Text>
        </View>
      </View>

      {/* Weekly progress bars */}
      <View style={s.progressSection}>
        <Text style={s.progressTitle}>{t("home.tuga.weekTitle")}</Text>
        {AREA_META.map(({ key, color }) => {
          const count = weekProgress[key];
          const pct = maxEvents > 0 ? (count / maxEvents) * 100 : 0;
          return (
            <View key={key} style={s.barRow}>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${Math.max(pct, 4)}%`, backgroundColor: color }]} />
              </View>
              <View style={[s.barDot, { backgroundColor: color }]} />
            </View>
          );
        })}
        <Text style={s.progressCaption}>
          {t("home.tuga.weekCaption", { count: totalEvents })}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  tugaFrame: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bubble: {
    flex: 1,
  },
  bubbleLabel: {
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semibold,
    color: colors.textFaint,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  bubbleMsg: {
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.ink,
    lineHeight: 20,
  },
  progressSection: {
    gap: 6,
  },
  progressTitle: {
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semibold,
    color: colors.textFaint,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceWarm,
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  barDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressCaption: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
});
