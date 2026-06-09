import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "@/stores/authStore";

export default function Root() {
  const { initialize, isAuthenticated } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize().then(() => setReady(true));
  }, [initialize]);

  if (!ready) {
    return (
      <View className="flex-1 justify-center items-center bg-[#FAF9F7]">
        <ActivityIndicator color="#A0432B" />
      </View>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target = (isAuthenticated ? "/(tabs)" : "/(auth)/login") as any;
  return <Redirect href={target} />;
}
