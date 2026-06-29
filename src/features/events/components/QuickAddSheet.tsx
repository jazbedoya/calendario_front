import { useRef, useEffect, useState, useMemo } from "react";
import {
  Alert,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { useLanguageStore } from "@/features/settings/languageStore";
import { getDateLocale } from "@/i18n/dateLocale";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { z } from "zod";
import { useEventsStore } from "../eventsStore";
import { useCreateEvent } from "../useCreateEvent";
import { useUpdateEvent } from "../useUpdateEvent";
import { detectConflicts, getEventsForDay } from "@/features/overview/calendarUtils";
import { LAYER_COLORS, type CalendarEvent, type Layer } from "@/features/overview/types";

const titleSchema = z.string().min(1);
const LAYERS: Layer[] = ["family", "work", "personal"];
const MINUTE_CHIPS = [0, 15, 30, 45] as const;

type RecurrenceRule = 'daily' | 'weekly' | 'monthly';
const RECURRENCE_KEYS: { value: RecurrenceRule | null; tKey: string }[] = [
  { value: null,      tKey: 'eventSheet.recurrence.none'    },
  { value: 'daily',   tKey: 'eventSheet.recurrence.daily'   },
  { value: 'weekly',  tKey: 'eventSheet.recurrence.weekly'  },
  { value: 'monthly', tKey: 'eventSheet.recurrence.monthly' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface QuickAddSheetProps {
  visible:       boolean;
  date:          string;           // 'yyyy-MM-dd'; en modo edición se ignora (se usa startAt del evento)
  layer:         Layer | null;     // null → mostrar selector de capa (calendario general)
  timezone:      string;
  editEvent?:    CalendarEvent;    // si se pasa → modo edición
  initialTitle?: string;           // pre-rellena el título al abrir (solo en modo creación)
  onClose:       () => void;
  onSaved?:      (event: CalendarEvent) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickAddSheet({
  visible,
  date,
  layer,
  timezone,
  editEvent,
  initialTitle,
  onClose,
  onSaved,
}: QuickAddSheetProps) {
  const isEdit    = !!editEvent;
  const slideAnim = useRef(new Animated.Value(320)).current;
  const inputRef  = useRef<TextInput>(null);

  const { t } = useTranslation();
  const language = useLanguageStore((s) => s.language);
  const RECURRENCE_OPTIONS = RECURRENCE_KEYS.map((o) => ({ ...o, label: t(o.tKey) }));

  const [title,           setTitle]           = useState("");
  const [hour,            setHour]            = useState(9);
  const [hourStr,         setHourStr]         = useState("09");
  const [minute,          setMinute]          = useState(0);
  const [selectedLayer,   setSelectedLayer]   = useState<Layer | null>(layer);
  const [recurrenceRule,  setRecurrenceRule]  = useState<RecurrenceRule | null>(null);
  const [saving,          setSaving]          = useState(false);

  const events                  = useEventsStore((s) => s.events);
  const { mutateAsync: create } = useCreateEvent();
  const { mutateAsync: update } = useUpdateEvent();

  // Capa y color efectivos
  const effectiveLayer = layer ?? selectedLayer;
  const effectiveColor = effectiveLayer ? LAYER_COLORS[effectiveLayer] : "#AAAAAA";

  // ── Abrir / cerrar ────────────────────────────────────────────────────────

  useEffect(() => {
    if (visible) {
      if (isEdit && editEvent) {
        setTitle(editEvent.title);
        const startTz = formatInTimeZone(parseISO(editEvent.startAt), timezone, "HH:mm");
        const [h, m]  = startTz.split(":").map(Number);
        setHour(h); setHourStr(String(h).padStart(2, "0"));
        setMinute((MINUTE_CHIPS as readonly number[]).includes(m) ? m : 0);
        setSelectedLayer(layer ?? editEvent.layer);
      } else {
        setTitle(initialTitle ?? "");
        const h = new Date().getHours();
        const initH = h < 22 ? h + 1 : 9;
        setHour(initH); setHourStr(String(initH).padStart(2, "0"));
        setMinute(0);
        setSelectedLayer(layer);
        setRecurrenceRule(null);
      }
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true })
        .start(() => inputRef.current?.focus());
    } else {
      Keyboard.dismiss();
      Animated.timing(slideAnim, { toValue: 320, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  // ── Fecha activa ──────────────────────────────────────────────────────────

  const activeDate = isEdit && editEvent
    ? formatInTimeZone(parseISO(editEvent.startAt), timezone, "yyyy-MM-dd")
    : date;

  // ── Draft para detección de conflictos ───────────────────────────────────

  const draftEvent = useMemo<CalendarEvent>(() => {
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    const eh = String((hour + 1) % 24).padStart(2, "0");
    return {
      id:       isEdit ? editEvent!.id : "__draft__",
      title:    title.trim() || "Nuevo evento",
      startAt:  fromZonedTime(`${activeDate}T${hh}:${mm}:00`, timezone).toISOString(),
      endAt:    fromZonedTime(`${activeDate}T${eh}:${mm}:00`, timezone).toISOString(),
      isAllDay: false,
      layer:    effectiveLayer ?? "work",
    };
  }, [activeDate, hour, minute, effectiveLayer, timezone, title]);

  const dayEvents = useMemo(
    () => getEventsForDay(events, activeDate, timezone).filter((e) => e.id !== draftEvent.id),
    [events, activeDate, timezone, draftEvent.id],
  );

  const conflicts = useMemo(
    () => detectConflicts([...dayEvents, draftEvent]),
    [dayEvents, draftEvent],
  );

  const canSave = titleSchema.safeParse(title.trim()).success && effectiveLayer !== null && !saving;

  // ── Guardar ───────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!canSave || !effectiveLayer) return;
    setSaving(true);
    try {
      let event: CalendarEvent;
      if (isEdit && editEvent) {
        event = await update({ id: editEvent.id, title: title.trim(), date: activeDate, hour, minute, timezone, layer: effectiveLayer });
      } else {
        event = await create({ title: title.trim(), date: activeDate, hour, minute, timezone, layer: effectiveLayer, recurrenceRule: recurrenceRule ?? undefined });
      }
      onSaved?.(event);
      onClose();
    } catch {
      Alert.alert(
        t('eventSheet.errorTitle'),
        t('eventSheet.errorMsg'),
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const headerDate = format(parseISO(activeDate), t('dateFormat.dayMonth'), { locale: getDateLocale(language) });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => { Keyboard.dismiss(); onClose(); }} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.kav} pointerEvents="box-none">
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Cabecera: dot + fecha + cerrar */}
          <View style={s.headerRow}>
            <View style={[s.layerDot, { backgroundColor: effectiveColor }]} />
            <Text style={s.headerDate}>{headerDate}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#AAAAAA" />
            </TouchableOpacity>
          </View>

          {/* Selector de capa (solo cuando layer=null) */}
          {layer === null && (
            <View style={s.layerPicker}>
              {LAYERS.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[s.layerChip, selectedLayer === l && { backgroundColor: LAYER_COLORS[l] }]}
                  onPress={() => setSelectedLayer(l)}
                  activeOpacity={0.75}
                >
                  <View style={[s.layerChipDot, { backgroundColor: LAYER_COLORS[l] }]} />
                  <Text style={[s.layerChipTxt, selectedLayer === l && s.layerChipTxtActive]}>
                    {t(`layers.${l}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Input título */}
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder={t('eventSheet.titlePlaceholder')}
            placeholderTextColor="#CCCCCC"
            value={title}
            onChangeText={setTitle}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            maxLength={80}
          />

          {/* Selector de hora */}
          <View style={s.timeRow}>
            <TextInput
              style={s.hourText}
              value={hourStr}
              onChangeText={(t) => {
                const clean = t.replace(/[^0-9]/g, "").slice(0, 2);
                setHourStr(clean);
                const n = parseInt(clean, 10);
                if (!isNaN(n) && n >= 0 && n <= 23) setHour(n);
              }}
              onBlur={() => setHourStr(String(hour).padStart(2, "0"))}
              keyboardType="numeric"
              maxLength={2}
              selectTextOnFocus
            />
            <Text style={s.colon}>:</Text>
            <View style={s.chipRow}>
              {MINUTE_CHIPS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[s.chip, minute === m && { backgroundColor: effectiveColor }]}
                  onPress={() => setMinute(m)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.chipTxt, minute === m && s.chipTxtActive]}>
                    {String(m).padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selector de repetición (solo en creación) */}
          {!isEdit && (
            <View style={s.recurrenceRow}>
              <Ionicons name="repeat-outline" size={16} color="#AAAAAA" style={{ marginTop: 1 }} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recurrenceScroll}>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[
                      s.recurrenceChip,
                      recurrenceRule === opt.value && { backgroundColor: effectiveColor, borderColor: effectiveColor },
                    ]}
                    onPress={() => setRecurrenceRule(opt.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.recurrenceChipTxt, recurrenceRule === opt.value && s.recurrenceChipTxtActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Aviso suave de conflicto */}
          {conflicts.length > 0 && (() => {
            const c = conflicts[0];
            const timeA = formatInTimeZone(parseISO(c.eventA.startAt), timezone, "HH:mm");
            const timeB = formatInTimeZone(parseISO(c.eventB.startAt), timezone, "HH:mm");
            return (
              <View style={s.warning}>
                <Ionicons name="warning-outline" size={14} color="#D97706" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.warningTxt}>{c.eventA.title} · <Text style={s.warningTime}>{timeA}</Text></Text>
                  <Text style={s.warningTxt}>{c.eventB.title} · <Text style={s.warningTime}>{timeB}</Text></Text>
                </View>
              </View>
            );
          })()}

          {/* Botón guardar */}
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: effectiveColor }, !canSave && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Text style={s.saveBtnTxt}>
              {saving ? (isEdit ? t('eventSheet.updating') : t('eventSheet.saving')) : (isEdit ? t('eventSheet.update') : t('eventSheet.save'))}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  kav:      { position: "absolute", bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    paddingTop: 12,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 16,
  },
  handle: {
    alignSelf: "center", width: 40, height: 4,
    borderRadius: 2, backgroundColor: "#E0E0E0", marginBottom: 4,
  },

  headerRow:  { flexDirection: "row", alignItems: "center", gap: 10 },
  layerDot:   { width: 10, height: 10, borderRadius: 5 },
  headerDate: { flex: 1, fontSize: 17, fontWeight: "700", color: "#2D2D2D" },

  // Selector de capa
  layerPicker: { flexDirection: "row", gap: 8 },
  layerChip: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 9, borderRadius: 12,
    backgroundColor: "#F3F3F3", borderWidth: 1.5, borderColor: "#EEEEEE",
  },
  layerChipDot:     { width: 8, height: 8, borderRadius: 4 },
  layerChipTxt:     { fontSize: 13, fontWeight: "600", color: "#666666" },
  layerChipTxtActive: { color: "#FFFFFF" },

  input: {
    borderWidth: 1, borderColor: "#EEEEEE", borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 16, color: "#2D2D2D", backgroundColor: "#FAFAFA",
  },

  timeRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
  hourText: {
    fontSize: 28, fontWeight: "700", color: "#2D2D2D", letterSpacing: 1,
    minWidth: 52, textAlign: "center",
    borderWidth: 1.5, borderColor: "#EEEEEE", borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 4, backgroundColor: "#FAFAFA",
  },
  colon:      { fontSize: 26, fontWeight: "700", color: "#BBBBBB", marginTop: -6 },
  chipRow:    { flex: 1, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip:       { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#F3F3F3" },
  chipTxt:    { fontSize: 15, fontWeight: "600", color: "#666666" },
  chipTxtActive: { color: "#FFFFFF" },

  recurrenceRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  recurrenceScroll: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  recurrenceChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: "#EEEEEE", backgroundColor: "#F8F8F8",
  },
  recurrenceChipTxt:       { fontSize: 13, fontWeight: "600", color: "#666666" },
  recurrenceChipTxtActive: { color: "#FFFFFF" },

  warning: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#FFFBEB", borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: "#F59E0B",
  },
  warningTxt: { fontSize: 13, color: "#92400E", lineHeight: 19 },
  warningTime: { fontWeight: "700" },

  saveBtn:         { paddingVertical: 15, borderRadius: 16, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnTxt:      { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
