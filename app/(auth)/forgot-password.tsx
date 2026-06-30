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
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, fontSize, fontWeight } from "@/theme";

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
    <SafeAreaView style={st.safe}>
      <KeyboardAvoidingView
        style={st.flex}
        behavior="padding"
      >
        <ScrollView
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={st.topHeader}>
            <Pressable onPress={() => router.back()} style={st.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {sent ? (
            <View style={st.successContainer}>
              <View style={st.successIcon}>
                <Ionicons name="mail-outline" size={48} color={colors.terracotta} />
              </View>
              <Text style={st.title}>{t("auth.forgotPw.successTitle")}</Text>
              <Text style={st.subtitle}>{t("auth.forgotPw.successSubtitle")}</Text>
              <TouchableOpacity
                style={st.primaryBtn}
                onPress={() => router.replace("/(auth)/login" as any)}
                activeOpacity={0.85}
              >
                <Text style={st.primaryBtnText}>{t("auth.forgotPw.backToLogin")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={st.title}>{t("auth.forgotPw.title")}</Text>
              <Text style={st.subtitle}>{t("auth.forgotPw.subtitle")}</Text>

              <Text style={[st.label, { marginTop: 32 }]}>{t("auth.forgotPw.emailLabel")}</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[st.input, errors.email && st.inputError]}
                    placeholder="tu@email.com"
                    placeholderTextColor={colors.fieldPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    autoFocus
                  />
                )}
              />
              {errors.email && <Text style={st.fieldError}>{errors.email.message}</Text>}

              {errors.root && <Text style={st.rootError}>{errors.root.message}</Text>}

              <TouchableOpacity
                style={st.primaryBtn}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={st.primaryBtnText}>{t("auth.forgotPw.submitBtn")}</Text>}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },

  topHeader: { paddingTop: 8, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: fontSize.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },

  label: { fontSize: fontSize.label, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: 6 },

  input: {
    height: 52,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    paddingHorizontal: 16,
    fontSize: fontSize.body,
    color: colors.ink,
    backgroundColor: colors.fieldBg,
  },
  inputError: { borderColor: colors.invalid },

  fieldError: { fontSize: fontSize.caption, color: colors.invalid, marginTop: 4 },
  rootError: { fontSize: fontSize.label, color: colors.invalid, marginTop: 12, textAlign: "center" },

  primaryBtn: {
    height: 54,
    borderRadius: radius.field,
    backgroundColor: colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  primaryBtnText: { fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold, color: "#FFFFFF", letterSpacing: 0.3 },

  successContainer: { flex: 1, alignItems: "center", paddingTop: 48 },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
});
