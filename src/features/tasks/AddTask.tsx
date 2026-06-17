import { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface Props {
  accent:    string;
  onAdd:     (text: string) => void;
  disabled?: boolean;
  onFocus?:  () => void;
}

export function AddTask({ accent, onAdd, disabled, onFocus }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  function handleOpen() {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
    onFocus?.();
  }

  const [saved, setSaved] = useState(false);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onAdd(trimmed);
    setText("");
    setExpanded(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleBlur() {
    if (!text.trim()) setExpanded(false);
  }

  if (!expanded) {
    return (
      <TouchableOpacity
        style={[s.pill, saved ? { borderColor: "#4CAF50" + "60", backgroundColor: "#F1F8F1" } : { borderColor: accent + "40" }]}
        onPress={handleOpen}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name={saved ? "checkmark" : "add"} size={18} color={saved ? "#4CAF50" : accent} />
        <Text style={[s.pillTxt, { color: saved ? "#4CAF50" : accent }]}>
          {saved ? t('tasks.savedConfirm') : t('tasks.addPlaceholder')}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.row}>
      <TextInput
        ref={inputRef}
        style={s.input}
        placeholder={t('tasks.addPlaceholder')}
        placeholderTextColor="#CCCCCC"
        value={text}
        onChangeText={setText}
        returnKeyType="done"
        onSubmitEditing={submit}
        onBlur={handleBlur}
        editable={!disabled}
        maxLength={200}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[s.btn, { backgroundColor: accent }, !text.trim() && s.btnDisabled]}
        onPress={submit}
        disabled={!text.trim() || disabled}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
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

  row: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFFFFF", borderRadius: 14,
    borderWidth: 1.5, borderColor: "#EEEEEE",
    paddingVertical: 4, paddingLeft: 14, paddingRight: 6,
  },
  input: { flex: 1, fontSize: 15, color: "#2D2D2D", paddingVertical: 10 },
  btn: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  btnDisabled: { opacity: 0.35 },
});
