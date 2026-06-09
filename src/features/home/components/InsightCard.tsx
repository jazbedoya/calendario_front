import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InsightData } from "../types";

interface InsightCardProps {
  insight: InsightData;
}

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: insight.backgroundColor }]}>
      <Ionicons
        name={insight.iconName as keyof typeof Ionicons.glyphMap}
        size={20}
        color={insight.textColor}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: insight.textColor }]}>{insight.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  icon: {
    marginBottom: 10,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
});
