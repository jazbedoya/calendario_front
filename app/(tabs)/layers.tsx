import { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns';
import { useLanguageStore } from '@/features/settings/languageStore';
import { getDateLocale } from '@/i18n/dateLocale';
import { useTranslation } from 'react-i18next';
import { useHolidayStore } from '@/features/settings/holidayStore';
import { getHolidayMapForMonth } from '@/features/overview/getHolidays';
import { useEventsStore } from '@/features/events/eventsStore';
import { useDeleteEvent } from '@/features/events/useDeleteEvent';
import { QuickAddSheet } from '@/features/events/components/QuickAddSheet';
import { SmartAddSheet } from '@/features/tasks/SmartAddSheet';
import { getLayersByDay, detectConflicts, getEventsForDay } from '@/features/overview/calendarUtils';
import {
  LAYER_COLORS,
  type Layer,
  type CalendarEvent,
  type Conflict,
} from '@/features/overview/types';
import { EventRow } from '@/features/overview/components/EventRow';
import { ConflictCard } from '@/features/overview/components/ConflictCard';
import { EventDetailSheet } from '@/features/overview/components/EventDetailSheet';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/theme';

// ─── Constantes ───────────────────────────────────────────────────────────────

const HOLIDAY_GOLD   = '#C8A52A';
const LAYER_ORDER: Layer[] = ['family', 'work', 'personal'];
const USER_TIMEZONE  = 'Europe/Madrid';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCalendarWeeks(year: number, month: number): Date[][] {
  const first = startOfMonth(new Date(year, month, 1));
  const last  = endOfMonth(first);
  const start = startOfWeek(first, { weekStartsOn: 1 });
  const end   = endOfWeek(last,   { weekStartsOn: 1 });
  const days  = eachDayOfInterval({ start, end });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function buildWeekDays(weekStart: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(weekStart, { weekStartsOn: 1 }),
    end:   endOfWeek(weekStart,   { weekStartsOn: 1 }),
  });
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function LayersScreen() {
  const { t } = useTranslation();
  const language = useLanguageStore((s) => s.language);
  const { width: winW } = useWindowDimensions();
  const CELL_W = (winW - spacing.screenX * 2 - spacing.md * 2 - 2) / 7; // screenX margins + calCard padding + border
  const today = new Date();

  const [viewMode,     setViewMode]     = useState<'month' | 'week'>('month');
  const [viewYear,     setViewYear]     = useState(today.getFullYear());
  const [viewMonth,    setViewMonth]    = useState(today.getMonth());
  const [weekStart,    setWeekStart]    = useState(() => startOfWeek(today, { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [detailEvent,  setDetailEvent]  = useState<CalendarEvent | null>(null);
  const [animating,    setAnimating]    = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [refreshing,   setRefreshing]   = useState(false);
  const [smartAddOpen, setSmartAddOpen] = useState(false);
  const qc = useQueryClient();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const events               = useEventsStore((s) => s.events);
  const { mutate: doDelete } = useDeleteEvent();

  const weeks    = useMemo(() => buildCalendarWeeks(viewYear, viewMonth), [viewYear, viewMonth]);
  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);
  const refDate  = viewMode === 'week' ? weekStart : new Date(viewYear, viewMonth);

  const layersByDay = useMemo(
    () => getLayersByDay(events, refDate, USER_TIMEZONE),
    [events, refDate],
  );

  const holidayCountry  = useHolidayStore((s) => s.country);
  const holidayMap      = useMemo(
    () => getHolidayMapForMonth(holidayCountry, viewYear, viewMonth),
    [holidayCountry, viewYear, viewMonth],
  );
  const selectedHoliday = selectedDate ? (holidayMap.get(selectedDate) ?? null) : null;

  const selectedEvents = useMemo(
    () => (selectedDate ? getEventsForDay(events, selectedDate, USER_TIMEZONE) : []),
    [events, selectedDate],
  );
  const selectedConflicts = useMemo(() => detectConflicts(selectedEvents), [selectedEvents]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return selectedEvents;
    const q = searchQuery.toLowerCase();
    return selectedEvents.filter((e) => e.title.toLowerCase().includes(q));
  }, [selectedEvents, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ['events'] });
    setRefreshing(false);
  }, [qc]);

  // ── Animación de cambio de mes ────────────────────────────────────────────

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

  function changeWeek(dir: 'prev' | 'next') {
    setWeekStart((ws) => dir === 'next' ? addWeeks(ws, 1) : subWeeks(ws, 1));
    setSelectedDate(null);
  }

  function handleDayPress(day: Date) {
    const key = format(day, 'yyyy-MM-dd');
    setSelectedDate((prev) => (prev === key ? null : key));
  }

  function switchMode(mode: 'month' | 'week') {
    if (mode === viewMode) return;
    if (mode === 'week') {
      const base = selectedDate ? parseISO(selectedDate) : today;
      setWeekStart(startOfWeek(base, { weekStartsOn: 1 }));
    } else {
      setViewYear(weekStart.getFullYear());
      setViewMonth(weekStart.getMonth());
    }
    setViewMode(mode);
    setSelectedDate(null);
  }

  function openCreate() { setEditingEvent(undefined); setSheetOpen(true); }
  function openEdit(ev: CalendarEvent) { setEditingEvent(ev); setSheetOpen(true); }
  function openDetail(ev: CalendarEvent) { setDetailEvent(ev); }
  function confirmDelete(ev: CalendarEvent, mode: 'single' | 'all') {
    doDelete({ id: ev.id, deleteMode: mode });
  }

  // ── Timeline del panel ────────────────────────────────────────────────────

  const timelineItems = useMemo(() => {
    if (!selectedDate) return [];
    const items: Array<{ kind: 'event'; data: CalendarEvent } | { kind: 'conflict'; data: Conflict }> = [];
    for (const ev of selectedEvents) {
      items.push({ kind: 'event', data: ev });
      for (const c of selectedConflicts) {
        if (c.eventA.id === ev.id) items.push({ kind: 'conflict', data: c });
      }
    }
    return items;
  }, [selectedEvents, selectedConflicts, selectedDate]);

  const dateLocale = getDateLocale(language);
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    format(new Date(2023, 0, 2 + i), 'EEEEE', { locale: dateLocale })
  );
  const dayLabel = selectedDate
    ? format(parseISO(selectedDate), t('dateFormat.dayMonth'), { locale: dateLocale })
    : null;

  const monthName = format(new Date(viewYear, viewMonth, 1), 'MMMM', { locale: dateLocale });
  const yearStr   = String(viewYear);

  const weekLabel = (() => {
    const days = buildWeekDays(weekStart);
    const s = format(days[0], 'd MMM', { locale: dateLocale });
    const e = format(days[6], 'd MMM yyyy', { locale: dateLocale });
    return `${s} – ${e}`;
  })();

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.terracotta]} tintColor={colors.terracotta} />}
      >

        {/* ── Cabecera: año + mes izquierda, toggle derecha ── */}
        <View style={st.header}>
          <Pressable onPress={() => viewMode === 'month' ? changeMonth('prev') : changeWeek('prev')} style={st.headerLeft}>
            {viewMode === 'month' ? (
              <>
                <Text style={st.yearLabel}>{yearStr}</Text>
                <Text style={st.monthName}>{monthName}</Text>
              </>
            ) : (
              <Text style={st.monthName}>{weekLabel}</Text>
            )}
          </Pressable>

          <View style={st.headerRight}>
            <View style={st.modeToggle}>
              <TouchableOpacity
                style={[st.modeBtn, viewMode === 'month' && st.modeBtnActive]}
                onPress={() => switchMode('month')}
                activeOpacity={0.75}
              >
                <Text style={[st.modeBtnTxt, viewMode === 'month' && st.modeBtnTxtActive]}>{t('calendar.viewMonth')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.modeBtn, viewMode === 'week' && st.modeBtnActive]}
                onPress={() => switchMode('week')}
                activeOpacity={0.75}
              >
                <Text style={[st.modeBtnTxt, viewMode === 'week' && st.modeBtnTxtActive]}>{t('calendar.viewWeek')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Búsqueda en card ── */}
        <View style={[st.searchCard, shadows.soft]}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} style={st.searchIcon} />
          <TextInput
            style={st.searchInput}
            placeholder={t('calendar.search')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textFaint} />
            </Pressable>
          )}
        </View>

        {/* ── Calendario en card ── */}
        <View style={[st.calCard, shadows.card]}>

        {/* Leyenda de áreas */}
        <View style={st.legend}>
          {LAYER_ORDER.map((layer) => (
            <View key={layer} style={st.legendItem}>
              <View style={[st.legendDot, { backgroundColor: LAYER_COLORS[layer] }]} />
              <Text style={st.legendLabel}>{t(`layers.${layer}`)}</Text>
            </View>
          ))}
        </View>

        {/* ── Encabezado días semana ── */}
        <View style={st.weekdayRow}>
          {weekdays.map((d, i) => (
            <Text
              key={i}
              style={[st.weekdayLabel, { width: CELL_W }, (i === 5 || i === 6) && st.weekdayLabelWeekend]}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* ── Vista mes ── */}
        {viewMode === 'month' && (
          <Animated.View style={[st.grid, { transform: [{ translateX: slideAnim }] }]}>
            {weeks.map((week, wi) => (
              <View key={wi} style={st.weekRow}>
                {week.map((day) => {
                  const key            = format(day, 'yyyy-MM-dd');
                  const inMonth        = isSameMonth(day, new Date(viewYear, viewMonth));
                  const isSelect       = selectedDate === key;
                  const isTodayD       = isToday(day);
                  const layers         = layersByDay.get(key);
                  const dots           = layers ? LAYER_ORDER.filter((l) => layers.has(l)) : [];
                  const dominantLayer  = dots[0] ?? null;
                  const isWeekend      = day.getDay() === 0 || day.getDay() === 6;
                  const tintBg = dominantLayer && inMonth ? (LAYER_COLORS[dominantLayer] + '0D') : undefined;
                  const isHoliday = inMonth && holidayMap.has(key);

                  return (
                    <View key={key} style={[{ width: CELL_W }, isHoliday && st.holidayCellBg]}>
                      <Pressable
                        style={({ pressed }) => [
                          st.dayCell,
                          isWeekend && inMonth && st.weekendCell,
                          tintBg ? { backgroundColor: tintBg } : undefined,
                          pressed && st.dayCellPressed,
                        ]}
                        onPress={() => handleDayPress(day)}
                      >
                        <View style={st.dayNumWrap}>
                          <View style={[
                            st.dayCircle,
                            isTodayD && !isSelect && st.todayCircle,
                            isSelect && st.selectedCircle,
                          ]}>
                            <Text style={[
                              st.dayText,
                              !inMonth  && st.outMonthText,
                              isWeekend && inMonth && !isTodayD && !isSelect && st.weekendText,
                              isTodayD && !isSelect && st.todayDayText,
                              isSelect && st.selectedDayText,
                            ]}>
                              {format(day, 'd')}
                            </Text>
                            {isSelect && isTodayD && <View style={st.todaySelectedDot} />}
                          </View>
                        </View>
                        <View style={st.dots}>
                          {dots.slice(0, 3).map((l) => (
                            <View key={l} style={[st.dot, { backgroundColor: LAYER_COLORS[l] }]} />
                          ))}
                          {dots.length === 0 && <View style={st.dotPlaceholder} />}
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </Animated.View>
        )}

        {/* ── Vista semana ── */}
        {viewMode === 'week' && (
          <View style={st.weekViewRow}>
            {weekDays.map((day) => {
              const key       = format(day, 'yyyy-MM-dd');
              const isSelect  = selectedDate === key;
              const isTodayD  = isToday(day);
              const layers    = layersByDay.get(key);
              const dots          = layers ? LAYER_ORDER.filter((l) => layers.has(l)) : [];
              const isWeekend     = day.getDay() === 0 || day.getDay() === 6;
              const isHolidayWk   = holidayMap.has(key);

              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    st.weekViewCell,
                    isWeekend && st.weekViewCellWeekend,
                    pressed && st.dayCellPressed,
                  ]}
                  onPress={() => handleDayPress(day)}
                >
                  {isHolidayWk && <View style={st.holidayCellBgOverlay} />}
                  <View style={st.dayNumWrap}>
                    <View style={[
                      st.weekViewCircle,
                      isTodayD && !isSelect && st.todayCircle,
                      isSelect && st.selectedCircle,
                    ]}>
                      <Text style={[
                        st.weekViewDayNum,
                        isWeekend && !isTodayD && !isSelect && st.weekendText,
                        isTodayD && !isSelect && st.todayDayText,
                        isSelect && st.selectedDayText,
                      ]}>
                        {format(day, 'd')}
                      </Text>
                    </View>
                  </View>
                  <View style={st.dots}>
                    {dots.slice(0, 3).map((l) => (
                      <View key={l} style={[st.dot, { backgroundColor: LAYER_COLORS[l] }]} />
                    ))}
                    {dots.length === 0 && <View style={st.dotPlaceholder} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        </View>{/* close calCard */}

        {/* ── Panel inferior: eventos del día ── */}
        {selectedDate && (
          <View style={[st.panel, shadows.card]}>
            <View style={st.panelHeader}>
              <Text style={st.panelTitle}>{dayLabel}</Text>
              <Text style={st.panelMonth}>{selectedDate ? format(parseISO(selectedDate), 'MMMM', { locale: dateLocale }).toUpperCase() : ''}</Text>
            </View>

            {selectedHoliday && (
              <View style={st.holidayRow}>
                <View style={st.holidayRowDot} />
                <Text style={st.holidayRowName}>{t(selectedHoliday.nameKey)}</Text>
                <Text style={st.holidayRowBadge}>{t('calendar.holiday')}</Text>
              </View>
            )}

            {searchQuery.trim() && filteredEvents.length === 0 ? (
              <View style={st.emptyState}>
                <Ionicons name="search-outline" size={28} color={colors.textDisabled} />
                <Text style={st.emptyTxt}>{t('calendar.noResults', { query: searchQuery })}</Text>
                <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                  <Text style={st.emptyAction}>{t('calendar.clearSearch')}</Text>
                </TouchableOpacity>
              </View>
            ) : timelineItems.length === 0 ? (
              <View style={st.emptyState}>
                <Ionicons name="calendar-outline" size={28} color={colors.textDisabled} />
                <Text style={st.emptyTxt}>{t('calendar.noScheduled')}</Text>
                <TouchableOpacity onPress={() => setSmartAddOpen(true)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('calendar.addEvent')}>
                  <Text style={st.emptyAction}>{t('calendar.addFirst')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              timelineItems
                .filter((item) =>
                  item.kind === 'conflict' || !searchQuery.trim() ||
                  item.data.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item, idx) =>
                  item.kind === 'event' ? (
                    <EventRow
                      key={item.data.id}
                      event={item.data}
                      accentColor={LAYER_COLORS[item.data.layer]}
                      timezone={USER_TIMEZONE}
                      onPress={() => openDetail(item.data)}
                    />
                  ) : (
                    <ConflictCard
                      key={item.data.id + '-' + idx}
                      conflict={item.data}
                      timezone={USER_TIMEZONE}
                      onEdit={(ev) => openEdit(ev)}
                    />
                  ),
                )
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

      <SmartAddSheet
        visible={smartAddOpen}
        onClose={() => setSmartAddOpen(false)}
        showSubtitle
        initialDate={selectedDate}
        mode="calendar"
      />

      <QuickAddSheet
        visible={sheetOpen}
        date={selectedDate ?? format(today, 'yyyy-MM-dd')}
        layer={null}
        timezone={USER_TIMEZONE}
        editEvent={editingEvent}
        onClose={() => { setSheetOpen(false); setEditingEvent(undefined); }}
      />

      <EventDetailSheet
        visible={!!detailEvent}
        event={detailEvent}
        timezone={USER_TIMEZONE}
        onClose={() => setDetailEvent(null)}
        onEdit={() => { if (detailEvent) openEdit(detailEvent); setDetailEvent(null); }}
        onDelete={(mode) => { if (detailEvent) confirmDelete(detailEvent, mode); }}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll:    { paddingBottom: 120 },

  // ── Búsqueda ──
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screenX,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 48,
  },
  searchIcon:  { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: fontSize.bodySm, color: colors.ink },

  // ── Cabecera ──
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexShrink: 0 },
  monthName: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  yearLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  // ── Calendar card ──
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

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWarm2,
    borderRadius: radius.pill,
    padding: 3,
  },
  modeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  modeBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  modeBtnTxt:       { fontSize: fontSize.label, fontWeight: fontWeight.semibold, color: colors.textMuted },
  modeBtnTxtActive: { color: colors.ink },

  // ── Leyenda ──
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.sm,
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: fontSize.label, color: colors.textSecondary, fontWeight: fontWeight.medium },

  // ── Días semana ──
  weekdayRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    textAlign: 'center',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.textFaint,
    letterSpacing: 0.5,
  },
  weekdayLabelWeekend: { color: '#C4A49A' },

  // ── Grilla mes ──
  grid:    { alignItems: 'stretch' },
  weekRow: { flexDirection: 'row', alignSelf: 'stretch' },

  dayCell: {
    alignItems: 'center',
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  dayCellPressed: {
    transform: [{ scale: 0.88 }],
    opacity: 0.7,
  },
  weekendCell: { backgroundColor: 'rgba(160, 140, 130, 0.04)' },

  // ── Vista semana ──
  weekViewRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekViewCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  weekViewCellWeekend: { backgroundColor: 'rgba(160, 140, 130, 0.04)' },
  weekViewCircle: {
    width: 42, height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekViewDayNum: { fontSize: 17, fontWeight: fontWeight.semibold, color: colors.ink },

  // Círculos del número (shared)
  dayNumWrap: { position: 'relative' },
  holidayCellBg:        { backgroundColor: '#FFD93D', borderRadius: radius.sm, margin: 2 },
  holidayCellBgOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFD93D',
    borderRadius: radius.md,
  },

  holidayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  holidayRowDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: HOLIDAY_GOLD, flexShrink: 0 },
  holidayRowName:  { flex: 1, fontSize: fontSize.bodySm, color: colors.ink, fontWeight: fontWeight.medium },
  holidayRowBadge: {
    fontSize: fontSize.micro, color: HOLIDAY_GOLD, fontWeight: fontWeight.semibold,
    backgroundColor: '#FDF8E8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm,
  },

  dayCircle: {
    width: 36, height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle:     { borderWidth: 1.5, borderColor: colors.terracotta },
  selectedCircle:  { backgroundColor: colors.terracotta },

  dayText:         { fontSize: fontSize.bodySm, color: colors.ink, fontWeight: fontWeight.regular },
  outMonthText:    { color: colors.textDisabled, fontSize: fontSize.caption },
  weekendText:     { color: '#8A7E78' },
  selectedDayText: { fontWeight: fontWeight.bold, color: colors.white },
  todayDayText:    { fontWeight: fontWeight.bold, color: colors.terracotta },
  todaySelectedDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
    position: 'absolute', bottom: 4,
  },

  // Puntos
  dots: {
    flexDirection: 'row',
    gap: 6,
    height: 10,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot:            { width: 8, height: 8, borderRadius: 4 },
  dotPlaceholder: { width: 7, height: 7 },

  // ── Panel inferior ──
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  panelTitle: { fontSize: fontSize.h3, fontWeight: fontWeight.bold, color: colors.ink, textTransform: 'capitalize' },
  panelMonth: { fontSize: fontSize.label, fontWeight: fontWeight.semibold, color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  emptyState: {
    alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm,
  },
  emptyTxt: {
    fontSize: fontSize.bodySm, color: colors.textFaint,
    textAlign: 'center',
  },
  emptyAction: {
    fontSize: fontSize.bodySm, fontWeight: fontWeight.semibold, color: colors.terracotta,
    paddingVertical: 6, paddingHorizontal: spacing.lg,
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 96,
    right: spacing["2xl"],
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: colors.ink,
    justifyContent: 'center', alignItems: 'center',
  },
});
