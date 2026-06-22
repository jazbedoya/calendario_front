import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { capture } from "@/lib/analytics";

export default function CalendarConnected() {
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["calendar-status"] });
    capture("google_calendar_connected");
    const t = setTimeout(() => router.replace("/(tabs)/settings"), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7A9B7A" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF9F7",
  },
});
