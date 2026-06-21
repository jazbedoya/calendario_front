import { View, Text, StyleSheet } from "react-native";
import { format, getHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "@/i18n/dateLocale";
import { StreakPill } from "@/features/tasks/StreakPill";
import { colors, spacing, fontSize, fontWeight, letterSpacing } from "@/theme";

interface GreetingProps {
  userName: string;
}

export function Greeting({ userName }: GreetingProps) {
  const { t, i18n } = useTranslation();
  const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hour = getHours(toZonedTime(new Date(), deviceTz));
  const greeting =
    hour >= 5 && hour < 12 ? t("home.greeting.morning") :
    hour >= 12 && hour < 19 ? t("home.greeting.afternoon") :
    hour >= 19 && hour < 22 ? t("home.greeting.evening") :
                               t("home.greeting.night");

  const today = new Date();
  const locale = getDateLocale(i18n.language);
  const dayName = format(today, "EEEE", { locale });
  const dateNum = format(today, "d MMMM", { locale });
  const eyebrow = `${dayName.toUpperCase()}  ·  ${dateNum.toUpperCase()}`;

  return (
    <View style={s.container}>
      <View style={s.textBlock}>
        <Text style={s.eyebrow}>{eyebrow}</Text>
        <Text style={s.greeting}>
          {greeting},{"\n"}{userName}
        </Text>
      </View>
      <View style={s.rightSection}>
        <StreakPill />
        <View style={s.avatar}>
          <Text style={s.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: 10,
  },
  textBlock: {
    flex: 1,
  },
  eyebrow: {
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semibold,
    color: colors.textFaint,
    letterSpacing: letterSpacing.eyebrow,
    marginBottom: 6,
  },
  greeting: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    lineHeight: 38,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.personalTint,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: fontWeight.bold,
    color: colors.personal,
  },
});
