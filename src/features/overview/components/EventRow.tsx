import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { CalendarEvent } from "@/features/overview/types";

interface Props {
  event: CalendarEvent;
  accentColor: string;
  timezone: string;
  onPress: () => void;
  // kept for backward compat with components not yet using EventDetailSheet
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EventRow({ event, accentColor, timezone, onPress }: Props) {
  const start = event.isAllDay
    ? "Todo el día"
    : formatInTimeZone(parseISO(event.startAt), timezone, "HH:mm");
  const end = event.isAllDay
    ? ""
    : formatInTimeZone(parseISO(event.endAt), timezone, "HH:mm");

  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.85}>
      <View style={[s.bar, { backgroundColor: accentColor }]} />
      <View style={s.info}>
        <Text style={s.time}>
          {event.isAllDay ? start : `${start}${end ? " – " + end : ""}`}
        </Text>
        <Text style={s.title}>{event.title}</Text>
        {event.location ? <Text style={s.location}>{event.location}</Text> : null}
      </View>
      {event.recurrenceRule || event.recurrenceParentId ? (
        <Ionicons name="repeat-outline" size={14} color="#CCCCCC" style={s.recurrenceIcon} />
      ) : (
        <Ionicons name="chevron-forward" size={14} color="#DDDDDD" style={s.recurrenceIcon} />
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    alignItems: "center",
  },
  bar:           { width: 5, alignSelf: "stretch" },
  info:          { flex: 1, paddingVertical: 16, paddingHorizontal: 14, gap: 3 },
  time:          { fontSize: 11, color: "#C0C0C0", fontWeight: "500" },
  title:         { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  location:      { fontSize: 12, color: "#BBBBBB", marginTop: 1 },
  recurrenceIcon:{ marginRight: 14 },
});
