import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors, radius, fontSize, fontWeight, spacing } from "@/theme";

interface Props {
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export function AnalyticsConsentSheet({ visible, onAccept, onReject }: Props) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={s.iconRow}>
            <Ionicons name="analytics-outline" size={28} color={colors.terracotta} />
          </View>
          <Text style={s.title}>{t("consent.title")}</Text>
          <Text style={s.body}>{t("consent.body")}</Text>

          <TouchableOpacity style={s.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
            <Text style={s.acceptText}>{t("consent.accept")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.rejectBtn} onPress={onReject} activeOpacity={0.7}>
            <Text style={s.rejectText}>{t("consent.reject")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing["2xl"],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing["2xl"],
    width: "100%",
    maxWidth: 360,
    gap: spacing.md,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.h4,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    textAlign: "center",
  },
  body: {
    fontSize: fontSize.bodySm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  acceptBtn: {
    backgroundColor: colors.terracotta,
    borderRadius: radius.field,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  acceptText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  rejectBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  rejectText: {
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
});
