import { useRef, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useContextStore } from "./contextStore";

// ─── Opciones de energia ───────────────────────────────────────────────────────

const ENERGY_KEYS = [
  { level: 8, mood: 8, color: "#4CAF50", bg: "#F1F8F1", icon: "sunny-outline" as const,        key: "good"   as const },
  { level: 5, mood: 5, color: "#FFA726", bg: "#FFF8F0", icon: "partly-sunny-outline" as const, key: "medium" as const },
  { level: 2, mood: 2, color: "#EF5350", bg: "#FFF1F1", icon: "cloud-outline" as const,        key: "bad"    as const },
] as const;

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface DayCheckSheetProps {
  visible: boolean;
  date: string;    // "yyyy-MM-dd"
  onClose: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function DayCheckSheet({ visible, date, onClose }: DayCheckSheetProps) {
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(400)).current;
  const logDay    = useContextStore((s) => s.logDay);
  const existing  = useContextStore((s) => s.entries.find((e) => e.date === date));
  const ENERGY_OPTIONS = ENERGY_KEYS.map((o) => ({
    ...o,
    label: t(`dayCheck.energy.${o.key}.label`),
    hint:  t(`dayCheck.energy.${o.key}.hint`),
  }));

  const [selected, setSelected] = useState<number | null>(null);
  const [notes,    setNotes]    = useState("");
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    if (visible) {
      // Pre-fill if already logged today
      if (existing) {
        const opt = ENERGY_OPTIONS.find((o) => Math.abs(o.level - existing.energyLevel) < 3);
        setSelected(opt?.level ?? existing.energyLevel);
        setNotes(existing.notes ?? "");
      } else {
        setSelected(null);
        setNotes("");
      }
      setSaved(false);
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
    } else {
      Keyboard.dismiss();
      Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  function handleSave() {
    if (selected === null) return;
    const opt = ENERGY_OPTIONS.find((o) => o.level === selected)!;
    logDay({
      date,
      energyLevel: opt.level,
      mood: opt.mood,
      notes: notes.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => onClose(), 700);
  }

  const dateLabel = (() => {
    try {
      const [y, m, d] = date.split("-").map(Number);
      return format(new Date(y, m - 1, d), "EEEE d 'de' MMMM", { locale: es });
    } catch {
      return date;
    }
  })();

  const selectedOpt = ENERGY_OPTIONS.find((o) => o.level === selected);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity
        style={sh.backdrop}
        activeOpacity={1}
        onPress={() => { Keyboard.dismiss(); onClose(); }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={sh.kav}
        pointerEvents="box-none"
      >
        <Animated.View style={[sh.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={sh.handle} />

          {/* Header */}
          <View style={sh.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={sh.title}>
                {saved ? t('dayCheck.titleSaved') : existing ? t('dayCheck.titleUpdate') : t('dayCheck.titleNew')}
              </Text>
              <Text style={sh.subtitle}>{dateLabel}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#AAAAAA" />
            </TouchableOpacity>
          </View>

          {saved ? (
            /* ── Confirmacion ── */
            <View style={sh.savedBox}>
              <Ionicons
                name="checkmark-circle"
                size={52}
                color={selectedOpt?.color ?? "#4CAF50"}
              />
              <Text style={sh.savedTxt}>{t('dayCheck.savedText')}</Text>
            </View>
          ) : (
            <>
              {/* ── Opciones de energia ── */}
              <View style={sh.optionsRow}>
                {ENERGY_OPTIONS.map((opt) => {
                  const active = selected === opt.level;
                  return (
                    <TouchableOpacity
                      key={opt.level}
                      style={[
                        sh.optionCard,
                        { backgroundColor: active ? opt.color : opt.bg },
                        active && sh.optionCardActive,
                      ]}
                      onPress={() => setSelected(opt.level)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={26}
                        color={active ? "#FFFFFF" : opt.color}
                      />
                      <Text style={[sh.optionLabel, active && sh.optionLabelActive]}>
                        {opt.label}
                      </Text>
                      <Text style={[sh.optionHint, active && sh.optionHintActive]}>
                        {opt.hint}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Nota opcional ── */}
              {selected !== null && (
                <TextInput
                  style={sh.notesInput}
                  placeholder={t('dayCheck.notesPlaceholder')}
                  placeholderTextColor="#CCCCCC"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  maxLength={200}
                  returnKeyType="done"
                  blurOnSubmit
                />
              )}

              {/* ── Guardar ── */}
              <TouchableOpacity
                style={[
                  sh.saveBtn,
                  selected !== null
                    ? { backgroundColor: selectedOpt?.color }
                    : sh.saveBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={selected === null}
                activeOpacity={0.85}
              >
                <Text style={sh.saveBtnTxt}>
                  {existing ? t('dayCheck.updateBtn') : t('dayCheck.saveBtn')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const sh = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  kav:      { position: "absolute", bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 32,
    paddingTop: 14,
    gap: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 18,
  },
  handle: {
    alignSelf: "center", width: 40, height: 4,
    borderRadius: 2, backgroundColor: "#E0E0E0", marginBottom: 2,
  },

  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title:    { fontSize: 20, fontWeight: "700", color: "#2D2D2D" },
  subtitle: { fontSize: 13, color: "#AAAAAA", marginTop: 2, textTransform: "capitalize" },

  optionsRow: { flexDirection: "row", gap: 10 },
  optionCard: {
    flex: 1, borderRadius: 16, padding: 12, gap: 6,
    alignItems: "center",
    borderWidth: 0,
  },
  optionCardActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  optionLabel:       { fontSize: 12, fontWeight: "700", color: "#444444", textAlign: "center" },
  optionLabelActive: { color: "#FFFFFF" },
  optionHint:        { fontSize: 10, color: "#999999", textAlign: "center", lineHeight: 13 },
  optionHintActive:  { color: "rgba(255,255,255,0.8)" },

  notesInput: {
    borderWidth: 1, borderColor: "#EEEEEE", borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 14, color: "#2D2D2D", backgroundColor: "#FAFAFA",
    minHeight: 72, textAlignVertical: "top",
  },

  saveBtn: {
    paddingVertical: 15, borderRadius: 16, alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: "#EEEEEE" },
  saveBtnTxt:      { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  savedBox: { alignItems: "center", gap: 12, paddingVertical: 20 },
  savedTxt: { fontSize: 15, color: "#555555", textAlign: "center", lineHeight: 22 },
});
