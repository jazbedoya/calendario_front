import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function AboutScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t("about.title")}</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.card}>
          <Text style={s.cardTitle}>{t("about.app")}</Text>
          <Text style={s.cardBody}>Avante · Calendario 2026</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{t("about.animations")}</Text>
          <Text style={s.cardBody}>{t("about.animationsCredit")}</Text>
          <View style={s.divider} />
          <Text style={s.cardBody}>{t("about.animationsWalkingCredit")}</Text>
        </View>

        <Text style={s.legal}>© 2026 Avante</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: "#F8F6F2" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn:     { width: 36 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },

  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, gap: 16 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 11, fontWeight: "700", color: "#666666", textTransform: "uppercase", letterSpacing: 1.2 },
  cardBody:  { fontSize: 14, color: "#444444", lineHeight: 22 },
  divider:   { height: StyleSheet.hairlineWidth, backgroundColor: "#EFEFEF" },

  legal: { textAlign: "center", fontSize: 12, color: "#BBBBBB", marginTop: 8 },
});
