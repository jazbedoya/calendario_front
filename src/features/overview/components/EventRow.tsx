import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useTranslation } from "react-i18next";
import type { CalendarEvent } from "@/features/overview/types";
import { LAYER_COLORS } from "@/features/overview/types";
import { colors, spacing, radius, fontSize, fontWeight } from "@/theme";

interface Props {
  event: CalendarEvent;
  accentColor: string;
  timezone: string;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EventRow({ event, accentColor, timezone, onPress }: Props) {
  const { t } = useTranslation();
  const start = event.isAllDay
    ? t("calendar.allDay")
    : formatInTimeZone(parseISO(event.startAt), timezone, "HH:mm");
  const end = event.isAllDay
    ? ""
    : formatInTimeZone(parseISO(event.endAt), timezone, "HH:mm");

  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.85}>
      {/* Time column */}
      <View style={s.timeCol}>
        <Text style={s.timeStart}>{start}</Text>
        {end ? <Text style={s.timeEnd}>{end}</Text> : null}
      </View>

      {/* Color bar */}
      <View style={[s.bar, { backgroundColor: accentColor }]} />

      {/* Content */}
      <View style={s.content}>
        <Text style={s.title}>{event.title}</Text>
        <View style={s.metaRow}>
          <View style={[s.layerDot, { backgroundColor: accentColor }]} />
          <Text style={[s.layerLabel, { color: accentColor }]}>{t(`layers.${event.layer}`)}</Text>
        </View>
      </View>

      {/* Edit icon */}
      <TouchableOpacity style={s.editBtn} hitSlop={12}>
        <Ionicons name="create-outline" size={16} color={colors.textDisabled} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  timeCol: {
    width: 50,
    alignItems: "flex-end",
    paddingRight: spacing.md,
  },
  timeStart: {
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  timeEnd: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  bar: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    minHeight: 40,
  },
  content: {
    flex: 1,
    paddingLeft: spacing.md,
    gap: 4,
  },
  title: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  layerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  layerLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  editBtn: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});
