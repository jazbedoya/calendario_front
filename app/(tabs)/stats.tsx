import { useRef } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useMascotStore }    from "@/features/mascot/mascotStore";
import { getMascotState }    from "@/features/mascot/getMascotState";
import { useMascotMessage }  from "@/features/mascot/useMascotMessage";
import { Mascot }            from "@/features/mascot/Mascot";
import { useAuthStore }      from "@/stores/authStore";
import { DailyTasksSection } from "@/features/tasks/DailyTasksSection";
import { StreakBadge }       from "@/features/tasks/StreakBadge";

export default function StatsScreen() {
  const { mascotName } = useMascotStore();
  const user           = useAuthStore((s) => s.user);
  const timezone       = user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour      = getHours(toZonedTime(new Date(), timezone));
  const mascotState    = getMascotState({ hourOfDay: localHour });
  const mascotMessage  = useMascotMessage(mascotState.messageKey);

  const scrollRef = useRef<ScrollView>(null);

  const handleInputFocus = () => {
    // Espera al frame siguiente para que el teclado haya empezado a aparecer
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tuga — estado según hora del día */}
          <View style={s.mascotCard}>
            <Mascot name={mascotName} mood={mascotState.mood} message={mascotMessage} />
            <StreakBadge />
          </View>

          {/* Tareas de hoy — contenido principal */}
          <DailyTasksSection onInputFocus={handleInputFocus} />

          {/* Padding extra para que el input quede holgado sobre el teclado */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: "#F8F6F2" },
  flex:   { flex: 1 },
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
