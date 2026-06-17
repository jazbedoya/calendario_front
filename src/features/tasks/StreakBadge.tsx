import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { startOfWeek, addDays, isToday, isFuture } from "date-fns";
import { useGetStreak } from "./hooks";
import { useLanguageStore } from "@/features/settings/languageStore";
import { getDateLocale } from "@/i18n/dateLocale";
import { format } from "date-fns";

// Monday-anchored week day initials via date-fns locale
function useWeekInitials(): string[] {
  const language = useLanguageStore((s) => s.language);
  const locale   = getDateLocale(language);
  const monday   = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(monday, i), "EEEEE", { locale })
  );
}

export function StreakBadge() {
  const { t }      = useTranslation();
  const { data }   = useGetStreak();
  const initials   = useWeekInitials();

  const count    = data?.current_streak ?? 0;
  const weekDone = data?.week_done ?? Array(7).fill(false);

  // Index of today in Mon–Sun week (0=Mon … 6=Sun)
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <View style={s.container}>
      {/* Day circles */}
      <View style={s.row}>
        {initials.map((label, i) => {
          const done    = weekDone[i];
          const isToday_ = i === todayIdx;
          const future  = i > todayIdx;

          return (
            <View key={i} style={s.dayCol}>
              <View style={[
                s.circle,
                done      && s.circleDone,
                isToday_  && !done && s.circleToday,
                future    && s.circleFuture,
              ]}>
                <Text style={[
                  s.fireOrDot,
                  future && s.fireFuture,
                ]}>
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

      {/* Streak count */}
      <Text style={s.caption}>
        {count > 0
          ? t("streak.badge", { count })
          : t("streak.start")}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 6,
  },
  dayCol: {
    alignItems: "center",
    gap: 4,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3EDE9",
    justifyContent: "center",
    alignItems: "center",
  },
  circleDone: {
    backgroundColor: "#FFF0E0",
  },
  circleToday: {
    borderWidth: 2,
    borderColor: "#C8553D",
    backgroundColor: "#FFF8F6",
  },
  circleFuture: {
    backgroundColor: "#F5F5F5",
  },
  fireOrDot: {
    fontSize: 16,
  },
  fireFuture: {
    color: "#DDDDDD",
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#AAAAAA",
    textTransform: "uppercase",
  },
  dayLabelFuture: {
    color: "#D0D0D0",
  },
  caption: {
    fontSize: 13,
    fontWeight: "600",
    color: "#C8553D",
    marginTop: 2,
  },
});
