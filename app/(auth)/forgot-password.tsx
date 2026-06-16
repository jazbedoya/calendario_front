import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { forgotPasswordApi } from "@/features/auth/api";
import { Colors } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";

type FormData = { email: string };

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [sent, setSent] = useState(false);

  const schema = z.object({
    email: z.string().email(t("auth.validation.emailInvalid")),
  });

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = async (data: FormData) => {
    try {
      await forgotPasswordApi(data.email);
      setSent(true);
    } catch {
      setError("root", { message: t("auth.errors.connectionError") });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topHeader}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>

          {sent ? (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="mail-outline" size={48} color={Colors.primary} />
              </View>
              <Text style={styles.title}>{t("auth.forgotPw.successTitle")}</Text>
              <Text style={styles.subtitle}>{t("auth.forgotPw.successSubtitle")}</Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.replace("/(auth)/login" as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>{t("auth.forgotPw.backToLogin")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>{t("auth.forgotPw.title")}</Text>
              <Text style={styles.subtitle}>{t("auth.forgotPw.subtitle")}</Text>

              <Text style={[styles.label, { marginTop: 32 }]}>{t("auth.forgotPw.emailLabel")}</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="tu@email.com"
                    placeholderTextColor={Colors.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    autoFocus
                  />
                )}
              />
              {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}

              {errors.root && <Text style={styles.rootError}>{errors.root.message}</Text>}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>{t("auth.forgotPw.submitBtn")}</Text>}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },

  topHeader: { paddingTop: 8, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
    color: Colors.midnight,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },

  label: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary, marginBottom: 6 },

  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.inputBg,
  },
  inputError: { borderColor: Colors.error },

  fieldError: { fontSize: 12, color: Colors.error, marginTop: 4 },
  rootError: { fontSize: 13, color: Colors.error, marginTop: 12, textAlign: "center" },

  primaryBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },

  successContainer: { flex: 1, alignItems: "center", paddingTop: 48 },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
});
