/**
 * AreaCalendarScreen — componente compartido por Familia, Trabajo y Personal.
 * Solo difieren el color de acento, la capa y el título.
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  RefreshControl,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { useLanguageStore } from "@/features/settings/languageStore";
import { getDateLocale } from "@/i18n/dateLocale";

import { useEventsStore } from "@/features/events/eventsStore";
import { useGetEvents } from "@/features/events/useGetEvents";
import { useDeleteEvent } from "@/features/events/useDeleteEvent";
import { QuickAddSheet } from "@/features/events/components/QuickAddSheet";
import {
  getLayersByDay,
  detectConflicts,
  getEventsForDay,
} from "@/features/overview/calendarUtils";
import { type Layer, type CalendarEvent } from "@/features/overview/types";
import { EventRow } from "./EventRow";
import { OccupiedRow } from "./OccupiedRow";
import { ConflictCard } from "./ConflictCard";
import { EmptyAreaCard } from "./EmptyAreaCard";
import { EventDetailSheet } from "./EventDetailSheet";
import { useAreaNudge } from "@/features/overview/useAreaNudge";
import { useTranslation } from "react-i18next";
import { useHolidayStore } from "@/features/settings/holidayStore";
import { getHolidayMapForMonth } from "@/features/overview/getHolidays";

// ─── Constantes ───────────────────────────────────────────────────────────────

const BG           = "#FAF9F7";
const USER_TZ      = "Europe/Madrid";
const HOLIDAY_GOLD = "#C8A52A";

function buildWeeks(year: number, month: number): Date[][] {
  const first = startOfMonth(new Date(year, month, 1));
  const last  = endOfMonth(first);
  const start = startOfWeek(first, { weekStartsOn: 1 });
  const end   = endOfWeek(last,   { weekStartsOn: 1 });
  const days  = eachDayOfInterval({ start, end });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

// ─── Prop types ───────────────────────────────────────────────────────────────

interface Props {
  layer: "family" | "work" | "personal";
  accent: string;
  accentLight: string;
  title: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function AreaCalendarScreen({ layer, accent, accentLight, title }: Props) {
  const { t } = useTranslation();
  const language = useLanguageStore((s) => s.language);
  const now = new Date();
  const [viewYear,     setViewYear]     = useState(now.getFullYear());
  const [viewMonth,    setViewMonth]    = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [detailEvent,  setDetailEvent]  = useState<CalendarEvent | null>(null);

  const setEvents            = useEventsStore((s) => s.setEvents);
  const events               = useEventsStore((s) => s.events);
  const { data: fetchedEvents } = useGetEvents(viewYear, viewMonth);
  const { mutate: doDelete } = useDeleteEvent();
  const { shouldShow: showNudge, dismiss: dismissNudge } = useAreaNudge(layer, events);
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["events"] });
    setRefreshing(false);
  }, [qc]);

  // Sincronizar eventos del backend al store local (usado por QuickAddSheet para conflictos)
  useEffect(() => {
    if (fetchedEvents) setEvents(fetchedEvents);
  }, [fetchedEvents, setEvents]);

  function openEdit(event: CalendarEvent) { setEditingEvent(event); setSheetOpen(true); }
  function openDetail(event: CalendarEvent) { setDetailEvent(event); }
  function confirmDelete(event: CalendarEvent, mode: 'single' | 'all' = 'single') {
    doDelete({ id: event.id, deleteMode: mode });
  }

  const weeks = useMemo(() => buildWeeks(viewYear, viewMonth), [viewYear, viewMonth]);

  const holidayCountry = useHolidayStore((s) => s.country);
  const holidayMap     = useMemo(
    () => getHolidayMapForMonth(holidayCountry, viewYear, viewMonth),
    [holidayCountry, viewYear, viewMonth],
  );
  const selectedHoliday = selectedDate ? (holidayMap.get(selectedDate) ?? null) : null;

  const layersByDay = useMemo(
    () => getLayersByDay(events, new Date(viewYear, viewMonth), USER_TZ),
    [events, viewYear, viewMonth],
  );

  const allDayEvents = useMemo(
    () => (selectedDate ? getEventsForDay(events, selectedDate, USER_TZ) : []),
    [events, selectedDate],
  );

  const areaEvents    = useMemo(() => allDayEvents.filter((e) => e.layer === layer), [allDayEvents, layer]);
  const occupiedEvents = useMemo(() => allDayEvents.filter((e) => e.layer !== layer), [allDayEvents, layer]);
  const conflicts     = useMemo(() => detectConflicts(allDayEvents), [allDayEvents]);

  const otherLayers = (["family", "work", "personal"] as Layer[]).filter((l) => l !== layer);

  function goToPrev() {
    const d = subMonths(new Date(viewYear, viewMonth), 1);
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
    setSelectedDate(null);
  }
  function goToNext() {
    const d = addMonths(new Date(viewYear, viewMonth), 1);
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
    setSelectedDate(null);
  }

  function handleDay(day: Date) {
    const key = format(day, "yyyy-MM-dd");
    setSelectedDate((prev) => (prev === key ? null : key));
  }

  const dateLocale = getDateLocale(language);
  const weekdays   = Array.from({ length: 7 }, (_, i) =>
    format(new Date(2023, 0, 2 + i), 'EEEEE', { locale: dateLocale })
  );
  const monthLabel = format(new Date(viewYear, viewMonth, 1), "MMMM yyyy", { locale: dateLocale });
  const dayLabel   = selectedDate
    ? format(parseISO(selectedDate), t('dateFormat.dayMonth'), { locale: dateLocale })
    : null;

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          style={s.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={accent} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: accent }]}>{title}</Text>
          <View style={s.monthNav}>
            <TouchableOpacity onPress={goToPrev} hitSlop={8}>
              <Ionicons name="chevron-back" size={16} color="#9A9A9A" />
            </TouchableOpacity>
            <Text style={s.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={goToNext} hitSlop={8}>
              <Ionicons name="chevron-forward" size={16} color="#9A9A9A" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} tintColor={accent} />}
      >

        {/* ── Tuga nudge: ≥7 días sin eventos ── */}
        {showNudge && (
          <EmptyAreaCard
            layer={layer}
            accent={accent}
            accentLight={accentLight}
            onAddSomething={() => { dismissNudge(); setSheetOpen(true); }}
            onDismiss={dismissNudge}
          />
        )}

        {/* ── Leyenda ── */}
        <View style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: accent }]} />
            <Text style={s.legendTxt}>{title}</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: "#CCCCCC" }]} />
            <Text style={s.legendTxt}>{t('calendar.occupied')}</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: HOLIDAY_GOLD }]} />
            <Text style={s.legendTxt}>{t('calendar.holiday')}</Text>
          </View>
        </View>

        {/* ── Cabecera días semana ── */}
        <View style={s.weekdayRow}>
          {weekdays.map((d, i) => (
            <Text key={i} style={s.weekdayLabel}>{d}</Text>
          ))}
        </View>

        {/* ── Grilla ── */}
        <View style={s.grid}>
          {weeks.map((week, wi) => (
            <View key={wi} style={s.weekRow}>
              {week.map((day) => {
                const key      = format(day, "yyyy-MM-dd");
                const inMonth  = isSameMonth(day, new Date(viewYear, viewMonth));
                const isSelect = selectedDate === key;
                const isTodayD = isToday(day);
                const layers   = layersByDay.get(key);
                const hasArea  = layers?.has(layer) ?? false;
                const hasOther = layers ? otherLayers.some((l) => layers.has(l)) : false;
                const isHoliday = inMonth && holidayMap.has(key);

                return (
                  <TouchableOpacity
                    key={key}
                    style={s.dayCell}
                    onPress={() => handleDay(day)}
                    activeOpacity={0.7}
                  >
                    <View style={s.dayNumWrap}>
                      <View style={[
                        s.dayCircle,
                        isTodayD && !isSelect && { borderWidth: 1.5, borderColor: accent },
                        isSelect && { backgroundColor: accentLight },
                      ]}>
                        <Text style={[
                          s.dayText,
                          !inMonth && s.outMonth,
                          isSelect && s.selectedText,
                          isTodayD && !isSelect && { color: accent, fontWeight: "700" },
                        ]}>
                          {format(day, "d")}
                        </Text>
                      </View>
                      {isHoliday && <View style={s.holidayDot} />}
                    </View>
                    <View style={s.dots}>
                      {hasArea  && <View style={[s.dot, { backgroundColor: accent }]} />}
                      {hasOther && <View style={[s.dot, { backgroundColor: "#CCCCCC" }]} />}
                      {!hasArea && !hasOther && <View style={s.dotEmpty} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* ── Panel del día ── */}
        {selectedDate && (
          <View style={s.panel}>
            <View style={s.panelHeader}>
              <Text style={s.panelTitle}>
                {areaEvents.length > 0 ? t('calendar.eventsTitle') : t('calendar.noEvents')}
              </Text>
              <Text style={s.panelDate}>{dayLabel}</Text>
            </View>

            {selectedHoliday && (
              <View style={s.holidayRow}>
                <View style={s.holidayRowDot} />
                <Text style={s.holidayRowName}>{t(selectedHoliday.nameKey)}</Text>
                <Text style={s.holidayRowBadge}>{t('calendar.holiday')}</Text>
              </View>
            )}

            {conflicts.length > 0 && (
              <View style={s.conflictBlock}>
                {conflicts.map((c) => (
                  <ConflictCard
                    key={c.id}
                    conflict={c}
                    timezone={USER_TZ}
                    onResolve={(cx) => {
                      const toEdit = cx.eventA.layer === layer ? cx.eventA
                        : cx.eventB.layer === layer ? cx.eventB
                        : cx.eventA;
                      openEdit(toEdit);
                    }}
                  />
                ))}
              </View>
            )}

            {areaEvents.map((ev) => (
              <EventRow
                key={ev.id}
                event={ev}
                accentColor={accent}
                timezone={USER_TZ}
                onPress={() => openDetail(ev)}
              />
            ))}

            {occupiedEvents.length > 0 && (
              <>
                <View style={s.divider}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerTxt}>{t('calendar.occupied')}</Text>
                  <View style={s.dividerLine} />
                </View>
                {occupiedEvents.map((ev) => (
                  <OccupiedRow key={ev.id} event={ev} timezone={USER_TZ} />
                ))}
              </>
            )}

            {areaEvents.length === 0 && occupiedEvents.length === 0 && (
              <Text style={s.emptyTxt}>{t('calendar.noScheduled')}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: accent, shadowColor: accent }]}
        activeOpacity={0.85}
        onPress={() => setSheetOpen(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── QuickAddSheet ── */}
      <QuickAddSheet
        visible={sheetOpen}
        date={selectedDate ?? format(now, "yyyy-MM-dd")}
        layer={layer}
        timezone={USER_TZ}
        editEvent={editingEvent}
        onClose={() => { setSheetOpen(false); setEditingEvent(undefined); }}
      />

      {/* ── Sheet detalle de evento ── */}
      <EventDetailSheet
        visible={!!detailEvent}
        event={detailEvent}
        timezone={USER_TZ}
        onClose={() => setDetailEvent(null)}
        onEdit={() => { if (detailEvent) openEdit(detailEvent); setDetailEvent(null); }}
        onDelete={(mode) => { if (detailEvent) confirmDelete(detailEvent, mode); setDetailEvent(null); }}
      />

      {/* ── Tab bar flotante ── */}
      <View style={s.tabWrapper}>
        <View style={s.tabBar}>
          {[
            { icon: "home",           label: t('tabs.home'),    active: false, route: "/(tabs)"          },
            { icon: "layers",         label: t('tabs.all'),     active: false, route: "/(tabs)/layers"   },
            { icon: "bar-chart",      label: t('tabs.balance'), active: false, route: "/(tabs)/stats"    },
            { icon: "settings", label: t('tabs.settings'),active: false, route: "/(tabs)/settings" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.icon}
              style={s.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!tab.route) return;
                if (Platform.OS === "web") { window.location.href = tab.route; }
                else { router.replace(tab.route as any); }
              }}
            >
              {tab.active ? (
                <View style={[s.tabActive, { backgroundColor: accent }]}>
                  <Ionicons name={tab.icon as any} size={18} color="#FFFFFF" />
                </View>
              ) : (
                <Ionicons name={`${tab.icon}-outline` as any} size={20} color="#9A9A9A" />
              )}
              <Text style={[s.tabLabel, tab.active && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll:    { paddingBottom: 140 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn:      { width: 40 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle:  { fontSize: 22, fontWeight: "600", fontStyle: "italic" },
  monthNav:     { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  monthLabel:   { fontSize: 14, color: "#666", fontWeight: "500", textTransform: "capitalize" },

  legend:     { flexDirection: "row", justifyContent: "center", gap: 20, paddingVertical: 8, paddingHorizontal: 20 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot:  { width: 9, height: 9, borderRadius: 4.5 },
  legendTxt:  { fontSize: 13, color: "#6B6B6B", fontWeight: "500" },

  weekdayRow:   { flexDirection: "row", paddingHorizontal: 12, marginBottom: 4 },
  weekdayLabel: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "600", color: "#BBBBBB", height: 32, lineHeight: 32 },

  grid:    { paddingHorizontal: 12 },
  weekRow: { flexDirection: "row", marginBottom: 2 },
  dayCell: { flex: 1, alignItems: "center", paddingVertical: 4 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  dayText:      { fontSize: 14, color: "#2D2D2D", fontWeight: "400" },
  outMonth:     { color: "#D4D0CB" },
  selectedText: { fontWeight: "700", color: "#2D2D2D" },

  dayNumWrap: { position: "relative" },
  holidayDot: {
    position: "absolute", top: 1, right: 1,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: HOLIDAY_GOLD,
  },

  dots:     { flexDirection: "row", gap: 3, height: 9, marginTop: 3, alignItems: "center", justifyContent: "center" },
  dot:      { width: 6, height: 6, borderRadius: 3 },
  dotEmpty: { width: 6, height: 6 },

  panel: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
  panelHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 },
  panelTitle:    { fontSize: 16, fontWeight: "700", color: "#2D2D2D" },
  panelDate:     { fontSize: 13, color: "#AAAAAA", textTransform: "capitalize" },
  conflictBlock: { marginBottom: 8 },

  holidayRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#F0EDE8",
  },
  holidayRowDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: HOLIDAY_GOLD, flexShrink: 0 },
  holidayRowName:  { flex: 1, fontSize: 14, color: "#1A1A1A", fontWeight: "500" },
  holidayRowBadge: {
    fontSize: 11, color: HOLIDAY_GOLD, fontWeight: "600",
    backgroundColor: "#FDF8E8", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },

  divider:     { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#EEEEEE" },
  dividerTxt:  { fontSize: 12, color: "#BBBBBB", fontWeight: "500" },

  emptyTxt: { fontSize: 14, color: "#BBBBBB", textAlign: "center", paddingVertical: 20 },

  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 110 : 100,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },

  tabWrapper: { position: "absolute", bottom: Platform.OS === "ios" ? 28 : 20, left: 24, right: 24, alignItems: "center" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    width: "100%",
    justifyContent: "space-around",
  },
  tabItem:        { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 4 },
  tabActive:      { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  tabLabel:       { fontSize: 10, fontWeight: "600", color: "#9A9A9A", letterSpacing: 0.2 },
  tabLabelActive: { color: "#A0432B" },
});
