import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { startOfWeek, addDays } from "date-fns";
import { format } from "date-fns";
import { useGetStreak, useGetTodayTasks } from "./hooks";
import { useLanguageStore } from "@/features/settings/languageStore";
import { getDateLocale } from "@/i18n/dateLocale";

function useWeekInitials(): string[] {
  const language = useLanguageStore((s) => s.language);
  const locale   = getDateLocale(language);
  const monday   = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(monday, i), "EEEEE", { locale })
  );
}

export function StreakBadge() {
  const { t }    = useTranslation();
  const initials = useWeekInitials();

  const { data: streakData }         = useGetStreak();
  const { data: todayTasks = [] }    = useGetTodayTasks();

  // Index of today in Mon–Sun week (0=Mon … 6=Sun)
  const todayIdx = (new Date().getDay() + 6) % 7;

  // If all today's tasks are done locally, mark today immediately
  const todayDoneLocally =
    todayTasks.length > 0 && todayTasks.every((t) => t.done);

  const weekDone: boolean[] = (streakData?.week_done ?? Array(7).fill(false))
    .map((v: boolean, i: number) => (i === todayIdx && todayDoneLocally) ? true : v);

  const count = streakData?.current_streak ?? 0;
  // If today is locally done but count still 0 (backend not yet updated), show at least 1
  const displayCount = todayDoneLocally && count === 0 ? 1 : count;

  return (
    <View style={s.container}>
      <View style={s.row}>
        {initials.map((label, i) => {
          const done    = weekDone[i];
          const isToday = i === todayIdx;
          const future  = i > todayIdx;

          return (
            <View key={i} style={s.dayCol}>
              <View style={[
                s.circle,
                done     && s.circleDone,
                isToday  && !done && s.circleToday,
                future   && s.circleFuture,
              ]}>
                <Text style={[s.fireOrDot, future && s.fireFuture]}>
                  {done ? "🔥" : "·"}
                </Text>
              </View>
              <Text style={[s.dayLabel, future && s.dayLabelFuture]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={s.caption}>
        {displayCount > 0
          ? t("streak.badge", { count: displayCount })
          : t("streak.start")}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: "center", marginTop: 12, gap: 8 },
  row:       { flexDirection: "row", gap: 6 },
  dayCol:    { alignItems: "center", gap: 4 },

  circle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F3EDE9",
    justifyContent: "center", alignItems: "center",
  },
  circleDone:   { backgroundColor: "#FFF0E0" },
  circleToday:  { borderWidth: 2, borderColor: "#C8553D", backgroundColor: "#FFF8F6" },
  circleFuture: { backgroundColor: "#F5F5F5" },

  fireOrDot:  { fontSize: 16 },
  fireFuture: { color: "#DDDDDD" },

  dayLabel:       { fontSize: 11, fontWeight: "600", color: "#AAAAAA", textTransform: "uppercase" },
  dayLabelFuture: { color: "#D0D0D0" },

  caption: { fontSize: 13, fontWeight: "600", color: "#C8553D", marginTop: 2 },
});
