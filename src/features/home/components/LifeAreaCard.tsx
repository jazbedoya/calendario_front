import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LifeAreaSummary } from "../types";
import { colors, areaColors, spacing, radius, fontSize, fontWeight, areaShadows } from "@/theme";
import type { AreaKey } from "@/theme";

interface LifeAreaCardProps {
  area: LifeAreaSummary;
  eventCount: number;
  countLabel: string;
  onPress: () => void;
}

export function LifeAreaCard({ area, eventCount, countLabel, onPress }: LifeAreaCardProps) {
  const areaKey = area.layer as AreaKey;
  const ac = areaColors[areaKey];

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: ac.tint }]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={area.title}
    >
      {/* Icon chip with gradient-like solid color + tinted shadow */}
      <View style={[s.iconChip, { backgroundColor: ac.base }, areaShadows[areaKey]]}>
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

      {/* Event count + label */}
      <View style={s.rightBlock}>
        <Text style={[s.count, { color: ac.deep }]}>{eventCount}</Text>
        <Text style={[s.countLabel, { color: ac.deep }]}>{countLabel}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={ac.base} style={{ opacity: 0.5 }} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.card,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
  },
  iconChip: {
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightBlock: {
    alignItems: "flex-end",
  },
  count: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
  },
  countLabel: {
    fontSize: fontSize.micro,
    marginTop: -2,
  },
});
