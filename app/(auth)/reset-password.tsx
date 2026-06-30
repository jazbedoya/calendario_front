import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
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
import { resetPasswordApi } from "@/features/auth/api";
import { colors, radius, fontSize, fontWeight } from "@/theme";

type FormData = { token: string; password: string; confirm: string };

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const schema = z
    .object({
      token: z.string().min(1, t("auth.validation.required")),
      password: z.string().min(8, t("auth.validation.minChars_other", { count: 8 })),
      confirm: z.string().min(1, t("auth.validation.required")),
    })
    .refine((d) => d.password === d.confirm, {
      message: t("auth.resetPw.errorMismatch"),
      path: ["confirm"],
    });

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { token: tokenParam ?? "", password: "", confirm: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await resetPasswordApi(data.token, data.password);
      Alert.alert(
        t("auth.resetPw.title"),
        t("auth.forgotPw.backToLogin"),
        [{ text: "OK", onPress: () => router.replace("/(auth)/login" as any) }]
      );
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) {
        setError("root", { message: t("auth.resetPw.errorToken") });
      } else {
        setError("root", { message: t("auth.errors.connectionError") });
      }
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

          <Text style={st.title}>{t("auth.resetPw.title")}</Text>
          <Text style={st.subtitle}>{t("auth.resetPw.subtitle")}</Text>

          {!tokenParam && (
            <>
              <Text style={[st.label, { marginTop: 32 }]}>{t("auth.resetPw.tokenLabel")}</Text>
              <Controller
                control={control}
                name="token"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[st.input, errors.token && st.inputError]}
                    placeholder={t("auth.resetPw.tokenPlaceholder")}
                    placeholderTextColor={colors.fieldPlaceholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                  />
                )}
              />
              {errors.token && <Text style={st.fieldError}>{errors.token.message}</Text>}
            </>
          )}

          <Text style={[st.label, { marginTop: tokenParam ? 32 : 16 }]}>
            {t("auth.resetPw.passwordLabel")}
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={[st.passwordRow, errors.password && st.inputError]}>
                <TextInput
                  style={st.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={colors.fieldPlaceholder}
                  secureTextEntry={!showPassword}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.fieldIcon} />
                </Pressable>
              </View>
            )}
          />
          {errors.password && <Text style={st.fieldError}>{errors.password.message}</Text>}

          <Text style={[st.label, st.labelSpaced]}>{t("auth.resetPw.confirmLabel")}</Text>
          <Controller
            control={control}
            name="confirm"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={[st.passwordRow, errors.confirm && st.inputError]}>
                <TextInput
                  style={st.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={colors.fieldPlaceholder}
                  secureTextEntry={!showConfirm}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={8}>
                  <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={colors.fieldIcon} />
                </Pressable>
              </View>
            )}
          />
          {errors.confirm && <Text style={st.fieldError}>{errors.confirm.message}</Text>}

          {errors.root && <Text style={st.rootError}>{errors.root.message}</Text>}

          <TouchableOpacity
            style={st.primaryBtn}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={st.primaryBtnText}>{t("auth.resetPw.submitBtn")}</Text>}
          </TouchableOpacity>
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
  },

  label: { fontSize: fontSize.label, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: 6 },
  labelSpaced: { marginTop: 16 },

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

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    paddingHorizontal: 16,
    backgroundColor: colors.fieldBg,
  },
  passwordInput: { flex: 1, fontSize: fontSize.body, color: colors.ink },

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
});
