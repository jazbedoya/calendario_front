/**
 * AreaCalendarScreen — componente compartido por Familia, Trabajo y Personal.
 * Solo difieren el color de acento, la capa y el título.
 * UI: Avante design system (misma base visual que Agenda).
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  RefreshControl,
  Animated,
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
import { SmartAddSheet } from "@/features/tasks/SmartAddSheet";
import {
  getLayersByDay,
  detectConflicts,
  getEventsForDay,
} from "@/features/overview/calendarUtils";
import { type Layer, type CalendarEvent, LAYER_COLORS } from "@/features/overview/types";
import { EventRow } from "./EventRow";
import { OccupiedRow } from "./OccupiedRow";
import { ConflictCard } from "./ConflictCard";
import { EmptyAreaCard } from "./EmptyAreaCard";
import { EventDetailSheet } from "./EventDetailSheet";
import { useAreaNudge } from "@/features/overview/useAreaNudge";
import { useTranslation } from "react-i18next";
import { useHolidayStore } from "@/features/settings/holidayStore";
import { getHolidayMapForMonth } from "@/features/overview/getHolidays";
import { colors, spacing, radius, fontSize, fontWeight, shadows } from "@/theme";

// ─── Constantes ───────────────────────────────────────────────────────────────

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
  const [smartAddOpen, setSmartAddOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [detailEvent,  setDetailEvent]  = useState<CalendarEvent | null>(null);
  const [animating,    setAnimating]    = useState(false);
  const slideAnim = useState(() => new Animated.Value(0))[0];

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

  function changeMonth(dir: 'prev' | 'next') {
    if (animating) return;
    setAnimating(true);
    const outX = dir === 'next' ? -280 : 280;
    const inX  = dir === 'next' ?  280 : -280;
    Animated.timing(slideAnim, { toValue: outX, duration: 160, useNativeDriver: true }).start(() => {
      slideAnim.setValue(inX);
      const d = dir === 'next'
        ? addMonths(new Date(viewYear, viewMonth), 1)
        : subMonths(new Date(viewYear, viewMonth), 1);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelectedDate(null);
      Animated.timing(slideAnim, { toValue: 0, duration: 160, useNativeDriver: true })
        .start(() => setAnimating(false));
    });
  }

  function handleDay(day: Date) {
    const key = format(day, "yyyy-MM-dd");
    setSelectedDate((prev) => (prev === key ? null : key));
  }

  const dateLocale = getDateLocale(language);
  const weekdays   = Array.from({ length: 7 }, (_, i) =>
    format(new Date(2023, 0, 2 + i), 'EEEEE', { locale: dateLocale })
  );
  const monthName = format(new Date(viewYear, viewMonth, 1), "MMMM", { locale: dateLocale });
  const yearStr   = String(viewYear);
  const dayLabel   = selectedDate
    ? format(parseISO(selectedDate), t('dateFormat.dayMonth'), { locale: dateLocale })
    : null;

  return (
    <SafeAreaView style={st.container} edges={["top"]}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} tintColor={accent} />}
      >
        {/* ── Header: back + año/mes izquierda ── */}
        <View style={st.header}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
            style={st.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textMuted} />
          </Pressable>
          <Pressable style={st.headerLeft} onPress={() => changeMonth('prev')}>
            <Text style={st.yearLabel}>{yearStr}</Text>
            <View style={st.monthRow}>
              <View style={[st.titleDot, { backgroundColor: accent }]} />
              <Text style={st.monthName}>{title} · {monthName}</Text>
            </View>
          </Pressable>
          <View style={st.navBtns}>
            <TouchableOpacity onPress={() => changeMonth('prev')} hitSlop={8} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeMonth('next')} hitSlop={8} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tuga nudge ── */}
        {showNudge && (
          <View style={{ marginHorizontal: spacing.screenX, marginBottom: spacing.md }}>
            <EmptyAreaCard
              layer={layer}
              accent={accent}
              accentLight={accentLight}
              onAddSomething={() => { dismissNudge(); setSmartAddOpen(true); }}
              onDismiss={dismissNudge}
            />
          </View>
        )}

        {/* ── Calendario en card ── */}
        <View style={[st.calCard, shadows.card]}>
          {/* Leyenda */}
          <View style={st.legend}>
            <View style={st.legendItem}>
              <View style={[st.legendDot, { backgroundColor: accent }]} />
              <Text style={st.legendLabel}>{title}</Text>
            </View>
            <View style={st.legendItem}>
              <View style={[st.legendDot, { backgroundColor: colors.textDisabled }]} />
              <Text style={st.legendLabel}>{t('calendar.occupied')}</Text>
            </View>
          </View>

          {/* Días semana */}
          <View style={st.weekdayRow}>
            {weekdays.map((d, i) => (
              <View key={i} style={st.weekdayCell}>
                <Text style={[st.weekdayLabel, (i === 5 || i === 6) && st.weekdayWeekend]}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Grilla mes */}
          <Animated.View style={[st.grid, { transform: [{ translateX: slideAnim }] }]}>
            {weeks.map((week, wi) => (
              <View key={wi} style={st.weekRow}>
                {week.map((day) => {
                  const key      = format(day, "yyyy-MM-dd");
                  const inMonth  = isSameMonth(day, new Date(viewYear, viewMonth));
                  const isSelect = selectedDate === key;
                  const isTodayD = isToday(day);
                  const layers   = layersByDay.get(key);
                  const hasArea  = layers?.has(layer) ?? false;
                  const hasOther = layers ? otherLayers.some((l) => layers.has(l)) : false;
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const isHoliday = inMonth && holidayMap.has(key);
                  const tintBg = hasArea && inMonth ? (accent + '0D') : undefined;

                  return (
                    <View key={key} style={[st.dayCellWrap, isHoliday && st.holidayCellBg]}>
                      <Pressable
                        style={({ pressed }) => [
                          st.dayCell,
                          isWeekend && inMonth && st.weekendCell,
                          tintBg ? { backgroundColor: tintBg } : undefined,
                          pressed && st.dayCellPressed,
                        ]}
                        onPress={() => handleDay(day)}
                      >
                        <View style={st.dayNumWrap}>
                          <View style={[
                            st.dayCircle,
                            isTodayD && !isSelect && { borderWidth: 1.5, borderColor: accent },
                            isSelect && { backgroundColor: accent },
                          ]}>
                            <Text style={[
                              st.dayText,
                              !inMonth && st.outMonthText,
                              isWeekend && inMonth && !isTodayD && !isSelect && st.weekendText,
                              isTodayD && !isSelect && { color: accent, fontWeight: "700" as const },
                              isSelect && st.selectedDayText,
                            ]}>
                              {format(day, "d")}
                            </Text>
                            {isSelect && isTodayD && <View style={st.todaySelectedDot} />}
                          </View>
                          {isHoliday && <View style={st.holidayDot} />}
                        </View>
                        <View style={st.dots}>
                          {hasArea  && <View style={[st.dot, { backgroundColor: accent }]} />}
                          {hasOther && <View style={[st.dot, { backgroundColor: colors.textDisabled }]} />}
                          {!hasArea && !hasOther && <View style={st.dotPlaceholder} />}
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </Animated.View>
        </View>

        {/* ── Panel inferior: eventos del día ── */}
        {selectedDate && (
          <View style={[st.panel, shadows.card]}>
            <View style={st.panelHeader}>
              <Text style={st.panelTitle}>{dayLabel}</Text>
              <Text style={st.panelMonth}>
                {selectedDate ? format(parseISO(selectedDate), 'MMMM', { locale: dateLocale }).toUpperCase() : ''}
              </Text>
            </View>

            {selectedHoliday && (
              <View style={st.holidayRow}>
                <View style={st.holidayRowDot} />
                <Text style={st.holidayRowName}>{t(selectedHoliday.nameKey)}</Text>
                <Text style={st.holidayRowBadge}>{t('calendar.holiday')}</Text>
              </View>
            )}

            {conflicts.length > 0 && (
              <View style={{ marginBottom: spacing.sm }}>
                {conflicts.map((c) => (
                  <ConflictCard
                    key={c.id}
                    conflict={c}
                    timezone={USER_TZ}
                    onEdit={(ev) => openEdit(ev)}
                  />
                ))}
              </View>
            )}

            {areaEvents.length > 0 ? (
              areaEvents.map((ev) => (
                <EventRow
                  key={ev.id}
                  event={ev}
                  accentColor={accent}
                  timezone={USER_TZ}
                  onPress={() => openDetail(ev)}
                />
              ))
            ) : occupiedEvents.length === 0 ? (
              <View style={st.emptyState}>
                <Ionicons name="calendar-outline" size={28} color={colors.textDisabled} />
                <Text style={st.emptyTxt}>{t('calendar.noScheduled')}</Text>
                <TouchableOpacity onPress={() => setSmartAddOpen(true)} activeOpacity={0.7}>
                  <Text style={st.emptyAction}>{t('calendar.addFirst')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {occupiedEvents.length > 0 && (
              <>
                <View style={st.divider}>
                  <View style={st.dividerLine} />
                  <Text style={st.dividerTxt}>{t('calendar.occupied')}</Text>
                  <View style={st.dividerLine} />
                </View>
                {occupiedEvents.map((ev) => (
                  <OccupiedRow key={ev.id} event={ev} timezone={USER_TZ} />
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[st.fab, shadows.fab]}
        activeOpacity={0.85}
        onPress={() => setSmartAddOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('calendar.addEvent')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* ── SmartAddSheet (crear) ── */}
      <SmartAddSheet
        visible={smartAddOpen}
        onClose={() => setSmartAddOpen(false)}
        showSubtitle
        initialDate={selectedDate}
        mode="calendar"
        initialLayer={layer}
      />

      {/* ── QuickAddSheet (editar) ── */}
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
      <View style={st.tabWrapper}>
        <View style={[st.tabBar, shadows.nav]}>
          {[
            { icon: "home",      label: t('tabs.home'),    route: "/(tabs)"          },
            { icon: "layers",    label: t('tabs.all'),     route: "/(tabs)/layers"   },
            { icon: "bar-chart", label: t('tabs.balance'), route: "/(tabs)/stats"    },
            { icon: "settings",  label: t('tabs.settings'),route: "/(tabs)/settings" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.icon}
              style={st.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (Platform.OS === "web") { window.location.href = tab.route; }
                else { router.replace(tab.route as any); }
              }}
            >
              <Ionicons name={`${tab.icon}-outline` as any} size={20} color={colors.textMuted} />
              <Text style={st.tabLabel}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos (Avante design tokens) ──────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll:    { paddingBottom: 140 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center", justifyContent: "center",
  },
  headerLeft: { flex: 1 },
  yearLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleDot: {
    width: 10, height: 10, borderRadius: 5,
  },
  monthName: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    textTransform: "capitalize",
    letterSpacing: 0.2,
  },
  navBtns: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },

  // Calendar card
  calCard: {
    marginHorizontal: spacing.screenX,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },

  // Legend
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
    paddingVertical: spacing.sm,
  },
  legendItem:  { flexDirection: "row", alignItems: "center", gap: 7 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: fontSize.label, color: colors.textSecondary, fontWeight: fontWeight.medium },

  // Weekday header
  weekdayRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekdayLabel: {
    textAlign: "center",
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.textFaint,
    letterSpacing: 0.5,
  },
  weekdayWeekend: { color: '#C4A49A' },

  // Grid
  grid:    {},
  weekRow: { flexDirection: "row" },

  dayCellWrap: {
    flex: 1,
  },
  dayCell: {
    alignItems: "center",
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  dayCellPressed: {
    transform: [{ scale: 0.88 }],
    opacity: 0.7,
  },
  weekendCell: { backgroundColor: 'rgba(160, 140, 130, 0.04)' },

  dayNumWrap: { position: "relative" },
  dayCircle: {
    width: 36, height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText:         { fontSize: fontSize.bodySm, color: colors.ink, fontWeight: fontWeight.regular },
  outMonthText:    { color: colors.textDisabled, fontSize: fontSize.caption },
  weekendText:     { color: '#8A7E78' },
  selectedDayText: { fontWeight: fontWeight.bold, color: colors.white },
  todaySelectedDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
    position: "absolute", bottom: 4,
  },

  holidayCellBg: { backgroundColor: '#FFD93D', borderRadius: radius.sm, margin: 2 },
  holidayDot: {
    position: "absolute", top: 1, right: 1,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: HOLIDAY_GOLD,
  },

  dots: {
    flexDirection: "row",
    gap: 6,
    height: 10,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot:            { width: 8, height: 8, borderRadius: 4 },
  dotPlaceholder: { width: 7, height: 7 },

  // Panel inferior
  panel: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.screenX,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.md,
  },
  panelTitle: { fontSize: fontSize.h3, fontWeight: fontWeight.bold, color: colors.ink, textTransform: "capitalize" },
  panelMonth: { fontSize: fontSize.label, fontWeight: fontWeight.semibold, color: colors.textMuted, letterSpacing: 1, textTransform: "uppercase" },

  holidayRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  holidayRowDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: HOLIDAY_GOLD, flexShrink: 0 },
  holidayRowName:  { flex: 1, fontSize: fontSize.bodySm, color: colors.ink, fontWeight: fontWeight.medium },
  holidayRowBadge: {
    fontSize: fontSize.micro, color: HOLIDAY_GOLD, fontWeight: fontWeight.semibold,
    backgroundColor: '#FDF8E8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm,
  },

  emptyState: {
    alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm,
  },
  emptyTxt: {
    fontSize: fontSize.bodySm, color: colors.textFaint, textAlign: "center",
  },
  emptyAction: {
    fontSize: fontSize.bodySm, fontWeight: fontWeight.semibold, color: colors.terracotta,
    paddingVertical: 6, paddingHorizontal: spacing.lg,
  },

  divider:     { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.hairline },
  dividerTxt:  { fontSize: fontSize.caption, color: colors.textFaint, fontWeight: fontWeight.medium },

  // FAB
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 110 : 96,
    right: spacing["2xl"],
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: colors.ink,
    justifyContent: "center", alignItems: "center",
  },

  // Tab bar
  tabWrapper: { position: "absolute", bottom: Platform.OS === "ios" ? 28 : 20, left: spacing["2xl"], right: spacing["2xl"], alignItems: "center" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: "100%",
    justifyContent: "space-around",
  },
  tabItem:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 4 },
  tabLabel: { fontSize: fontSize.micro, fontWeight: fontWeight.semibold, color: colors.textMuted, letterSpacing: 0.2 },
});
