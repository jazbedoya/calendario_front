import { StyleSheet, Text, View } from "react-native";
import { useGetStreak, useGetTodayTasks } from "./hooks";

export function StreakPill() {
  const { data: streakData }      = useGetStreak();
  const { data: todayTasks = [] } = useGetTodayTasks();

  const count            = streakData?.current_streak ?? 0;
  const todayDoneLocally = todayTasks.length > 0 && todayTasks.every((t) => t.done);

  // Misma lógica que StreakBadge: backend es la fuente de verdad.
  // Único caso optimista: hoy está completo localmente pero backend aún no actualizó.
  const displayCount = todayDoneLocally && count === 0 ? 1 : count;

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
