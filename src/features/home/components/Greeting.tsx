import { View, Text, StyleSheet } from "react-native";
import { format, getHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "@/i18n/dateLocale";
import { useAuthStore } from "@/stores/authStore";
import { StreakPill } from "@/features/tasks/StreakPill";

interface GreetingProps {
  userName: string;
}

export function Greeting({ userName }: GreetingProps) {
  const { t, i18n } = useTranslation();
  const user      = useAuthStore((s) => s.user);
  const timezone  = user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hour      = getHours(toZonedTime(new Date(), timezone));
  const greeting  =
    hour >= 5  && hour < 12 ? t("home.greeting.morning") :
    hour >= 12 && hour < 19 ? t("home.greeting.afternoon") :
    hour >= 19 && hour < 22 ? t("home.greeting.evening") :
                               t("home.greeting.night");

  const today = new Date();
  const locale = getDateLocale(i18n.language);
  const dateStr = format(today, t('dateFormat.dayMonth'), { locale });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.greeting}>
          {greeting}, {userName}
        </Text>
        <Text style={styles.date}>{capitalizedDate}</Text>
      </View>
      <StreakPill />
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 10,
  },
  textBlock: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  date: {
    fontSize: 14,
    color: "#8A8A8A",
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EBE8F5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5B5193",
  },
});
