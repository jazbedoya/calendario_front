import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LifeAreaSummary } from "../types";
import { colors, spacing, radius, fontSize, fontWeight, shadows } from "@/theme";

interface LifeAreaCardProps {
  area: LifeAreaSummary;
  eventCount: number;
  onPress: () => void;
}

export function LifeAreaCard({ area, eventCount, onPress }: LifeAreaCardProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[s.card, shadows.card]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={area.title}
    >
      {/* Icon chip with area color */}
      <View style={[s.iconChip, { backgroundColor: area.color }]}>
        <Ionicons
          name={area.iconName as keyof typeof Ionicons.glyphMap}
          size={20}
          color={colors.white}
        />
      </View>

      {/* Text block */}
      <View style={s.textBlock}>
        <Text style={s.title}>{area.title}</Text>
        <Text style={s.subtitle}>{area.subtitle}</Text>
      </View>

      {/* Event count + arrow */}
      <View style={s.rightBlock}>
        <Text style={[s.count, { color: area.color }]}>{eventCount}</Text>
        <Text style={s.countLabel}>{t("home.area.events")}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  rightBlock: {
    alignItems: "center",
  },
  count: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
  },
  countLabel: {
    fontSize: fontSize.micro,
    color: colors.textMuted,
    marginTop: -2,
  },
});
