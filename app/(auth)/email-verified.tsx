import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Mascot } from "@/features/mascot/Mascot";
import { Colors } from "@/lib/theme";

export default function EmailVerifiedScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Mascot name="" mood="happy" message="" size="large" showName={false} />
        <Text style={styles.title}>{t("auth.emailVerified.title")}</Text>
        <Text style={styles.subtitle}>{t("auth.emailVerified.subtitle")}</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace("/(auth)/login" as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{t("auth.emailVerified.loginBtn")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.midnight,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  btn: {
    marginTop: 8,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
