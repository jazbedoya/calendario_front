import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useGetStreak, useGetTodayTasks } from "./hooks";
import { getLocalStreak } from "./useStreak";

export function StreakPill() {
  const { data: streakData }      = useGetStreak();
  const { data: todayTasks = [] } = useGetTodayTasks();
  const [localStreak, setLocalStreak] = useState(0);

  useEffect(() => {
    getLocalStreak().then(setLocalStreak);
  }, []);

  const backendCount     = streakData?.current_streak ?? 0;
  const todayDoneLocally = todayTasks.length > 0 && todayTasks.every((t) => t.done);

  // Si el backend ya respondió con datos, usarlo siempre (consistente con StreakBadge).
  // Solo fallback a SecureStore/local si el backend aún no tiene datos (= 0).
  const displayCount = backendCount > 0
    ? backendCount
    : Math.max(localStreak, todayDoneLocally ? 1 : 0);

  if (displayCount === 0) return null;

  return (
    <View style={s.pill} pointerEvents="none">
      <Text style={s.text}>🔥 {displayCount}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    backgroundColor: "#FFF4E6",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#FFD9B0",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: "#C8553D",
    letterSpacing: 0.1,
  },
});
