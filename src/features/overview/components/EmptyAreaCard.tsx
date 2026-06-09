/**
 * EmptyAreaCard — tarjeta cálida de Tuga cuando un área lleva ≥7 días sin eventos.
 * Nunca culpabiliza, siempre invita.
 */
import { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { TugaAnimation } from "@/features/mascot/TugaAnimation";
import type { Layer } from "@/features/overview/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  layer:         Layer;
  accent:        string;
  accentLight:   string;
  onAddSomething: () => void;
  onDismiss:     () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function EmptyAreaCard({ layer, accent, accentLight, onAddSomething, onDismiss }: Props) {
  const { t } = useTranslation();

  const messages = t(`emptyArea.${layer}`, { returnObjects: true }) as string[];

  // Mensaje fijo mientras la tarjeta está montada (no cambia al re-render)
  const msgRef = useRef(messages[Math.floor(Math.random() * messages.length)]);

  return (
    <View style={[s.card, { backgroundColor: accentLight, borderColor: accent + "33" }]}>
      <View style={s.tugaWrap}>
        <TugaAnimation state="encouraging" size={80} loop />
      </View>

      <View style={s.textBlock}>
        <Text style={[s.message, { color: accent }]}>{msgRef.current}</Text>
      </View>

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.btnPrimary, { backgroundColor: accent }]}
          onPress={onAddSomething}
          activeOpacity={0.85}
        >
          <Text style={s.btnPrimaryTxt}>{t("emptyArea.addBtn")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btnSecondary} onPress={onDismiss} activeOpacity={0.7}>
          <Text style={[s.btnSecondaryTxt, { color: accent }]}>{t("emptyArea.dismissBtn")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tugaWrap: {
    width: 80,
    height: 80,
    overflow: "hidden",
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  actions: {
    flexShrink: 0,
    gap: 8,
    alignItems: "stretch",
  },
  btnPrimary: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  btnPrimaryTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  btnSecondary: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  btnSecondaryTxt: {
    fontSize: 12,
    fontWeight: "600",
  },
});
