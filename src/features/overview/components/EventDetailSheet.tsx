import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Keyboard,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { parseISO, format } from "date-fns";
import { useLanguageStore } from "@/features/settings/languageStore";
import { getDateLocale } from "@/i18n/dateLocale";
import { formatInTimeZone } from "date-fns-tz";
import { LAYER_COLORS, type CalendarEvent } from "@/features/overview/types";

const RECURRENCE_LABEL_KEYS: Record<string, string> = {
  daily:   "eventSheet.recurrence.labelDaily",
  weekly:  "eventSheet.recurrence.labelWeekly",
  monthly: "eventSheet.recurrence.labelMonthly",
};

interface Props {
  visible:   boolean;
  event:     CalendarEvent | null;
  timezone:  string;
  onClose:   () => void;
  onEdit:    () => void;
  onDelete:  (deleteMode: "single" | "all") => void;
}

export function EventDetailSheet({ visible, event, timezone, onClose, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const language = useLanguageStore((s) => s.language);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
    } else {
      Keyboard.dismiss();
      Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  const accentColor = event ? LAYER_COLORS[event.layer] : '#AAAAAA';
  const isRecurring = !!(event?.recurrenceRule || event?.recurrenceParentId);

  if (!event) return null;

  const startDate = parseISO(event.startAt);
  const dateLabel = event.isAllDay
    ? format(startDate, t('dateFormat.dayMonthYear'), { locale: getDateLocale(language) })
    : format(startDate, t('dateFormat.dayMonth'), { locale: getDateLocale(language) }) +
      " · " + formatInTimeZone(event.startAt, timezone, "HH:mm");

  const endLabel = !event.isAllDay
    ? formatInTimeZone(event.endAt, timezone, "HH:mm")
    : null;

  function handleDelete() {
    if (isRecurring) {
      Alert.alert(
        t('eventSheet.deleteTitle'),
        t('eventSheet.deleteRecurringMsg'),
        [
          { text: t('common.cancel'), style: "cancel" },
          { text: t('eventSheet.deleteOnlyThis'), onPress: () => { onDelete("single"); onClose(); } },
          { text: t('eventSheet.deleteAllSeries'), style: "destructive", onPress: () => { onDelete("all"); onClose(); } },
        ],
      );
    } else {
      Alert.alert(
        t('eventSheet.deleteTitle'),
        t('eventSheet.deleteSingleMsg', { title: event?.title ?? '' }),
        [
          { text: t('common.cancel'), style: "cancel" },
          { text: t('common.delete'), style: "destructive", onPress: () => { onDelete("single"); onClose(); } },
        ],
      );
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Header: color dot + title + close */}
        <View style={s.headerRow}>
          <View style={[s.colorBar, { backgroundColor: accentColor }]} />
          <View style={s.titleBlock}>
            <Text style={s.title} numberOfLines={2}>{event.title}</Text>
            <Text style={s.dateLabel} numberOfLines={1}>
              {event.isAllDay ? dateLabel : `${dateLabel}${endLabel ? " – " + endLabel : ""}`}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color="#AAAAAA" />
          </TouchableOpacity>
        </View>

        {/* Meta chips */}
        <View style={s.metaRow}>
          <View style={[s.layerChip, { backgroundColor: accentColor + "20", borderColor: accentColor + "40" }]}>
            <View style={[s.layerDot, { backgroundColor: accentColor }]} />
            <Text style={[s.layerChipTxt, { color: accentColor }]}>{t(`layers.${event.layer}`)}</Text>
          </View>
          {isRecurring && (
            <View style={s.recurrenceChip}>
              <Ionicons name="repeat-outline" size={13} color="#888888" />
              <Text style={s.recurrenceChipTxt}>
                {t(RECURRENCE_LABEL_KEYS[event.recurrenceRule ?? "weekly"] ?? "eventSheet.recurrence.labelWeekly")}
              </Text>
            </View>
          )}
          {event.isAllDay && (
            <View style={s.allDayChip}>
              <Text style={s.allDayChipTxt}>{t('calendar.allDay')}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {event.description ? (
          <View style={s.descBlock}>
            <Ionicons name="document-text-outline" size={15} color="#BBBBBB" />
            <Text style={s.descTxt}>{event.description}</Text>
          </View>
        ) : null}

        {/* Location */}
        {event.location ? (
          <View style={s.descBlock}>
            <Ionicons name="location-outline" size={15} color="#BBBBBB" />
            <Text style={s.descTxt}>{event.location}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: accentColor }]}
            onPress={() => { onClose(); setTimeout(onEdit, 250); }}
            activeOpacity={0.85}
          >
            <Ionicons name="pencil-outline" size={17} color="#FFFFFF" />
            <Text style={s.actionBtnTxt}>{t('common.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnDanger]}
            onPress={handleDelete}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={17} color="#E05252" />
            <Text style={[s.actionBtnTxt, s.actionBtnTxtDanger]}>{t('common.delete')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },

  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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

  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  colorBar:  { width: 4, borderRadius: 2, alignSelf: "stretch", minHeight: 40 },
  titleBlock: { flex: 1 },
  title:     { fontSize: 18, fontWeight: "700", color: "#1A1A1A", lineHeight: 24 },
  dateLabel: { fontSize: 13, color: "#888888", marginTop: 3, textTransform: "capitalize" },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  layerChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  layerDot:     { width: 7, height: 7, borderRadius: 3.5 },
  layerChipTxt: { fontSize: 13, fontWeight: "600" },
  recurrenceChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: "#F5F5F5",
  },
  recurrenceChipTxt: { fontSize: 12, color: "#888888", fontWeight: "500" },
  allDayChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: "#F0F4FF",
  },
  allDayChipTxt: { fontSize: 12, color: "#4A6FA5", fontWeight: "500" },

  descBlock: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  descTxt:   { flex: 1, fontSize: 14, color: "#555555", lineHeight: 20 },

  actions: { flexDirection: "row", gap: 12, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 16,
  },
  actionBtnDanger: { backgroundColor: "#FFF0F0", borderWidth: 1.5, borderColor: "#FCDADA" },
  actionBtnTxt:       { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  actionBtnTxtDanger: { color: "#E05252" },
});
