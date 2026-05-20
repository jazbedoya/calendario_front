import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function TRABAJOScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <View style={{ flex: 1, padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: "#7A9B7A", fontSize: 16 }}>← Volver</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 32, fontWeight: "700", color: "#7A9B7A" }}>TRABAJO</Text>
        <Text style={{ color: "#666", marginTop: 8 }}>Próximamente — Sprint 3/4</Text>
      </View>
    </SafeAreaView>
  );
}
