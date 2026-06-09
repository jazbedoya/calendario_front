import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LifeAreaSummary } from "../types";

interface LifeAreaCardProps {
  area: LifeAreaSummary;
  onPress: () => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function LifeAreaCard({ area, onPress }: LifeAreaCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: area.color, borderBottomColor: "#FFFFFF" }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={[styles.iconCircle, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
        <Ionicons
          name={area.iconName as keyof typeof Ionicons.glyphMap}
          size={24}
          color="#FFFFFF"
        />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: "#FFFFFF" }]}>{area.title}</Text>
        <Text style={[styles.subtitle, { color: "#FFFFFF" }]}>{area.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D2D2D",
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 13,
    color: "#8A8A8A",
    marginTop: 3,
  },
});
