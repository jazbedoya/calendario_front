import { useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  accent:   string;
  onAdd:    (text: string) => void;
  disabled?: boolean;
}

export function AddTask({ accent, onAdd, disabled }: Props) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onAdd(trimmed);
    setText("");
    // Keep focus so the user can immediately type the next task
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const canAdd = !!text.trim() && !disabled;

  return (
    <View style={s.row}>
      <TextInput
        ref={inputRef}
        style={s.input}
        placeholder="Escribe una tarea..."
        placeholderTextColor="#CCCCCC"
        value={text}
        onChangeText={setText}
        returnKeyType="done"
        onSubmitEditing={submit}
        editable={!disabled}
        maxLength={200}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[s.btn, { backgroundColor: accent }, !canAdd && s.btnDisabled]}
        onPress={submit}
        disabled={!canAdd}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
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
