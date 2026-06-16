import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { LAYER_COLORS } from "@/features/overview/types";
import type { CalendarEvent } from "@/features/overview/types";
import { EventDetailSheet } from "@/features/overview/components/EventDetailSheet";
import { QuickAddSheet } from "@/features/events/components/QuickAddSheet";
import { useDeleteEvent } from "@/features/events/useDeleteEvent";
import { getNextEvent } from "../getNextEvent";
import type { UpcomingEvent } from "../useHomeSummary";

interface Props {
  events:   UpcomingEvent[];
  timezone: string;
}

function toCalendarEvent(e: UpcomingEvent): CalendarEvent {
  return {
    id:       e.id,
    title:    e.title,
    startAt:  e.start_at,
    endAt:    e.end_at,
    isAllDay: e.is_all_day,
    layer:    e.layer,
  };
}

export function NextEventCard({ events, timezone }: Props) {
  const { t } = useTranslation();
  const qc    = useQueryClient();

  const [now,           setNow]           = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editEvent,     setEditEvent]     = useState<CalendarEvent | undefined>(undefined);
  const [showQuickAdd,  setShowQuickAdd]  = useState(false);

  const { mutateAsync: deleteEvent } = useDeleteEvent();

  // Advance the card to the next event automatically every 60 s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const result   = getNextEvent(events, now, timezone);
  const todayStr = format(now, "yyyy-MM-dd");

  const handleDelete = useCallback(async (deleteMode: "single" | "all") => {
    if (!selectedEvent) return;
    await deleteEvent({ id: selectedEvent.id, deleteMode });
    setSelectedEvent(null);
  }, [selectedEvent, deleteEvent]);

  const handleEdit = useCallback(() => {
    if (!selectedEvent) return;
    setEditEvent(selectedEvent);
    setSelectedEvent(null);
    setShowQuickAdd(true);
  }, [selectedEvent]);

  const handleQuickAddClose = useCallback(() => {
    setShowQuickAdd(false);
    setEditEvent(undefined);
  }, []);

  const handleQuickAddSaved = useCallback(() => {
    setShowQuickAdd(false);
    setEditEvent(undefined);
    qc.invalidateQueries({ queryKey: ["home-summary"] });
  }, [qc]);

  // ── Render card content ─────────────────────────────────────────────────────

  let cardContent: React.ReactNode;

  if (result.type === "ongoing" || result.type === "next") {
    const { event } = result;
    const isOngoing = result.type === "ongoing";
    const color     = LAYER_COLORS[event.layer];

    const timeStr = event.is_all_day
      ? t("home.nextEvent.allDay")
      : formatInTimeZone(parseISO(event.start_at), timezone, "HH:mm");
    const endStr = !event.is_all_day
      ? formatInTimeZone(parseISO(event.end_at), timezone, "HH:mm")
      : null;

    cardContent = (
      <TouchableOpacity
        style={s.card}
        onPress={() => setSelectedEvent(toCalendarEvent(event))}
        activeOpacity={0.82}
      >
        <View style={[s.bar, { backgroundColor: color }]} />
        <View style={s.content}>
          <Text style={s.label}>
            {isOngoing ? t("home.nextEvent.labelNow") : t("home.nextEvent.label")}
          </Text>
          <Text style={s.title} numberOfLines={2}>{event.title}</Text>
          {isOngoing && endStr
            ? <Text style={s.timeGray}>{t("home.nextEvent.endsAt", { time: endStr })}</Text>
            : <Text style={[s.time, { color }]}>{timeStr}</Text>
          }
        </View>
      </TouchableOpacity>
    );

  } else if (result.type === "done") {
    cardContent = (
      <View style={s.cardFlat}>
        <Ionicons name="checkmark-circle-outline" size={20} color="#8DB5AA" style={s.icon} />
        <Text style={s.flatText}>{t("home.nextEvent.quietDay")}</Text>
      </View>
    );

  } else {
    // empty
    cardContent = (
      <TouchableOpacity
        style={s.cardFlat}
        onPress={() => setShowQuickAdd(true)}
        activeOpacity={0.82}
      >
        <Ionicons name="calendar-outline" size={20} color="#BBBBBB" style={s.icon} />
        <Text style={s.flatText}>{t("home.nextEvent.noEvents")}</Text>
        <View style={s.addRow}>
          <Text style={s.addHint}>{t("home.nextEvent.addHint")}</Text>
          <View style={s.addBadge}>
            <Ionicons name="add" size={14} color="#888888" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.wrapper}>
      {cardContent}

      <EventDetailSheet
        visible={!!selectedEvent}
        event={selectedEvent}
        timezone={timezone}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <QuickAddSheet
        visible={showQuickAdd}
        date={todayStr}
        layer={null}
        timezone={timezone}
        editEvent={editEvent}
        onClose={handleQuickAddClose}
        onSaved={handleQuickAddSaved}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1 },

  // ── Event card (ongoing / next) ───────────────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bar:     { width: 5, alignSelf: "stretch" },
  content: { flex: 1, padding: 14, gap: 4 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#AAAAAA",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    lineHeight: 19,
  },
  time:     { fontSize: 15, fontWeight: "700" },
  timeGray: { fontSize: 12, color: "#AAAAAA" },

  // ── Flat card (done / empty) ──────────────────────────────────────────────
  cardFlat: {
    flex: 1,
    backgroundColor: "#EFEFED",
    borderRadius: 16,
    padding: 16,
  },
  icon:     { marginBottom: 8 },
  flatText: { fontSize: 13, fontWeight: "500", color: "#4A4A4A", lineHeight: 18 },
  addRow:   { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 },
  addHint:  { fontSize: 12, color: "#888888" },
  addBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
});
