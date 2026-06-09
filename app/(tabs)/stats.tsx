import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useMascotStore }    from "@/features/mascot/mascotStore";
import { getMascotState }    from "@/features/mascot/getMascotState";
import { Mascot }            from "@/features/mascot/Mascot";
import { DailyTasksSection } from "@/features/tasks/DailyTasksSection";

export default function StatsScreen() {
  const { t } = useTranslation();
  const { mascotName } = useMascotStore();
  const mascotState    = getMascotState({ hourOfDay: new Date().getHours() });

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Tuga — estado según hora del día */}
        <View style={s.mascotCard}>
          <Mascot name={mascotName} mood={mascotState.mood} message={t(mascotState.messageKey)} />
        </View>

        {/* Tareas de hoy — contenido principal */}
        <DailyTasksSection />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: "#F8F6F2" },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },

  mascotCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

});
