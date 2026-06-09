import { View, Text, StyleSheet } from "react-native";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "@/i18n/dateLocale";

interface GreetingProps {
  userName: string;
}

export function Greeting({ userName }: GreetingProps) {
  const { t, i18n } = useTranslation();
  const hour = new Date().getHours();
  const greeting =
    hour < 13 ? t("home.greeting.morning") :
    hour < 20 ? t("home.greeting.afternoon") :
                t("home.greeting.evening");

  const today = new Date();
  const locale = getDateLocale(i18n.language);
  const dateStr = format(today, "EEEE, d 'de' MMMM", { locale });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.greeting}>
          {greeting}, {userName}
        </Text>
        <Text style={styles.date}>{capitalizedDate}</Text>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
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
