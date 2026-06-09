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
import { es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useEventsStore } from '@/features/events/eventsStore';
import { useDeleteEvent } from '@/features/events/useDeleteEvent';
import { QuickAddSheet } from '@/features/events/components/QuickAddSheet';
import { getLayersByDay, detectConflicts, getEventsForDay } from '@/features/overview/calendarUtils';
import {
  LAYER_COLORS,
  LAYER_LABELS,
  type Layer,
  type CalendarEvent,
  type Conflict,
} from '@/features/overview/types';
import { EventRow } from '@/features/overview/components/EventRow';
import { ConflictCard } from '@/features/overview/components/ConflictCard';
import { EventDetailSheet } from '@/features/overview/components/EventDetailSheet';

// ─── Constantes ───────────────────────────────────────────────────────────────

const BG             = '#F8F6F2';
const TODAY_COLOR    = '#C8553D';
const WEEKDAYS       = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
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
  const { width: winW } = useWindowDimensions();
  const CELL_W = (winW - 24) / 7;
  const today = new Date();

  // ── Vista mes ─────────────────────────────────────────────────────────────
  const [viewMode,     setViewMode]     = useState<'month' | 'week'>('month');
  const [viewYear,     setViewYear]     = useState(today.getFullYear());
  const [viewMonth,    setViewMonth]    = useState(today.getMonth());
  // ── Vista semana ──────────────────────────────────────────────────────────
  const [weekStart,    setWeekStart]    = useState(() => startOfWeek(today, { weekStartsOn: 1 }));

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [detailEvent,  setDetailEvent]  = useState<CalendarEvent | null>(null);
  const [animating,    setAnimating]    = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [refreshing,   setRefreshing]   = useState(false);
  const qc = useQueryClient();

  const slideAnim = useRef(new Animated.Value(0)).current;

  const events               = useEventsStore((s) => s.events);
  const { mutate: doDelete } = useDeleteEvent();

  const weeks = useMemo(
    () => buildCalendarWeeks(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);

  // Reference date for layersByDay
  const refDate = viewMode === 'week' ? weekStart : new Date(viewYear, viewMonth);

  const layersByDay = useMemo(
    () => getLayersByDay(events, refDate, USER_TIMEZONE),
    [events, refDate],
  );

  const selectedEvents = useMemo(
    () => (selectedDate ? getEventsForDay(events, selectedDate, USER_TIMEZONE) : []),
    [events, selectedDate],
  );

  const selectedConflicts = useMemo(
    () => detectConflicts(selectedEvents),
    [selectedEvents],
  );

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

  // ── Animación de cambio de mes ─────────────────────────────────────────────

  function changeMonth(dir: 'prev' | 'next') {
    if (animating) return;
    setAnimating(true);
    const outX  = dir === 'next' ? -280 : 280;
    const inX   = dir === 'next' ?  280 : -280;
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
      // Sync week to selected date or today
      const base = selectedDate ? parseISO(selectedDate) : today;
      setWeekStart(startOfWeek(base, { weekStartsOn: 1 }));
    } else {
      // Sync month to week's month
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

  const dayLabel = selectedDate
    ? format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })
    : null;

  const monthName = format(new Date(viewYear, viewMonth, 1), 'MMMM', { locale: es });
  const yearStr   = String(viewYear);

  // Week header label: "9 – 15 jun"
  const weekLabel = (() => {
    const days = buildWeekDays(weekStart);
    const s = format(days[0], 'd MMM', { locale: es });
    const e = format(days[6], 'd MMM yyyy', { locale: es });
    return `${s} – ${e}`;
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TODAY_COLOR]} tintColor={TODAY_COLOR} />}
      >

        {/* ── Cabecera ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => viewMode === 'month' ? changeMonth('prev') : changeWeek('prev')}
            style={styles.navBtn}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>

          <View style={styles.monthTitleGroup}>
            {viewMode === 'month' ? (
              <>
                <Text style={styles.monthName}>{monthName}</Text>
                <Text style={styles.yearLabel}>{yearStr}</Text>
              </>
            ) : (
              <Text style={styles.monthName}>{weekLabel}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => viewMode === 'month' ? changeMonth('next') : changeWeek('next')}
            style={styles.navBtn}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="chevron-forward" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* ── Toggle mes / semana ── */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'month' && styles.modeBtnActive]}
            onPress={() => switchMode('month')}
            activeOpacity={0.75}
          >
            <Text style={[styles.modeBtnTxt, viewMode === 'month' && styles.modeBtnTxtActive]}>{t('calendar.viewMonth')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'week' && styles.modeBtnActive]}
            onPress={() => switchMode('week')}
            activeOpacity={0.75}
          >
            <Text style={[styles.modeBtnTxt, viewMode === 'week' && styles.modeBtnTxtActive]}>{t('calendar.viewWeek')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Búsqueda ── */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color="#AAAAAA" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('calendar.search')}
            placeholderTextColor="#AAAAAA"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#BBBBBB" />
            </Pressable>
          )}
        </View>

        {/* ── Leyenda de áreas ── */}
        <View style={styles.legend}>
          {LAYER_ORDER.map((layer) => (
            <View key={layer} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: LAYER_COLORS[layer] }]} />
              <Text style={styles.legendLabel}>{LAYER_LABELS[layer]}</Text>
            </View>
          ))}
        </View>

        {/* ── Encabezado días semana ── */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((d, i) => (
            <Text
              key={d}
              style={[styles.weekdayLabel, { width: CELL_W }, (i === 5 || i === 6) && styles.weekdayLabelWeekend]}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* ── Vista mes ── */}
        {viewMode === 'month' && (
          <Animated.View style={[styles.grid, { transform: [{ translateX: slideAnim }] }]}>
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
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

                  return (
                    <View key={key} style={{ width: CELL_W }}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.dayCell,
                          isWeekend && inMonth && styles.weekendCell,
                          tintBg ? { backgroundColor: tintBg } : undefined,
                          pressed && styles.dayCellPressed,
                        ]}
                        onPress={() => handleDayPress(day)}
                      >
                        <View style={[
                          styles.dayCircle,
                          isTodayD && !isSelect && styles.todayCircle,
                          isSelect && styles.selectedCircle,
                        ]}>
                          <Text style={[
                            styles.dayText,
                            !inMonth  && styles.outMonthText,
                            isWeekend && inMonth && !isTodayD && !isSelect && styles.weekendText,
                            isTodayD && !isSelect && styles.todayDayText,
                            isSelect && styles.selectedDayText,
                          ]}>
                            {format(day, 'd')}
                          </Text>
                          {isSelect && isTodayD && <View style={styles.todaySelectedDot} />}
                        </View>
                        <View style={styles.dots}>
                          {dots.slice(0, 3).map((l) => (
                            <View key={l} style={[styles.dot, { backgroundColor: LAYER_COLORS[l] }]} />
                          ))}
                          {dots.length === 0 && <View style={styles.dotPlaceholder} />}
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
          <View style={styles.weekViewRow}>
            {weekDays.map((day) => {
              const key       = format(day, 'yyyy-MM-dd');
              const isSelect  = selectedDate === key;
              const isTodayD  = isToday(day);
              const layers    = layersByDay.get(key);
              const dots      = layers ? LAYER_ORDER.filter((l) => layers.has(l)) : [];
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.weekViewCell,
                    isWeekend && styles.weekViewCellWeekend,
                    pressed && styles.dayCellPressed,
                  ]}
                  onPress={() => handleDayPress(day)}
                >
                  <View style={[
                    styles.weekViewCircle,
                    isTodayD && !isSelect && styles.todayCircle,
                    isSelect && styles.selectedCircle,
                  ]}>
                    <Text style={[
                      styles.weekViewDayNum,
                      isWeekend && !isTodayD && !isSelect && styles.weekendText,
                      isTodayD && !isSelect && styles.todayDayText,
                      isSelect && styles.selectedDayText,
                    ]}>
                      {format(day, 'd')}
                    </Text>
                  </View>
                  <View style={styles.dots}>
                    {dots.slice(0, 3).map((l) => (
                      <View key={l} style={[styles.dot, { backgroundColor: LAYER_COLORS[l] }]} />
                    ))}
                    {dots.length === 0 && <View style={styles.dotPlaceholder} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Panel inferior: eventos del día ── */}
        {selectedDate && (
          <View style={[
            styles.panel,
            timelineItems.length > 0 && selectedEvents[0]
              ? { borderLeftWidth: 3, borderLeftColor: LAYER_COLORS[selectedEvents[0].layer] }
              : undefined,
          ]}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>
                {selectedEvents.length > 0 ? t('calendar.eventsTitle') : t('calendar.noEvents')}
              </Text>
              <Text style={styles.panelDate}>{dayLabel}</Text>
            </View>

            {searchQuery.trim() && filteredEvents.length === 0 ? (
              <Text style={styles.emptyTxt}>{t('calendar.noResults', { query: searchQuery })}</Text>
            ) : timelineItems.length === 0 ? (
              <Text style={styles.emptyTxt}>{t('calendar.noScheduled')}</Text>
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
                      onResolve={(c) => console.log('[resolve]', c.id)}
                    />
                  ),
                )
            )}
          </View>
        )}
      </ScrollView>

      {/* ── FAB añadir evento ── */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={openCreate}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── Sheet crear / editar ── */}
      <QuickAddSheet
        visible={sheetOpen}
        date={selectedDate ?? format(today, 'yyyy-MM-dd')}
        layer={null}
        timezone={USER_TIMEZONE}
        editEvent={editingEvent}
        onClose={() => { setSheetOpen(false); setEditingEvent(undefined); }}
      />

      {/* ── Sheet detalle de evento ── */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll:    { paddingBottom: 120 },

  // ── Búsqueda ──
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: '#F8F6F2',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E5E0',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },

  // ── Cabecera ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  navBtn: { padding: 4 },
  monthTitleGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  monthName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  yearLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#AAAAAA',
    letterSpacing: 0.2,
  },

  // ── Toggle ──
  modeToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#EEEBE6',
    borderRadius: 20,
    padding: 3,
    marginBottom: 12,
  },
  modeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 17,
  },
  modeBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  modeBtnTxt:       { fontSize: 13, fontWeight: '600', color: '#888888' },
  modeBtnTxtActive: { color: '#1A1A1A' },

  // ── Leyenda ──
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 13, color: '#6B6B6B', fontWeight: '500' },

  // ── Días semana ──
  weekdayRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  weekdayLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#BBBBBB',
    letterSpacing: 0.5,
  },
  weekdayLabelWeekend: { color: '#C4A49A' },

  // ── Grilla mes ──
  grid:    { paddingHorizontal: 12, alignItems: 'stretch' },
  weekRow: { flexDirection: 'row', alignSelf: 'stretch' },

  dayCell: {
    alignItems: 'center',
    paddingVertical: 3,
    borderRadius: 10,
  },
  dayCellPressed: {
    transform: [{ scale: 0.88 }],
    opacity: 0.7,
  },
  weekendCell: { backgroundColor: 'rgba(160, 140, 130, 0.05)' },

  // ── Vista semana ──
  weekViewRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  weekViewCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  weekViewCellWeekend: { backgroundColor: 'rgba(160, 140, 130, 0.05)' },
  weekViewCircle: {
    width: 42, height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekViewDayNum: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },

  // Círculos del número (shared)
  dayCircle: {
    width: 36, height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle:     { borderWidth: 1.5, borderColor: TODAY_COLOR },
  selectedCircle:  { backgroundColor: TODAY_COLOR },

  dayText:         { fontSize: 14, color: '#1A1A1A', fontWeight: '400' },
  outMonthText:    { color: '#D0CCC7', fontSize: 12 },
  weekendText:     { color: '#8A7E78' },
  selectedDayText: { fontWeight: '700', color: '#FFFFFF' },
  todayDayText:    { fontWeight: '700', color: TODAY_COLOR },
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
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  panelTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.2 },
  panelDate:  { fontSize: 13, color: '#AAAAAA', textTransform: 'capitalize' },
  emptyTxt: {
    fontSize: 14, color: '#BBBBBB',
    textAlign: 'center', paddingVertical: 20,
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 96,
    right: 24,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#1E2A4A',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
});
