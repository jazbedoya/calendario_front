import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

export default function CalendarError() {
  const { t } = useTranslation();
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();

  const message =
    reason === "missing_calendar_scope"
      ? t('calendarError.missingScope')
      : t('calendarError.generic');

  useEffect(() => {
    const t = setTimeout(() => router.replace("/(tabs)/settings"), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF9F7",
    padding: 32,
  },
  icon: {
    fontSize: 40,
    marginBottom: 16,
  },
  message: {
    fontSize: 15,
    color: "#2D2D2D",
    textAlign: "center",
    lineHeight: 22,
  },
});
