import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SmartAddSheet } from "./SmartAddSheet";

interface Props {
  accent:    string;
  onAdd:     (text: string) => void;
  disabled?: boolean;
  onFocus?:  () => void;
}

export function AddTask({ accent, disabled }: Props) {
  const { t } = useTranslation();
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[s.pill, { borderColor: accent + "40" }]}
        onPress={() => setSheetVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={18} color={accent} />
        <Text style={[s.pillTxt, { color: accent }]}>
          {t('tasks.addPlaceholder')}
        </Text>
      </TouchableOpacity>

      <SmartAddSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed",
    backgroundColor: "#FAFAF9",
  },
  pillTxt: { fontSize: 14, fontWeight: "500" },
});
