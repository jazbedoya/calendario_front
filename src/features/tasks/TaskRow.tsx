import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { DailyTask } from "./api";

interface Props {
  task:       DailyTask;
  accent:     string;
  onToggle:   () => void;
  onDelete:   () => void;
  isLast:     boolean;
}

export function TaskRow({ task, accent, onToggle, onDelete, isLast }: Props) {
  const { t } = useTranslation();

  function confirmDelete() {
    Alert.alert(
      t("tasks.deleteTitle"),
      t("tasks.deleteMsg", { task: task.text }),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("tasks.deleteConfirm"), style: "destructive", onPress: onDelete },
      ],
    );
  }

  return (
    <View style={[s.row, !isLast && s.border]} accessibilityRole="none">
      {/* Checkbox */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.75}
        style={[s.checkbox, task.done && { backgroundColor: accent, borderColor: accent }]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.done }}
        accessibilityLabel={task.text}
      >
        {task.done && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
      </TouchableOpacity>

      {/* Text */}
      <Text
        style={[s.label, task.done && s.labelDone]}
        onPress={onToggle}
        numberOfLines={2}
      >
        {task.text}
      </Text>

      {/* Delete */}
      <TouchableOpacity
        onPress={confirmDelete}
        style={s.del}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t("tasks.deleteLabel", { task: task.text })}
      >
        <Ionicons name="trash-outline" size={15} color="#D4CEC8" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row:       { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  border:    { borderBottomWidth: 1, borderBottomColor: "#F5F3F1" },
  checkbox:  {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: "#D4CEC8",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  label:     { flex: 1, fontSize: 15, color: "#1A1A1A", fontWeight: "500", lineHeight: 21 },
  labelDone: { color: "#BBBBBB", textDecorationLine: "line-through" },
  del:       { padding: 2 },
});
