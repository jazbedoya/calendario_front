import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Mascot } from "@/features/mascot/Mascot";
import { useMascotStore } from "@/features/mascot/mascotStore";

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState("Tuga");
  const { setMascotName, completeOnboarding } = useMascotStore();

  async function handleStart() {
    const trimmed = name.trim() || "Tuga";
    await setMascotName(trimmed);
    await completeOnboarding();
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topSection}>
          <Text style={styles.title}>{t('onboarding.title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

          <View style={styles.mascotBox}>
            <Mascot
              name={name.trim() || "Tuga"}
              mood="happy"
              message={t('onboarding.mascotMessage')}
            />
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.label}>{t('onboarding.nameLabel')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Tuga"
            placeholderTextColor="#B0B0B0"
            maxLength={20}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleStart}
          />

          <TouchableOpacity style={styles.button} onPress={handleStart} activeOpacity={0.85}>
            <Text style={styles.buttonText}>{t('onboarding.startBtn')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F7",
  },
  inner: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: "center",
    paddingTop: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2D2D2D",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B6B6B",
    textAlign: "center",
    lineHeight: 22,
  },
  mascotBox: {
    marginTop: 40,
    alignItems: "center",
  },
  bottomSection: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A4A4A",
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0DDD8",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#2D2D2D",
    backgroundColor: "#FFFFFF",
  },
  button: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
