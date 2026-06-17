import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useGetStreak } from "./hooks";

export function StreakBadge() {
  const { t } = useTranslation();
  const { data } = useGetStreak();

  const count = data?.current_streak ?? 0;

  return (
    <View style={s.pill}>
      <Text style={s.txt}>
        {count > 0
          ? t("streak.badge", { count })
          : t("streak.start")}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    alignSelf: "center",
    backgroundColor: "#FFF4E6",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  txt: {
    fontSize: 13,
    fontWeight: "600",
    color: "#C8553D",
  },
});
