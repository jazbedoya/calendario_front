import { useEffect, useRef, useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useLanguageStore } from "@/features/settings/languageStore";
import { getDateLocale } from "@/i18n/dateLocale";

import { fromZonedTime } from "date-fns-tz";
import { formatInTimeZone } from "date-fns-tz";

import { TugaAnimation } from "@/features/mascot/TugaAnimation";
import { parseTaskInput } from "./parseTaskInput";
import { useCreateTask } from "./hooks";
import { useCreateEvent } from "@/features/events/useCreateEvent";
import { useEventsStore } from "@/features/events/eventsStore";
import { detectConflicts, getEventsForDay } from "@/features/overview/calendarUtils";
import { LAYER_COLORS, type Layer, type CalendarEvent } from "@/features/overview/types";

// ── Tokens del diseño (avante-anadir-tarea-tokens.css) ──────────────────────

const T = {
  // Surfaces
  bg:           "#F8F6F2",
  surface:      "#FFFFFF",
  surfaceRead:  "#FBF8F3",
  surfaceWarm:  "#F1ECE2",
  hairline:     "#F1ECE2",
  border:       "#ECE4D6",
  borderRead:   "#F0E9DD",

  // Text
  ink:          "#1E2A4A",
  textSecondary:"#5A554A",
  textMuted:    "#9A9384",
  textFaint:    "#B3AB9A",
  placeholder:  "#BBB3A2",
  tugaQuote:    "#5C7068",
  tugaEyebrow:  "#9AA89E",

  // Accent
  terracotta:   "#C8553D",
  terracottaDeep:"#D2603F",
  catEmpty:     "#C6BEAE",

  // Areas
  family:       "#E89B53",
  work:         "#3D6B5F",
  personal:     "#5B5193",

  white:        "#FFFFFF",
} as const;

const LAYERS: Layer[] = ["family", "work", "personal"];

interface Props {
  visible: boolean;
  onClose: () => void;
  showSubtitle?: boolean;
  initialDate?: string | null;
  mode?: "calendar" | "task"; // calendar = solo evento, task = solo tarea diaria
  initialLayer?: Layer | null; // layer del área desde donde se abre
}

export function SmartAddSheet({ visible, onClose, showSubtitle = false, initialDate, mode = "task", initialLayer }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null);
  const [saving, setSaving] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { mutateAsync: createTask } = useCreateTask();
  const { mutateAsync: createEvent } = useCreateEvent();
  const qc = useQueryClient();

  const parsed = useMemo(() => parseTaskInput(text), [text]);
  const hasParsed = parsed.title.length > 0 && (parsed.hour !== null || parsed.layer !== null || parsed.dayName !== null || !!initialDate);

  const effectiveLayer = selectedLayer ?? parsed.layer ?? initialLayer;

  // ── Conflict detection ───────────────────────────────────────────────────
  const events = useEventsStore((s) => s.events);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const conflicts = useMemo(() => {
    if (mode !== "calendar" || parsed.hour === null) return [];
    const eventDate = parsed.date ?? initialDate ?? format(new Date(), "yyyy-MM-dd");
    const hh = String(parsed.hour).padStart(2, "0");
    const mm = String(parsed.minute ?? 0).padStart(2, "0");
    const eh = String((parsed.hour + 1) % 24).padStart(2, "0");
    const draft: CalendarEvent = {
      id: "__draft__",
      title: parsed.title || "New",
      startAt: fromZonedTime(`${eventDate}T${hh}:${mm}:00`, tz).toISOString(),
      endAt: fromZonedTime(`${eventDate}T${eh}:${mm}:00`, tz).toISOString(),
      isAllDay: false,
      layer: effectiveLayer ?? "work",
    };
    const dayEvts = getEventsForDay(events, eventDate, tz);
    return detectConflicts([...dayEvts, draft]);
  }, [mode, parsed.hour, parsed.minute, parsed.date, parsed.title, initialDate, effectiveLayer, events, tz]);

  useEffect(() => {
    if (visible) {
      setText("");
      setSelectedLayer(null);
      setShowMore(false);
      setSaving(false);
      setRecurrence(null);
      setSavedMsg(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      Keyboard.dismiss();
    }
  }, [visible]);

  function handleClose() {
    Keyboard.dismiss();
    onClose();
  }

  async function handleCreate() {
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      if (mode === "task") {
        await createTask(parsed.title || trimmed);
      }
      if (mode === "calendar") {
        const today = format(new Date(), "yyyy-MM-dd");
        const eventDate = parsed.date ?? initialDate ?? today;
        if (parsed.hour !== null) {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          await createEvent({
            title: parsed.title || trimmed,
            date: eventDate,
            hour: parsed.hour,
            minute: parsed.minute ?? 0,
            timezone: tz,
            layer: effectiveLayer ?? "work",
            recurrenceRule: recurrence ?? undefined,
          });
        }
      }
      qc.invalidateQueries({ queryKey: ["events"] });
      setSaving(false);
      setSavedMsg(true);
      setTimeout(() => {
        setSavedMsg(false);
        handleClose();
      }, 1800);
    } catch {
      setSaving(false);
      // mutation hooks show Alert
    }
  }

  const canCreate = text.trim().length > 0 && (mode === "task" || parsed.hour !== null) && !saving;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.flex}
        >
          <ScrollView
            style={s.flex}
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Close button */}
            <View style={s.headerRow}>
              <View style={s.flex} />
              <TouchableOpacity onPress={handleClose} hitSlop={12} style={s.closeBtn}>
                <Ionicons name="close" size={22} color={T.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Tuga + eyebrow */}
            <View style={s.tugaRow}>
              <View style={s.tugaFrame}>
                <TugaAnimation state="idle" size={32} />
              </View>
              <View style={s.tugaTextCol}>
                <Text style={s.tugaEyebrow}>{t("smartAdd.eyebrow")}</Text>
                {showSubtitle && <Text style={s.tugaQuote}>{t("smartAdd.subtitle")}</Text>}
              </View>
            </View>

            {/* Input card */}
            <View style={s.inputCard}>
              <TextInput
                ref={inputRef}
                style={s.textArea}
                placeholder={t(showSubtitle ? "smartAdd.placeholderCalendar" : "smartAdd.placeholder")}
                placeholderTextColor={T.placeholder}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={200}
                textAlignVertical="top"
              />
            </View>

            {/* Parsed section */}
            {hasParsed && (
              <>
                <Text style={s.parsedEyebrow}>{t("smartAdd.understands")}</Text>
                <View style={s.parsedCard}>
                  {/* Tarea */}
                  <View style={s.parsedRow}>
                    <Ionicons name="checkbox-outline" size={20} color={T.ink} />
                    <View style={s.parsedInfo}>
                      <Text style={s.parsedMeta}>{t("smartAdd.task")}</Text>
                      <Text style={s.parsedValue}>{parsed.title}</Text>
                    </View>
                  </View>

                  {/* Hairline */}
                  <View style={s.divider} />

                  {/* Cuando */}
                  {(parsed.dayName || parsed.hour !== null || initialDate) && (
                    <>
                      <View style={s.parsedRow}>
                        <Ionicons name="calendar-outline" size={20} color={T.ink} />
                        <View style={s.parsedInfo}>
                          <Text style={s.parsedMeta}>{t("smartAdd.when")}</Text>
                          <Text style={s.parsedValue}>
                            {[
                              parsed.dayName ?? (initialDate ? format(parseISO(initialDate), "EEEE d", { locale: getDateLocale(useLanguageStore.getState().language) }) : t("smartAdd.today")),
                              parsed.hour !== null
                                ? `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute ?? 0).padStart(2, "0")}`
                                : null,
                            ].filter(Boolean).join(" · ")}
                          </Text>
                        </View>
                        <TouchableOpacity hitSlop={8}>
                          <Text style={s.editLink}>{t("smartAdd.edit")}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={s.divider} />
                    </>
                  )}

                  {/* Categoria */}
                  <View style={s.parsedRow}>
                    <View style={[s.catIndicator, { backgroundColor: effectiveLayer ? LAYER_COLORS[effectiveLayer] : T.catEmpty }]} />
                    <View style={s.parsedInfo}>
                      <Text style={s.parsedMeta}>{t("smartAdd.category")}</Text>
                      <Text style={s.parsedValue}>
                        {effectiveLayer ? t(`layers.${effectiveLayer}`) : t("smartAdd.noCategory")}
                      </Text>
                    </View>
                    <View style={s.catDots}>
                      {LAYERS.map((key) => (
                        <TouchableOpacity key={key} onPress={() => setSelectedLayer(key)} activeOpacity={0.7}>
                          <View
                            style={[
                              s.catDot,
                              { backgroundColor: LAYER_COLORS[key] },
                              effectiveLayer === key && s.catDotSelected,
                              effectiveLayer !== null && effectiveLayer !== key && s.catDotDimmed,
                            ]}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* More options */}
            {hasParsed && (
              <>
                <TouchableOpacity style={s.moreRow} onPress={() => setShowMore(!showMore)} activeOpacity={0.7}>
                  <Text style={s.moreText}>{t("smartAdd.moreOptions")}</Text>
                  <Ionicons name={showMore ? "chevron-up" : "chevron-down"} size={16} color={T.textMuted} />
                </TouchableOpacity>

                {showMore && (
                  <View style={s.moreCard}>
                    <View style={s.moreSection}>
                      <View style={s.moreLabelRow}>
                        <Ionicons name="repeat-outline" size={18} color={T.ink} />
                        <Text style={s.moreSectionLabel}>{t("smartAdd.repeat")}</Text>
                      </View>
                      <View style={s.recurrenceChips}>
                        {([null, 'daily', 'weekly', 'monthly'] as const).map((val) => {
                          const active = recurrence === val;
                          return (
                            <TouchableOpacity
                              key={String(val)}
                              style={[
                                s.recChip,
                                active && { backgroundColor: T.terracotta, borderColor: T.terracotta },
                              ]}
                              onPress={() => setRecurrence(val)}
                              activeOpacity={0.75}
                            >
                              <Text style={[s.recChipText, active && { color: T.white }]}>
                                {t(`smartAdd.recurrence.${val ?? 'none'}`)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
            {/* Conflict warning */}
            {conflicts.length > 0 && (() => {
              const c = conflicts[0];
              const timeA = formatInTimeZone(parseISO(c.eventA.startAt), tz, "HH:mm");
              const timeB = formatInTimeZone(parseISO(c.eventB.startAt), tz, "HH:mm");
              return (
                <View style={s.conflictCard}>
                  <Ionicons name="warning-outline" size={16} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.conflictTitle}>{t("smartAdd.conflict")}</Text>
                    <Text style={s.conflictDetail}>
                      {c.eventA.title} · {timeA}
                    </Text>
                    <Text style={s.conflictDetail}>
                      {c.eventB.title} · {timeB}
                    </Text>
                    <Text style={s.conflictHint}>{t("smartAdd.conflictHint")}</Text>
                  </View>
                </View>
              );
            })()}
          </ScrollView>

          {/* CTA fixed at bottom */}
          <View style={s.ctaContainer}>
            {savedMsg ? (
              <View style={s.savedBanner}>
                <Ionicons name="checkmark-circle" size={22} color="#3D6B5F" />
                <Text style={s.savedText}>{t("smartAdd.saved")}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[s.ctaBtn, !canCreate && s.ctaBtnDisabled]}
                onPress={handleCreate}
                disabled={!canCreate}
                activeOpacity={0.85}
              >
                <Text style={s.ctaText}>
                  {saving ? t("smartAdd.creating") : t("smartAdd.create")}
                </Text>
                {!saving && <Ionicons name="arrow-forward" size={20} color={T.white} style={{ marginLeft: 6 }} />}
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles (tokens: avante-anadir-tarea-tokens.css) ─────────────────────────

const SCREEN_X = 24;

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },
  flex: { flex: 1 },
  scroll: {
    paddingBottom: 100,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SCREEN_X,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: T.surfaceWarm,
    alignItems: "center", justifyContent: "center",
  },

  // Tuga
  tugaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: SCREEN_X,
    marginTop: 22,
  },
  tugaFrame: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: T.surfaceWarm,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  tugaTextCol: { flex: 1 },
  tugaEyebrow: {
    fontSize: 10.5,
    fontWeight: "600",
    color: T.tugaEyebrow,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  tugaQuote: {
    fontSize: 17,
    color: T.tugaQuote,
    fontStyle: "italic",
    marginTop: 2,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
  },

  // Input card
  inputCard: {
    marginHorizontal: SCREEN_X,
    marginTop: 26,
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 20,
    minHeight: 110,
    // shadow-card
    shadowColor: "#1E2A4A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 26,
    elevation: 4,
  },
  textArea: {
    fontSize: 20,
    color: T.ink,
    lineHeight: 28,
    minHeight: 70,
  },

  // Parsed
  parsedEyebrow: {
    fontSize: 10.5,
    fontWeight: "600",
    color: T.textFaint,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginTop: 26,
    marginBottom: 12,
    paddingHorizontal: SCREEN_X,
  },
  parsedCard: {
    marginHorizontal: SCREEN_X,
    backgroundColor: T.surfaceRead,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: T.borderRead,
  },
  parsedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  parsedInfo: { flex: 1 },
  parsedMeta: {
    fontSize: 11,
    color: T.textMuted,
    letterSpacing: 0.3,
  },
  parsedValue: {
    fontSize: 15.5,
    fontWeight: "600",
    color: T.ink,
    marginTop: 1,
  },
  editLink: {
    fontSize: 14,
    fontWeight: "600",
    color: T.terracotta,
  },
  divider: {
    height: 1,
    backgroundColor: T.hairline,
    marginVertical: 4,
  },

  // Category
  catIndicator: {
    width: 10, height: 10, borderRadius: 5,
  },
  catDots: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  catDot: {
    width: 30, height: 30, borderRadius: 15,
  },
  catDotSelected: {
    borderWidth: 3,
    borderColor: T.ink,
  },
  catDotDimmed: {
    opacity: 0.3,
  },

  // More options
  moreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 22,
  },
  moreText: {
    fontSize: 14,
    color: T.textMuted,
  },

  // More options expanded
  moreCard: {
    marginHorizontal: SCREEN_X,
    marginTop: 12,
    backgroundColor: T.surfaceRead,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: T.borderRead,
  },
  moreSection: {
    gap: 12,
  },
  moreLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moreSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: T.ink,
  },
  recurrenceChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.surface,
  },
  recChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: T.textSecondary,
  },

  // Conflict
  conflictCard: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: SCREEN_X,
    marginTop: 16,
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  conflictTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 4,
  },
  conflictDetail: {
    fontSize: 12,
    color: "#92400E",
    lineHeight: 17,
  },
  conflictHint: {
    fontSize: 12,
    color: "#B45309",
    fontStyle: "italic",
    marginTop: 4,
  },

  // CTA
  ctaContainer: {
    paddingHorizontal: SCREEN_X,
    paddingBottom: Platform.OS === "ios" ? 12 : 22,
    paddingTop: 12,
    backgroundColor: T.bg,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.terracotta,
    paddingVertical: 18,
    borderRadius: 18,
    // shadow-cta
    shadowColor: T.terracotta,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 26,
    elevation: 8,
  },
  ctaBtnDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: T.white,
  },
  savedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EDF7F0",
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D0E8D6",
  },
  savedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3D6B5F",
  },
});
