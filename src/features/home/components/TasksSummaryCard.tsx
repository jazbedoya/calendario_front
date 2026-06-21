import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, radius, fontSize, fontWeight, shadows, spacing } from "@/theme";

interface TasksSummaryCardProps {
  pendingCount: number;
  totalCount: number;
}

export function TasksSummaryCard({ pendingCount, totalCount }: TasksSummaryCardProps) {
  const { t } = useTranslation();
  const allDone = totalCount > 0 && pendingCount === 0;

  return (
    <TouchableOpacity
      style={[s.card, shadows.soft]}
      activeOpacity={0.85}
      onPress={() => router.push("/(tabs)/stats")}
      accessibilityRole="button"
      accessibilityLabel={t("home.tasks.label")}
    >
      <View style={[s.icon, allDone ? s.iconDone : s.iconPending]}>
        <Ionicons
          name={allDone ? "checkmark-circle" : "list-outline"}
          size={20}
          color={allDone ? colors.success : colors.terracotta}
        />
      </View>
      <View style={s.textBlock}>
        <Text style={s.title}>{t("home.tasks.title")}</Text>
        <Text style={s.subtitle}>
          {allDone ? t("home.tasks.allDone") : t("home.tasks.pending", { count: pendingCount })}
        </Text>
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
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDone: {
    backgroundColor: "rgba(76, 175, 80, 0.12)",
  },
  iconPending: {
    backgroundColor: colors.terracottaTint,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.semibold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
});
