import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const LAYERS = [
  { key: "family", label: "FAMILIA", color: "#E8826B", route: "/family" as const },
  { key: "work", label: "TRABAJO", color: "#7A9B7A", route: "/work" as const },
  { key: "personal", label: "PERSONAL", color: "#8B86C9", route: "/personal" as const },
] as const;

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        {LAYERS.map((layer) => (
          <TouchableOpacity
            key={layer.key}
            onPress={() => router.push(layer.route)}
            style={{
              flex: 1,
              backgroundColor: layer.color,
              borderRadius: 16,
              justifyContent: "center",
              alignItems: "flex-start",
              paddingHorizontal: 32,
            }}
            activeOpacity={0.85}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#FFFFFF",
                letterSpacing: 1,
              }}
            >
              {layer.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
