import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useTranslation } from "react-i18next";
import type { CalendarEvent } from "@/features/overview/types";

interface Props {
  event: CalendarEvent;
  timezone: string;
}

export function OccupiedRow({ event, timezone }: Props) {
  const { t } = useTranslation();
  const start = formatInTimeZone(parseISO(event.startAt), timezone, "HH:mm");
  const end   = formatInTimeZone(parseISO(event.endAt),   timezone, "HH:mm");

  return (
    <View style={s.row}>
      <View style={s.bar} />
      <View style={s.info}>
        <Text style={s.time}>{start} – {end}</Text>
        <Text style={s.label}>{t('calendar.occupied')}</Text>
      </View>
      <Ionicons name="lock-closed" size={14} color="#D0D0D0" style={s.lock} />
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginBottom: 6,
    overflow: "hidden",
    opacity: 0.75,
  },
  bar:  { width: 4, height: "100%", backgroundColor: "#CCCCCC" },
  info: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, gap: 1 },
  time: { fontSize: 12, color: "#AAAAAA", fontWeight: "500" },
  label: { fontSize: 13, color: "#BBBBBB", fontWeight: "500" },
  lock: { marginRight: 12 },
});
